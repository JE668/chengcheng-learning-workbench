/**
 * /api/tts 与 /api/tts/batch 的共享底座（2026-10-18 B4 抽取）：
 * edge-tts 持久化 Python 进程管理 + 服务端内存缓存 + 合成入口。
 *
 * ⚠️ Next.js 的 route 模块各自独立实例化，模块级单例（进程句柄/缓存）
 * 抽到这里后**两个路由共享同一个 Python 进程与缓存**——正是批接口
 * 需要的语义（单进程串行协议），也顺带让单接口与批接口共享缓存命中。
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

export const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

// 空闲超时：30 分钟无请求自动清理 Python 进程
export const TTS_IDLE_TIMEOUT = 30 * 60 * 1000;
export let ttsIdleTimer: ReturnType<typeof setTimeout> | null = null;

export const ttsCache = new Map<string, { data: Buffer; type: string }>();
export const TTS_CACHE_MAX = 500;

export function ttsCacheKey(text: string, lang: string, rate: string): string {
  return `${lang}|${rate}|${text}`;
}

// 持久化 Python TTS 进程（避免每次请求启动 Python）
let ttsProcess: import('node:child_process').ChildProcess | null = null;
let ttsReqId = 0;
const ttsPending = new Map<string, (data: Buffer | Promise<never>) => void>();

export function getTtsProcess() {
  if (ttsProcess && !ttsProcess.killed) return ttsProcess;
  const scriptPath = join(process.cwd(), 'scripts', 'tts-server.py');
  // ⚠️ 绝对不要设 `timeout`：Node 的 spawn timeout 是进程总存活时长硬上限，
  // 到点直接 SIGTERM——与「持久化进程避免 200-300ms 启动开销」直接矛盾。
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
  // ⚠️ 必须监听 'error'：python3 缺失等 spawn 异步错误在无监听器时会升级为
  // uncaughtException——直接终结整个 Node 进程。监听后让在途请求失败降级。
  proc.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[TTS] 无法启动 edge-tts 进程（python3 不可用?）:', err.message);
    if (ttsProcess === proc) ttsProcess = null;
    if (ttsIdleTimer) {
      clearTimeout(ttsIdleTimer);
      ttsIdleTimer = null;
    }
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
export function resetIdleTimer() {
  if (ttsIdleTimer) clearTimeout(ttsIdleTimer);
  ttsIdleTimer = setTimeout(() => {
    if (ttsProcess && !ttsProcess.killed) {
      ttsProcess.kill('SIGTERM');
      ttsProcess = null;
    }
    ttsIdleTimer = null;
  }, TTS_IDLE_TIMEOUT);
}

/** 通过持久化 Python 进程合成音频（stdin/stdout 协议，无启动开销） */
export function synthesizeWithEdgeTTS(text: string, voice: string, rate: string): Promise<Buffer> {
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

// 模块加载即预启动 Python 进程（消除冷启动 200-300ms）
try {
  getTtsProcess();
} catch {
  /* 模块加载期 spawn 失败不影响后续请求 */
}
