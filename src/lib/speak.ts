'use client';

/**
 * 共享的语音朗读助手（TTS），供各学习模块复用。
 *
 * 三层朗读策略（2026-08-22 重构）：
 *   第 1 层【浏览器 Web Speech 严格匹配】——零延迟、零网络往返。
 *     只要本机有 zh-CN / en-US 严格匹配嗓音，就用它朗读。
 *   第 2 层【Web Speech 宽松兜底】——零延迟，粤语/台式/英式也行。
 *     本机无严格嗓音时（如 Android Edge）先走宽松，总比走服务端快。
 *     （用户已确认「粤语也不是不能接受，总比没有声音好」）
 *   第 3 层【服务端 edge-tts（Python edge-tts 包）】——神经嗓音（晓晓/Aria），最后兜底。
 *     两层 Web Speech 都失败时才走服务端 /api/tts。
 *     服务端通过 subprocess 调用 Python edge-tts 包，从 NAS 住宅 IP 直连 speech.platform.bing.com。
 *     12s 超时保护。
 *
 * ⚠️ 2026-08-22 修复：
 *   1. SSML <break> 标签 bug：edge-tts 对 <break time="400ms"/> 处理不稳定，
 *      导致 pause 时长被当作文本朗读出来（用户听到"400毫秒"）。
 *      现已将暂停逻辑从服务端 SSML 移回客户端 setTimeout。
 *   2. 连续点击降级 bug：speechSynthesis.cancel() 后未等待队列清空就 speak，
 *      导致 onstart 在 1.5s 超时窗口内不触发 → 误判失败 → 走服务端降级。
 *      现已在 speak() 前轮询 speaking/pending 状态，确保队列清空后再播放。
 *   3. 层级重排：宽松 Web Speech 移至第 2 层（服务端之前），
 *      Android Edge 无严格嗓音时优先用宽松嗓音而非走网络。
 *
 * 拼音以「同音汉字」形式（如 bà→爸）交给 zh-CN 嗓音读，音节和声调都正确。
 * 整体语速偏慢，适配一年级小朋友跟读。
 */

let voicesReady = false;
function ensureVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (voicesReady) return;
  if (window.speechSynthesis.getVoices().length) {
    voicesReady = true;
    return;
  }
  window.speechSynthesis.addEventListener(
    'voiceschanged',
    () => { voicesReady = true; },
    { once: true },
  );
}

/**
 * Safari / iOS 严格自动播放策略：fetch → audio.play() 的异步链不被当作用户手势，
 * Safari 直接拦截。在首次用户交互时用静音 mp3 解锁整个页面的音频会话。
 * （Edge/Chrome/Android 对此更宽松，但统一解锁无副作用。）
 */
let audioUnlocked = false;

// ─── 客户端 TTS Blob 缓存 ──────────────────────────────────────
// 服务端 TTS（Layer 3）的音频 blob 缓存，key = lang|rate|text。
// 故事朗读时预取下一段 TTS 并存入缓存，实际播放时命中缓存秒回。
// 最大 80 条（约 20 集 × 4 段），超出时删最早插入的。
const ttsBlobCache = new Map<string, Blob>();
const TTS_CACHE_MAX = 80;

export function prefetchTts(text: string, lang: 'zh' | 'en', rate = '+0%'): void {
  if (typeof window === 'undefined' || !('fetch' in window)) return;
  const key = `${lang}|${rate}|${text}`;
  if (ttsBlobCache.has(key)) return;
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, lang, rate }),
  })
    .then((res) => (res.ok ? res.blob() : null))
    .then((blob) => {
      if (!blob) return;
      ttsBlobCache.set(key, blob);
      if (ttsBlobCache.size > TTS_CACHE_MAX) {
        const first = ttsBlobCache.keys().next().value;
        if (first) ttsBlobCache.delete(first);
      }
    })
    .catch(() => {});
}

function getCachedBlob(text: string, lang: 'zh' | 'en', rate: string): Blob | undefined {
  return ttsBlobCache.get(`${lang}|${rate}|${text}`);
}

function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const silent = new Audio(
      'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA',
    );
    silent.volume = 0;
    const p = silent.play();
    if (p && typeof (p as { catch?: () => void }).catch === 'function') {
      (p as Promise<void>).catch(() => {});
    }
  } catch {
    /* 解锁失败不影响后续逻辑 */
  }
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const evs = ['pointerdown', 'touchstart', 'click', 'keydown'];
  const onFirst = () => {
    unlockAudioOnce();
    evs.forEach((e) => document.removeEventListener(e, onFirst));
  };
  evs.forEach((e) => document.addEventListener(e, onFirst, { passive: true }));
}

