'use client';

/**
 * 共享的语音朗读助手（TTS），供各学习模块复用。
 *
 * 三层朗读策略（2026-08-22 重构）：
 *   第 1 层【浏览器 Web Speech 本地优先】——零延迟、零网络往返。
 *     只要本机有 zh-CN / en-US 严格匹配嗓音，就用它朗读。
 *     Safari/iOS 首句自动播放可能静音 → 1.5s 内未触发 onstart 就降级。
 *   第 2 层【服务端 Edge TTS（Python edge-tts 包）】——神经嗓音（晓晓/Aria），跨设备一致普通话。
 *     本地失败或本机无严格嗓音时走服务端 /api/tts。
 *     服务端通过 subprocess 调用 Python edge-tts 包，从 NAS 住宅 IP 直连 speech.platform.bing.com。
 *     12s 超时保护。
 *   第 3 层【Web Speech 宽松兜底】——粤语 / 台式等也算。
 *     服务端也失败时，用本机任何 zh/en 嗓音读，总比静默好。
 *     （用户已确认「粤语也不是不能接受，总比没有声音好」）
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

/** Web Speech 语速(0~2) → 服务端百分比字符串。 */
function toEdgeRate(wsRate: number): string {
  const pct = Math.round((wsRate - 1) * 100);
  return pct === 0 ? '+0%' : `${pct}%`;
}

export async function playTts(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number } = {},
) {
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;

  // ── 第 1 层：本地 Web Speech（零延迟，普通话）─────────────────
  if (hasStrictVoice(lang)) {
    const played = await speakEnd(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch);
    if (played) return;
  }

  // ── 第 2 层：服务端 Kokoro（神经嗓音，跨设备一致）────────────
  const serverOk = await tryServer(text, lang, { ...opts, wsRate, pitch });
  if (serverOk) return;

  // ── 第 3 层：Web Speech 宽松兜底（粤语/台式等，总比静默好）──
  speakEndLoose(text, lang, wsRate, pitch);
}

/** 第 2 层：走服务端 /api/tts 播放，结束时 resolve；失败降级到第 3 层。 */
function tryServer(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number },
): Promise<boolean> {
  const wsRate = opts.wsRate ?? 0.8;
  const pauseMs = opts.pauseMs ?? 0;
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !('fetch' in window)) {
      resolve(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate), pause: pauseMs }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
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
 * 严格模式朗读（第 1 层）：onstart 触发才算成功。
 * iPad Safari 首句常不触发 onstart（静音）→ 1.5s 内未触发即判定失败。
 */
function speakEnd(text: string, lang: string, rate: number, pitch: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    ensureVoices();
    const v = pickVoiceStrict(lang);
    if (!v) { resolve(false); return; }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = calibrateRate(rate);
    u.pitch = pitch;
    u.voice = v;
    let done = false;
    let started = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(startTimer);
      resolve(ok);
    };
    u.onstart = () => { started = true; clearTimeout(startTimer); };
    u.onend = () => finish(started);
    u.onerror = () => finish(started);
    const fire = () => {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {
        finish(false);
      }
    };
    const startTimer = setTimeout(() => { if (!started) finish(false); }, 1500);
    if (window.speechSynthesis.getVoices().length > 0) fire();
    else window.speechSynthesis.addEventListener('voiceschanged', fire, { once: true });
    setTimeout(() => finish(started), 30000);
  });
}

/**
 * 宽松模式朗读（第 3 层兜底）：不排斥粤语/台式，
 * 只要 onstart 触发就视为成功，不再严格检查嗓音匹配。
 */
function speakEndLoose(text: string, lang: string, rate: number, pitch: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    ensureVoices();
    const v = pickVoiceLoose(lang);
    if (!v) { resolve(false); return; }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = calibrateRate(rate);
    u.pitch = pitch;
    u.voice = v;
    let done = false;
    let started = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(startTimer);
      resolve(ok);
    };
    u.onstart = () => { started = true; clearTimeout(startTimer); };
    u.onend = () => finish(true);
    u.onerror = () => finish(started);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      finish(false);
    }
    const startTimer = setTimeout(() => { if (!started) finish(false); }, 1500);
    setTimeout(() => finish(started), 15000);
  });
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
