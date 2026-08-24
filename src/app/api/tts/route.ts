/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— edge-tts Python 持久化进程
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 技术路线（已验证从 NAS 广东电信住宅 IP 可用）：
 *   Python edge-tts 包持久化进程（stdin/stdout 协议）：
 *     - 进程启动后保持运行，避免每次请求的 Python 启动开销（~200-300ms）
 *     - WebSocket 直连 speech.platform.bing.com（Chromium 143 headers）
 *     - Sec-MS-GEC 令牌通过时间戳 + SHA256 计算，无需 edge.microsoft.com
 *     - stream() 获取 MP3 音频块，base64 输出
 *
 * 延迟：~100-300ms（持久化 Python 进程，无启动开销），内存缓存命中秒回。
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

// 持久化 Python TTS 进程（避免每次请求启动 Python）
let ttsProcess: import('node:child_process').ChildProcess | null = null;
let ttsReqId = 0;
const ttsPending = new Map<string, (data: Buffer | Promise<never>) => void>();

function getTtsProcess() {
  if (ttsProcess && !ttsProcess.killed) return ttsProcess;
  const scriptPath = require('node:path').join(process.cwd(), 'scripts', 'tts-server.py');
  ttsProcess = spawn('python3', [scriptPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    timeout: 30000,
  });
  let buf = '';
  ttsProcess.stdout!.on('data', (d: Buffer) => {
    buf += d.toString();
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const resp = JSON.parse(line);
        const resolve = ttsPending.get(resp.id);
        if (resolve) {
          ttsPending.delete(resp.id);
          if (resp.ok) resolve(Buffer.from(resp.data, 'base64'));
          else resolve(Promise.reject(new Error(resp.error || 'TTS failed')));
        }
      } catch { /* ignore parse errors */ }
    }
  });
  ttsProcess.on('exit', () => {
    ttsProcess = null;
    for (const [, resolve] of ttsPending) resolve(Promise.reject(new Error('TTS process died')));
    ttsPending.clear();
  });
  return ttsProcess;
}

function ttsCacheKey(text: string, lang: string, rate: string): string {
  return `${lang}|${rate}|${text}`;
}

/** 通过持久化 Python 进程合成音频（stdin/stdout 协议，无启动开销） */
async function synthesizeWithEdgeTTS(
  text: string,
  voice: string,
  rate: string,
): Promise<Buffer> {
  const id = String(++ttsReqId);
  return new Promise((resolve, reject) => {
    try {
      const proc = getTtsProcess();
      ttsPending.set(id, resolve);
      const req = JSON.stringify({ id, text, voice, rate }) + '\n';
      proc.stdin!.write(req);
      setTimeout(() => {
        if (ttsPending.has(id)) {
          ttsPending.delete(id);
          reject(new Error('TTS timeout'));
        }
      }, 12000);
    } catch (e) {
      reject(new Error(`TTS process error: ${(e as Error).message}`));
    }
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit('tts:' + ip, TTS_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `请求太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

  const { text, lang, rate } = await safeJson(req, {});
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: '缺少 text' }, { status: 400 });
  }

  const voice = VOICE_EDGE[lang as string] ?? VOICE_EDGE.zh;
  const r = rate ?? '+0%';
  const cacheKey = ttsCacheKey(text, voice, r);
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.data), {
      status: 200,
      headers: {
        'Content-Type': cached.type,
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Cache': 'HIT',
      },
    });
  }

  try {
    const data = await synthesizeWithEdgeTTS(text, voice, r);
    const type = 'audio/mpeg';
    ttsCache.set(cacheKey, { data, type });
    if (ttsCache.size > TTS_CACHE_MAX) {
      const first = ttsCache.keys().next().value;
      if (first) ttsCache.delete(first);
    }
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Cache': 'MISS',
      },
    });
  } catch (e) {
    console.error('[TTS] edge-tts failed:', (e as Error).message);
    return NextResponse.json({ error: 'TTS 合成失败，前端已自动降级到 Web Speech' }, { status: 500 });
  }
}