// ─── 嗓音挑选 ──────────────────────────────────────────────────

/**
 * 严格匹配：优先女性/儿童友好的 zh-CN / en-US 嗓音。
 * 排除粤语(zh-HK)、台式(zh-TW)、英式(en-GB)——学习内容是普通话，选到粤语会教错发音。
 */
function pickVoiceStrict(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const target = lang.toLowerCase();
  const match = (x: SpeechSynthesisVoice) => {
    const vl = (x.lang || '').toLowerCase();
    if (target.startsWith('zh')) return (vl === 'zh-cn' || vl === 'zh') && !vl.startsWith('zh-hk') && !vl.startsWith('zh-tw');
    if (target.startsWith('en')) return (vl === 'en-us' || vl === 'en') && !vl.startsWith('en-gb');
    return vl.startsWith(target);
  };
  const pool = voices.filter(match);
  const friendly = pool.find((x) =>
    /female|woman|girl|ting|huihui|yaoyao|xiao|mei|child|kids|samantha|zira|google us|microsoft|晓晓|晓颜|婷婷/i.test(x.name),
  );
  return friendly ?? pool[0];
}

/**
 * 宽松匹配：第 3 层兜底——任何 zh/en 前缀的嗓音都接受，
 * 包括粤语(zh-HK)、台式(zh-TW)、英式(en-GB)。总比静默好。
 */
function pickVoiceLoose(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const target = lang.toLowerCase();
  const match = (x: SpeechSynthesisVoice) => {
    const vl = (x.lang || '').toLowerCase();
    return vl.startsWith(target);
  };
  return voices.find(match);
}

// ─── 语速校准 ──────────────────────────────────────────────────

/**
 * 不同浏览器 Web Speech 对 rate 的解释不同：
 *   Safari：rate 0.65 确实明显慢
 *   Edge/Chrome：rate 0.65 仍偏快（需要更低）
 * 按 UA 校准，使跨设备语速体感一致。
 * 注意：Chrome/Edge 的 UA 都含 "Safari"，所以「真 Safari」=含 Safari 但不含 Chrome。
 */
export function calibrateRate(wsRate: number): number {
  if (typeof navigator === 'undefined') return wsRate;
  const ua = navigator.userAgent;
  const hasChrome = /Chrome/i.test(ua);
  const isGenuineSafari = /Safari/i.test(ua) && !hasChrome;
  if ((hasChrome || /Edg/i.test(ua)) && !isGenuineSafari) {
    return Math.max(0.1, wsRate * 0.8);
  }
  return wsRate;
}

// ─── 公开接口 ──────────────────────────────────────────────────

export function speakZh(text: string, rate = 0.55) {
  void playTts(text, 'zh', { wsRate: rate, pitch: 1.1 });
}

export function speakEn(text: string, rate = 0.55) {
  void playTts(text, 'en', { wsRate: rate, pitch: 1.05 });
}

// ─── 朗读主流程 ──────────────────────────────────────────────────

/** 第 1 层：本机有严格 zh-CN / en-US 嗓音。 */
function hasStrictVoice(lang: 'zh' | 'en'): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  ensureVoices();
  if (!window.speechSynthesis.getVoices().length) return false;
  return pickVoiceStrict(lang === 'zh' ? 'zh-CN' : 'en-US') !== undefined;
}

/** Web Speech 语速(0~2) → 服务端百分比字符串（edge-tts 要求带显式 +/- 号）。 */
export function toEdgeRate(wsRate: number): string {
  const pct = Math.round((wsRate - 1) * 100);
  return pct === 0 ? '+0%' : `${pct > 0 ? '+' : ''}${pct}%`;
}

export async function playTts(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number } = {},
) {
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  const pauseMs = opts.pauseMs ?? 0;

  // ── 第 1 层：本地 Web Speech 严格匹配（零延迟，普通话）────────
  if (hasStrictVoice(lang)) {
    console.log('[TTS-L1] strict Web Speech', lang, text.slice(0, 25));
    const played = await speakEnd(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch, pauseMs);
    if (played) return;
  }

  // ── 第 2 层：Web Speech 宽松兜底（零延迟，粤语/台式也行）────
  // 本机无严格嗓音时（如 Android Edge）先走宽松，总比走服务端快。
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    console.log('[TTS-L2] loose Web Speech', lang, text.slice(0, 25));
    const loosePlayed = await speakEndLoose(text, lang === 'zh' ? 'zh' : 'en', wsRate, pitch, pauseMs);
    if (loosePlayed) return;
  }

  // ── 第 3 层：服务端 edge-tts（神经嗓音，最后兜底）────────────
  console.log('[TTS-L3] server edge-tts', lang, text.slice(0, 30));
  const serverOk = await tryServer(text, lang, { ...opts, wsRate, pitch });
  if (serverOk) return;
}

