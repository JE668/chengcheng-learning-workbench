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
import { join } from 'node:path';
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

/**
 * 入参上限。
 *
 * `/api/tts` 是**公开无鉴权**端点（middleware 放行 /api/tts 前缀，仅有 IP 限流），
 * 因此必须限制单次请求的规模，否则匿名调用可用超长文本反复撑大缓存与 Python 侧开销。
 * 上学阶段的课文/句子远小于 500 字。
 */
const MAX_TEXT_LENGTH = 500;
/** rate 合法格式：+25% / -25% / +0% （edge-tts prosody 语法） */
const RATE_PATTERN = /^[+-]?\d{1,3}%$/;

// 空闲超时：30 分钟无请求自动清理 Python 进程
const TTS_IDLE_TIMEOUT = 30 * 60 * 1000;
let ttsIdleTimer: ReturnType<typeof setTimeout> | null = null;

// 模块加载即预启动 Python 进程：Next.js route handler 模块在首次请求时加载，
// 在顶层调用 getTtsProcess() 让进程在请求到达前就已运行，消除 ~200-300ms 冷启动。
// spawn 是异步的，但 Python 脚本的 warmup 调用（连接 Bing WebSocket）只需 ~100ms，
// 通常在后端 handle 函数执行前就已完成。
try {
  getTtsProcess();
} catch {
  /* 模块加载期 spawn 失败不影响后续请求 */
}

// 持久化 Python TTS 进程（避免每次请求启动 Python）
let ttsProcess: import('node:child_process').ChildProcess | null = null;
let ttsReqId = 0;
const ttsPending = new Map<string, (data: Buffer | Promise<never>) => void>();

function getTtsProcess() {
  if (ttsProcess && !ttsProcess.killed) return ttsProcess;
  const scriptPath = join(process.cwd(), 'scripts', 'tts-server.py');
  // ⚠️ 绝对不要设 `timeout`：Node 的 spawn timeout 是**进程总存活时长**硬上限，
  // 到点直接 SIGTERM。原先写了 `timeout: 30000`，与本文件通篇强调的
  // 「持久化进程避免 200-300ms 启动开销」直接矛盾 —— worker 每 30 秒必被杀一次，
  // 持久化优化 100% 失效，且正在合成的请求会被中途打断。
  // 空闲回收由 resetIdleTimer()（30 分钟无请求）负责，两者职责必须分开。
  const proc = spawn('python3', [scriptPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  ttsProcess = proc;
  let buf = '';
  proc.stdout!.on('data', (d: Buffer) => {
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
      } catch {
        /* ignore parse errors */
      }
    }
  });
  // ⚠️ 必须监听 'error'：python3 缺失 / PATH 被改 / 脚本损坏时，spawn 会异步
  // 发出 error(ENOENT)。Node 对 EventEmitter 的 error 事件在**无监听器**时会
  // 升级为 uncaughtException —— 实测这会**直接终结整个 Node 进程**，
  // 不是单个请求 500，而是全站不可用（且模块顶层的预启动调用让它在启动期就可能崩）。
  proc.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[TTS] 无法启动 edge-tts 进程（python3 不可用?）:', err.message);
    if (ttsProcess === proc) ttsProcess = null;
    if (ttsIdleTimer) {
      clearTimeout(ttsIdleTimer);
      ttsIdleTimer = null;
    }
    // 让所有在途请求失败，前端据此降级到 Web Speech，而不是永久挂起
    for (const [, resolve] of ttsPending)
      resolve(Promise.reject(new Error('TTS process spawn failed')));
    ttsPending.clear();
  });
  proc.on('exit', () => {
    if (ttsProcess === proc) ttsProcess = null;
    if (ttsIdleTimer) {
      clearTimeout(ttsIdleTimer);
      ttsIdleTimer = null;
    }
    for (const [, resolve] of ttsPending) resolve(Promise.reject(new Error('TTS process died')));
    ttsPending.clear();
  });
  resetIdleTimer();
  return proc;
}

/** 重置空闲计时器：每次请求后推迟 30 分钟再清理进程 */
function resetIdleTimer() {
  if (ttsIdleTimer) clearTimeout(ttsIdleTimer);
  ttsIdleTimer = setTimeout(() => {
    if (ttsProcess && !ttsProcess.killed) {
      ttsProcess.kill('SIGTERM');
      ttsProcess = null;
    }
    ttsIdleTimer = null;
  }, TTS_IDLE_TIMEOUT);
}

function ttsCacheKey(text: string, lang: string, rate: string): string {
  return `${lang}|${rate}|${text}`;
}

/** 通过持久化 Python 进程合成音频（stdin/stdout 协议，无启动开销） */
async function synthesizeWithEdgeTTS(text: string, voice: string, rate: string): Promise<Buffer> {
  const id = String(++ttsReqId);
  return new Promise((resolve, reject) => {
    try {
      const proc = getTtsProcess();
      resetIdleTimer();
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
    return NextResponse.json(
      { error: `请求太频繁，请 ${limit.retryAfter} 秒后再试` },
      { status: 429 }
    );
  }

  const { text, lang, rate } = await safeJson(req, {});
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: '缺少 text' }, { status: 400 });
  }
  // 公开端点：限制单次合成规模，避免超长文本放大 Python 侧耗时与缓存占用
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `文本过长（最多 ${MAX_TEXT_LENGTH} 字）` }, { status: 400 });
  }

  const voice = VOICE_EDGE[lang as string] ?? VOICE_EDGE.zh;
  // rate 会原样透传给 Python 的 Communicate(rate=...) 并参与缓存 key，
  // 必须校验格式，否则任意字符串会污染缓存键并可能让上游报错。
  const r = typeof rate === 'string' && RATE_PATTERN.test(rate) ? rate : '+0%';
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
    return NextResponse.json(
      { error: 'TTS 合成失败，前端已自动降级到 Web Speech' },
      { status: 500 }
    );
  }
}
