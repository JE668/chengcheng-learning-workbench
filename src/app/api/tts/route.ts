/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— edge-tts Python 包本地合成
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 技术路线（已验证从 NAS 广东电信住宅 IP 可用）：
 *   Python edge-tts 包 subprocess 调用：
 *     - WebSocket 直连 speech.platform.bing.com（Chromium 143 headers）
 *     - Sec-MS-GEC 令牌通过时间戳 + SHA256 计算，无需 edge.microsoft.com
 *     - stream() 获取 MP3 音频块，base64 输出
 *
 * 延迟：~300-600ms（含 Python 进程启动开销），内存缓存命中秒回。
 *
 * 为什么用 Python subprocess 而非 Node.js WebSocket：
 *   - Node.js ws 包从 NAS 住宅 IP 返回 403（被微软识别为非浏览器流量）
 *   - Python edge-tts 使用 aiohttp + 完整 Chromium 143 浏览器特征
 *     住宅 IP 可正常通过。
 *
 * 降级：edge-tts 失败时，前端 speak.ts 自动降级到 Web Speech。
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
 * 输出：stdout 为 base64 编码的 MP3 音频。
 * 参数通过 sys.argv 传递，避免 shell 转义问题。
 */
async function synthesizeWithEdgeTTS(
  text: string,
  voice: string,
  rate: string,
): Promise<Buffer> {
  const pyScript = `
import asyncio, base64, io, sys
from edge_tts import Communicate

async def main():
    c = Communicate(text=sys.argv[1], voice=sys.argv[2], rate=sys.argv[3])
    data = io.BytesIO()
    async for chunk in c.stream():
        if chunk['type'] == 'audio':
            data.write(chunk['data'])
    print(base64.b64encode(data.getvalue()).decode())

asyncio.run(main())
`;

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', ['-c', pyScript, text, voice, rate], {
      timeout: 12000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (e) => {
      reject(new Error(`edge-tts spawn error: ${e.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`edge-tts exit code=${code}, stderr: ${stderr.slice(0, 500)}`));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error('edge-tts returned empty output'));
        return;
      }
      try {
        const data = Buffer.from(stdout.trim(), 'base64');
        if (data.length < 50) {
          reject(new Error(`edge-tts returned only ${data.length} bytes`));
          return;
        }
        resolve(data);
      } catch (e) {
        reject(new Error(`edge-tts base64 decode failed: ${e}`));
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

  // ⚠️ 2026-08-22 修复：edge-tts 对 SSML <break> 标签处理不稳定，
  // 会将 pause 时长当作文本朗读出来（如"400毫秒"）。
  // 暂停由客户端在播放结束后通过 setTimeout 处理，此处不嵌入 SSML。
  const textWithPause = text.trim();
  const voice = VOICE_EDGE[lang];

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
    const buffer = await synthesizeWithEdgeTTS(textWithPause, voice, rate);

    if (ttsCache.size >= TTS_CACHE_MAX) {
      const oldest = ttsCache.keys().next().value;
      if (oldest !== undefined) ttsCache.delete(oldest);
    }
    ttsCache.set(cacheKey, { data: buffer, type: 'audio/mpeg' });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[tts] edge-tts 失败，前端降级 Web Speech：', msg);
    return NextResponse.json({ error: 'tts failed', reason: msg }, { status: 502 });
  }
}