/** 第 3 层：走服务端 /api/tts 播放，结束时 resolve；失败则结束（两层 Web Speech 已兜底）。 */
function tryServer(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number },
): Promise<boolean> {
  const wsRate = opts.wsRate ?? 0.8;
  const pauseMs = opts.pauseMs ?? 0;
  return new Promise<boolean>(async (resolve) => {
    if (typeof window === 'undefined' || !('fetch' in window)) {
      resolve(false);
      return;
    }
    // 缓存命中：跳过 fetch，直接播放 blob（~0ms 延迟）
    const edgeRate = toEdgeRate(wsRate);
    const cached = getCachedBlob(text, lang, edgeRate);
    if (cached) {
      const url = URL.createObjectURL(cached);
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (pauseMs > 0) setTimeout(() => resolve(true), pauseMs);
        else resolve(true);
      };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      audio.play().catch(() => { URL.revokeObjectURL(url); resolve(false); });
      return;
    }
    const controller = new AbortController();
    // 超时时长按文本长度动态计算：整段长文一次合成需要数秒，
    // 旧的固定 5s 对故事长段会误杀 → 静默失败。语音播放本身不在此计时内。
    const timeoutMs = Math.min(20000, Math.max(6000, text.length * 120));
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate) }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.onended = () => {
          URL.revokeObjectURL(url);
          // pauseMs 暂停：音频播放结束后延迟 resolve
          if (pauseMs > 0) {
            setTimeout(() => resolve(true), pauseMs);
          } else {
            resolve(true);
          }
        };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
        audio.play().catch(() => { URL.revokeObjectURL(url); resolve(false); });
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(false);
      });
  });
}

export function playTtsEnd(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number } = {},
): Promise<void> {
  return playTts(text, lang, opts);
}

// ─── Web Speech 朗读核心 ────────────────────────────────────────

/**
 * 把长文本切成适合朗读的短句。
 *
 * Android Chrome/Edge（含小米平板）的 speechSynthesis 对长 utterance 经常
 * 卡死不触发 onstart/onend（已知平台 bug，约 15s 无输入后停摆）。
 * 按标点切成 ≤30 字的短句、逐句 speak，是绕过该 bug 的最稳做法；
 * 同时每句都能可靠拿到 onend，段落连读的节拍也更准确。
 */
function splitSpeechText(text: string, maxLen = 30): string[] {
  const sentences = text.match(/[^。！？!?；;…\n]+[。！？!?；;…]*|\n+|[^。！？!?；;…\n]+$/g) ?? [text];
  const out: string[] = [];
  for (const raw of sentences) {
    const t = raw.replace(/\n+/g, '，').trim();
    if (!t || /^[，,、]+$/.test(t)) continue;
    if (t.length <= maxLen) { out.push(t); continue; }
    // 超长句再按逗号/顿号粗切
    let buf = '';
    for (const seg of t.split(/(?<=[，,、 ])/)) {
      if ((buf + seg).length > maxLen && buf) { out.push(buf); buf = ''; }
      buf += seg;
    }
    if (buf) out.push(buf);
  }
  return out.length ? out : [text];
}

/**
 * 共用朗读核心：逐句播放 + Chrome 长语音 keep-alive。
 *
 * - 仅第一句 800ms 未 onstart 判失败（交给下一层降级）；开始出声后，
 *   中途出错/超时也按「已播放」resolve，避免整个段落降级重读一遍。
 * - keep-alive：Android Chrome 长 utterance ~15s 后可能静默停摆，
 *   每 8s 检测 speaking 状态并 pause()/resume() 踢醒引擎。
 * - 总时长兜底按字数缩放（旧代码固定 20s，长段会读一半被误判完成）。
 */
