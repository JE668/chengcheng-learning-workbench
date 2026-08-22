/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— edge-tts Python 包本地合成
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 合成链路：
 *   1) edge-tts Python 本地合成（首选）—— subprocess 调用 Python 的 edge-tts 包。
 *      Python edge-tts 包从住宅 IP 直连 speech.platform.bing.com（WebSocket），
 *      不受数据中心 IP（Vercel/AWS/GCP）限制。容器运行在 NAS 住宅宽带上。
 *      延迟 ~300-600ms（含 Python 进程启动开销），音质为微软神经嗓音（晓晓/Aria）。
 *
 *   2) 浏览器 Web Speech（前端降级）—— edge-tts 失败时，speak.ts 触发。
 *
 * 为什么用 edge-tts 而非 Kokoro：
 *   - Kokoro CPU 推理 5s+，远超 edge-tts 的 ~300-600ms
 *   - Edge TTS 神经嗓音（晓晓/Aria）音质优于 Kokoro
 *   - edge-tts 零模型下载，零磁盘占用，完全依赖微软在线服务
 *   - MX150 GPU 不兼容新版 Kokoro 模型（硬件天花板）
 *
 * 为什么用 Python subprocess 而非 Node.js WebSocket 直连：
 *   - Node.js WebSocket 从 NAS 住宅 IP 也被微软拒 403（可能是 UA/header 被识别）
 *   - Python edge-tts 包使用 urllib3 + asyncio 直连，WebSocket 握手参数不同
 *     住宅 IP 可正常通过。实测从 NAS 容器内 subprocess 调用成功。
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { spawn } from 'node:child_process';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 };

const ttsCache = new Map<string, { data: Buffer; type: string }>();
const TTS_CACHE_MAX = 500;

function ttsCacheKey(text: string, lang: string, rate: string, pause: number): string {
  return `${lang}|${rate}|${pause}|${text}`;
}

/**
 * 通过 Python edge-tts 包合成音频。
 *
 * edge-tts 包的 API：
 *   from edge_tts import Communicate
 *   communicate = Communicate(text=text, voice=voice, rate=rate)
 *   data = await communicate.synthesize()  # 返回 bytes
 *
 * 我们用 subprocess 调用，输出 base64 音频。
 */
async function synthesizeWithEdgeTTS(
  text: string,
  lang: 'zh' | 'en',
  rate: string,
  pause: number,
): Promise<{ data: Buffer; type: string }> {
  const voice = VOICE_EDGE[lang];
  const rateStr = rate; // edge-tts 接受 '-45%' 格式

  // 用 Python subprocess 调用 edge-tts
  // 脚本输出 base64 编码的 MP3
  const pyScript = `
import asyncio, base64, sys
from edge_tts import Communicate

async def main():
    text = sys.argv[1]
    voice = sys.argv[2]
    rate = sys.argv[3]
    communicate = Communicate(text=text, voice=voice, rate=rate)
    data = await communicate.synthesize()
    print(base64.b64encode(data).decode())

asyncio.run(main())
`;

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', ['-c', pyScript, text, voice, rateStr], {
      timeout: 12000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (e) => reject(new Error(`python edge-tts spawn error: ${e.message}`)));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`python edge-tts exit code=${code}, stderr: ${stderr.slice(0, 300)}`));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error('python edge-tts returned empty output'));
        return;
      }
      try {
        const data = Buffer.from(stdout.trim(), 'base64');
        resolve({ data, type: 'audio/mpeg' });
      } catch (e) {
        reject(new Error(`python edge-tts base64 decode failed: ${e}`));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`tts:${ip}`, TTS_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `语音朗读太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

  let text = '';
  let lang: 'zh' | 'en' = 'zh';
  let rate = '';
  let pause = 0;
  try {
    const body = await safeJson(req, {});
    text = typeof body.text === 'string' ? body.text : '';
    lang = body.lang === 'en' ? 'en' : 'zh';
    if (typeof body.rate === 'string' && body.rate.trim()) rate = body.rate.trim();
    if (typeof body.pause === 'number' && Number.isFinite(body.pause)) {
      pause = Math.max(0, Math.min(2000, Math.round(body.pause)));
    }
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  if (text.length > 500) text = text.slice(0, 500);
  if (!rate) rate = '-45%';

  const cacheKey = ttsCacheKey(text, lang, rate, pause);
  const hit = ttsCache.get(cacheKey);
  if (hit) {
    ttsCache.delete(cacheKey);
    ttsCache.set(cacheKey, hit);
    return new NextResponse(new Uint8Array(hit.data), {
      status: 200,
      headers: { 'content-type': hit.type, 'cache-control': 'public, max-age=86400' },
    });
  }

  try {
    const result = await synthesizeWithEdgeTTS(text, lang, rate, pause);

    if (ttsCache.size >= TTS_CACHE_MAX) {
      const oldest = ttsCache.keys().next().value;
      if (oldest !== undefined) ttsCache.delete(oldest);
    }
    ttsCache.set(cacheKey, { data: result.data, type: result.type });

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        'content-type': result.type,
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[tts] edge-tts 失败，前端降级 Web Speech：', msg);
    return NextResponse.json({ error: 'tts failed', reason: msg }, { status: 502 });
  }
}