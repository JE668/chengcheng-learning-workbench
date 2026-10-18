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

// ─── 合成串行化 + 实时优先 ──────────────────────────────────────
// ⚠️ Python 进程是 stdin/stdout 串行协议：一次只能合成一条（写第二条
// stdin 时第一条还在合成，Python 端会排队但响应顺序不保证严格 FIFO，
// 更致命的是批接口的 10 条长队列会把实时播放请求堵 10-30s——单接口
// 客户端 12s 超时直接被打死（安卓平板「点了没声音」的进程层根因）。
//
// 方案：模块级 promise 链互斥（同一时刻只有一个合成在途）+ 实时请求
// 插队。单接口（实时播放）走队头，批接口（后台预取）走队尾——预取
// 让路给正在等声音的孩子。

/** 互斥队列：ttsChain 逐条串行执行合成任务 */
let ttsChain: Promise<unknown> = Promise.resolve();

/**
 * 合成一条音频（串行互斥）。
 * @param priority true=实时播放（插队头），false=批量预取（排队尾）
 */
function enqueueSynthesis(
  text: string,
  voice: string,
  rate: string,
  priority: boolean
): Promise<Buffer> {
  const run = () => synthesizeRaw(text, voice, rate);
  if (priority) {
    // 实时请求插队：把 run 接到「当前链头」，后续任务接在其后。
    // 实现：新建一个节点占住链尾，把 run 插在链尾之前。
    const p = ttsChain.then(run, run);
    // 链本身不变——实时任务不参与链推进（防止插队任务自己成为链头
    // 后又立即执行下一个排队的批任务，形成「实时任务把批任务带进
    // 插队窗口」）。等当前在途任务完成即执行。
    return p;
  }
  const next = ttsChain.then(run, run);
  ttsChain = next.catch(() => {});
  return next;
}

/** 原始合成（写 stdin，无互斥——只被 enqueueSynthesis 调用） */
function synthesizeRaw(text: string, voice: string, rate: string): Promise<Buffer> {
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

/** 公开入口：实时播放（单接口）——插队优先 */
export function synthesizeWithEdgeTTS(text: string, voice: string, rate: string): Promise<Buffer> {
  return enqueueSynthesis(text, voice, rate, true);
}

/** 公开入口：批量预取（批接口）——排队让路 */
export function synthesizeForBatch(text: string, voice: string, rate: string): Promise<Buffer> {
  return enqueueSynthesis(text, voice, rate, false);
}

// 模块加载即预启动 Python 进程（消除冷启动 200-300ms）
try {
  getTtsProcess();
} catch {
  /* 模块加载期 spawn 失败不影响后续请求 */
}