function speakChunks(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs: number,
  pickVoice: (l: string) => SpeechSynthesisVoice | undefined,
  /** 宽松层 true：只收到 onend 也算已播放（部分平台不触发 onstart） */
  acceptEndWithoutStart = false,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    ensureVoices();
    const v = pickVoice(lang);
    if (!v) { resolve(false); return; }

    const chunks = splitSpeechText(text);
    let idx = 0;
    let done = false;
    let started = false;
    let keepAlive: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    };
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(ok);
    };
    const startKeepAlive = () => {
      if (keepAlive) return;
      keepAlive = setInterval(() => {
        try {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        } catch { /* 引擎异常交给 utterance onerror/兜底计时处理 */ }
      }, 8000);
    };

    // 总兜底：按字数估算（慢速童声约 300ms/字），封顶 3 分钟
    setTimeout(() => finish(started), Math.min(180000, Math.max(20000, text.length * 350)));

    const speakNext = () => {
      if (done) return;
      if (idx >= chunks.length) {
        // pauseMs 暂停：全部播完后延迟 resolve，用于顺序连读时的段落间隔
        if (pauseMs > 0) setTimeout(() => finish(started), pauseMs);
        else finish(started);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[idx]);
      idx++;
      u.lang = lang;
      u.rate = calibrateRate(rate);
      u.pitch = pitch;
      u.voice = v;
      let chunkStarted = false;
      const startTimer = setTimeout(() => {
        if (!chunkStarted) {
          // 只有第一句启动失败才算「朗读失败」让上层降级；
          // resize 后的句子失败按放弃处理（resolve started，见文件头注释）
          finish(started && idx > 1);
        }
      }, idx === 1 ? 800 : 2000);
      u.onstart = () => { chunkStarted = true; started = true; clearTimeout(startTimer); startKeepAlive(); };
      u.onend = () => {
        clearTimeout(startTimer);
        if (acceptEndWithoutStart) started = true; // onend 到达说明确实出声了
        setTimeout(speakNext, 60);
      };
      u.onerror = (e) => {
        clearTimeout(startTimer);
        // 用户/代码主动 cancel 视为正常结束；started 后出错不降级重读
        if (e.error === 'interrupted' || e.error === 'canceled') { finish(true); return; }
        finish(started && idx > 1);
      };
      try {
        window.speechSynthesis.speak(u);
      } catch {
        finish(false);
      }
    };

    const fire = () => {
      try {
        window.speechSynthesis.cancel();
        // cancel() 后等待队列清空再 speak，避免 onstart 不触发。
        let retries = 5;
        const trySpeak = () => {
          if (retries <= 0 || (!window.speechSynthesis.speaking && !window.speechSynthesis.pending)) {
            speakNext();
            return;
          }
          retries--;
          setTimeout(trySpeak, 10);
        };
        trySpeak();
      } catch {
        finish(false);
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) fire();
    else window.speechSynthesis.addEventListener('voiceschanged', fire, { once: true });
  });
}

/**
 * 严格模式朗读（第 1 层）：onstart 触发才算成功。
 * iPad Safari 首句常不触发 onstart（静音）→ 800ms 内未触发即判定失败。
 */
function speakEnd(text: string, lang: string, rate: number, pitch: number, pauseMs = 0): Promise<boolean> {
  return speakChunks(text, lang, rate, pitch, pauseMs, pickVoiceStrict);
}

/**
 * 宽松模式朗读（第 2 层兜底）：不排斥粤语/台式，
 * 只要 onstart 触发就视为成功，不再严格检查嗓音匹配。
 */
function speakEndLoose(text: string, lang: string, rate: number, pitch: number, pauseMs = 0): Promise<boolean> {
  return speakChunks(text, lang, rate, pitch, pauseMs, pickVoiceLoose, true);
}

// ─── 拼音朗读 ──────────────────────────────────────────────────

/**
 * 朗读一个拼音音节。拼音拉丁字母会被引擎当成英文念，所以改读同音汉字。
 * 中文神经嗓音读这个汉字时，音节和声调都正确。
 */
export function speakPinyin(syllable: string, _tone = 0, han?: string) {
  const text = han && /[\u4e00-\u9fff]/.test(han) ? han : syllable;
  void playTts(text, 'zh', { wsRate: 0.45, pitch: 1.15, pauseMs: 700 });
}

const PRAISES = [
  '你真棒！',
  '太厉害啦！',
  '答对啦，了不起！',
  '程程好聪明！',
  '哇，全对！',
  '萌可给你点赞！',
  '继续加油，你最棒！',
];

export function praise(rate = 0.7) {
  const text = PRAISES[Math.floor(Math.random() * PRAISES.length)];
  speakZh(text, rate);
}
