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

/**
 * 诊断日志：默认静默。localStorage 设 tts-debug=1 后在设备控制台/
 * vConsole 里可见（安卓平板接 USB 调试时用），生产不刷屏。
 */
function ttsDebug(...args: unknown[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('tts-debug') === '1')
      console.log('[TTS]', ...args);
  } catch {
    /* localStorage 不可用则静默 */
  }
}

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
    () => {
      voicesReady = true;
    },
    { once: true }
  );
}

/**
 * 🚀 B2 voices 启动预热（2026-10-18）：
 * Chrome/WebView 的 getVoices() 在页面加载初期经常返回空数组（异步加载，
 * voiceschanged 可能数秒后才触发）。原 ensureVoices 只在首次 playTts 时才挂
 * 监听——冷启动后的前几十秒 hasStrictVoice 恒 false，设备明明有严格嗓音
 * 却被判定走 L2/L3。此函数由孩子端 layout 挂载时调用：立即触发一次枚举 +
 * 挂监听，并**每 500ms 轮询直至就绪**（voiceschanged 在部分安卓 WebView
 * 上根本不触发，轮询是唯一可靠信号；就绪即停）。
 */
export function warmupVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  ensureVoices();
  if (voicesReady) return;
  let tries = 0;
  const poll = setInterval(() => {
    tries++;
    if (window.speechSynthesis.getVoices().length > 0) {
      voicesReady = true;
      clearInterval(poll);
      return;
    }
    // 30 秒仍无嗓音（Android WebView 常态）——放弃，交给 L2/L3/本地文件层
    if (tries >= 60) clearInterval(poll);
  }, 500);
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
//
// 🚀 B1 持久化（2026-10-18）：blob 同时镜像到 localStorage（base64），
// 页面刷新/重开应用时回填内存缓存——动态文本（题干/台词）在 Android
//（Web Speech 失效、全走服务端）上不再每次冷启动。
// 容量纪律：localStorage 限额 ~5MB，按条数（60）而非字节淘汰，
// 单条 >60KB（长句）不持久化（内存缓存照常，避免一条吃掉配额）。
const ttsBlobCache = new Map<string, Blob>();
const TTS_CACHE_MAX = 80;
const TTS_LS_PREFIX = 'tts-audio:';
const TTS_LS_MAX = 60;
const TTS_LS_MAX_ITEM_BYTES = 60 * 1024;

/** 启动回填：把 localStorage 的持久音频还原进内存缓存（一次，惰性） */
let lsRestored = false;
function restoreFromLocalStorage() {
  if (lsRestored || typeof window === 'undefined') return;
  lsRestored = true;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(TTS_LS_PREFIX)) continue;
      const key = k.slice(TTS_LS_PREFIX.length);
      if (ttsBlobCache.has(key)) continue;
      const b64 = window.localStorage.getItem(k);
      if (!b64) continue;
      try {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
        ttsBlobCache.set(key, new Blob([bytes], { type: 'audio/mpeg' }));
      } catch {
        // 坏条目直接清掉
        try {
          window.localStorage.removeItem(k);
        } catch {}
      }
    }
  } catch {
    /* localStorage 不可用（隐私模式等）——只用内存缓存 */
  }
}

/** 持久化一条（条数超限时淘汰最旧；写失败静默） */
function persistToLocalStorage(key: string, blob: Blob) {
  if (typeof window === 'undefined') return;
  try {
    if (blob.size > TTS_LS_MAX_ITEM_BYTES) return; // 长句不占配额
    // 先淘汰：简单计数（localStorage 无原生序，key 排序即插入序近似）
    const mine: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(TTS_LS_PREFIX)) mine.push(k);
    }
    while (mine.length >= TTS_LS_MAX) {
      // key 形如 tts-audio:zh|+0%|词 —— 无时间戳可排序，淘汰字典序首个
      //（key 含 rate，同 rate 内淘汰最早的近似可接受；条目本身廉价）
      mine.sort();
      const victim = mine.shift();
      if (victim) window.localStorage.removeItem(victim);
    }
    blob.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      // 分块 btoa（大字符串会栈溢出）
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      window.localStorage.setItem(TTS_LS_PREFIX + key, btoa(bin));
    }).catch(() => {});
  } catch {
    /* 配额满等——静默，内存缓存仍然有效 */
  }
}

export function prefetchTts(text: string, lang: 'zh' | 'en', rate = '+0%'): void {
  if (typeof window === 'undefined' || !('fetch' in window)) return;
  restoreFromLocalStorage(); // 首次预取时顺便回填持久缓存
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
      persistToLocalStorage(key, blob); // B1: 动态文本持久化
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

/**
 * 🔒 静态 MP3 预取（2026-10-20 弱网加固 · 故事页专用）：
 * 用 <link rel="preload" as="audio"> 触发浏览器提前下载预生成文件，
 * 不走任何服务端合成。SW 的 Cache First 策略会自动把它收进缓存，
 * 弱网/断网时播放直接命中本地。
 * 与 prefetchTts（服务端合成路线）互不干扰——本函数只服务
 * 「已在 833 条故事静态集里」的文本。
 */
const staticPreloaded = new Set<string>();
export function prefetchStaticAudio(text: string, lang: 'zh' | 'en'): void {
  if (typeof document === 'undefined') return;
  const url = localAudioUrl(text, lang);
  if (staticPreloaded.has(url)) return; // 同 URL 只预取一次
  staticPreloaded.add(url);
  try {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = url;
    document.head.appendChild(link);
    // ⚠️ 不自动移除：preload 下载中移除 <link> 会取消下载（弱网下
    // 大概率 30s 内没下完）。head 里每会话最多几十个节点（章节级
    // 预取），导航卸载自然清理，不构成泄漏。
  } catch {
    /* 预取是纯优化，任何失败静默 */
  }
}

/* ───────────────────────────────────────────────────────────────
 * 批量预取（2026-10-18 B4）
 *
 * 一次请求把整轮要读的文本全部打包合成，替代 N 次 /api/tts 往返：
 *   - 省 HTTP 往返（HTTP/1.1 同域并发上限 6，逐条预取会排队）
 *   - 服务端串行协议下批处理天然按序执行，不互相挤占
 * 服务端 /api/tts/batch 限 10 条/次、10 次/分（IP）。
 * 失败静默——预取是纯优化，播放时仍有单接口与 Web Speech 兜底。
 * ─────────────────────────────────────────────────────────────── */
export function prefetchTtsBatch(
  items: Array<{ text: string; lang: 'zh' | 'en'; rate?: string }>
): void {
  if (typeof window === 'undefined' || !('fetch' in window)) return;
  restoreFromLocalStorage();
  // 只挑没缓存过的；同一 key 重复出现时去重（同一句可能既是题干又是朗读）
  const seen = new Set<string>();
  const todo: Array<{ text: string; lang: 'zh' | 'en'; rate: string }> = [];
  for (const it of items) {
    if (!it || !it.text) continue;
    // ⚠️ 静态短文本（≤20 字，可命中第 0 层本地 MP3）排除在批量之外：
    // 汉字/单词/古诗句本来就该走 L0 零延迟本地文件。批接口的 10 条会
    // 被串行 Python 进程占住 30 秒+，实时播放的单条 L3 请求（6s 超时）
    // 全部排队超时 → 安卓平板「点了没声音」（iPad 走 L1 Web Speech
    // 不经服务端，所以只有安卓设备暴露此 bug）。
    const plain = it.text.replace(/[，。！？、：；,.!?\s]/g, '');
    if (plain.length > 0 && plain.length <= 20) continue; // L0 会接住它
    const rate = it.rate ?? '+0%';
    const key = `${it.lang}|${rate}|${it.text}`;
    if (ttsBlobCache.has(key) || seen.has(key)) continue;
    seen.add(key);
    todo.push({ text: it.text, lang: it.lang, rate });
    if (todo.length >= 10) break;
  }
  if (todo.length < 2) return; // 单条没有批处理收益，交给 prefetchTts
  fetch('/api/tts/batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: todo }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((j: { audio?: Record<string, string> } | null) => {
      if (!j?.audio) return;
      for (const [key, base64] of Object.entries(j.audio)) {
        if (ttsBlobCache.has(key)) continue;
        const blob = base64ToBlob(base64);
        if (!blob) continue;
        ttsBlobCache.set(key, blob);
        persistToLocalStorage(key, blob); // 与单条预取同口径落持久缓存
        if (ttsBlobCache.size > TTS_CACHE_MAX) {
          const first = ttsBlobCache.keys().next().value;
          if (first) ttsBlobCache.delete(first);
        }
      }
    })
    .catch(() => {});
}

/** base64 → Blob（批接口返回体；解码失败返回 null 走降级） */
function base64ToBlob(b64: string): Blob | null {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/mpeg' });
  } catch {
    return null;
  }
}

/* ───────────────────────────────────────────────────────────────
 * 第 0 层：预生成本地音频（2026-10-18 B0）
 * 静态内容的 MP3 由 scripts/gen-audio.mjs 生成于 public/audio/{zh,en}/。
 * 文件名 = encodeURIComponent(text)（与 scripts/audio-manifest.mjs 的
 * audioFileName 同算法）。HEAD 探测会拖慢首次播放——这里直接尝试播放，
 * onerror 视为未命中，降级到后续层。播放成功与否由 Promise 回执。
 * ─────────────────────────────────────────────────────────────── */
function localAudioUrl(text: string, lang: 'zh' | 'en'): string {
  // ⚠️ 英语统一小写：清单（scripts/audio-manifest.mjs）把 LETTERS 的 'Apple'
  // 与词表的 'apple' 合并成一个小写文件（macOS 大小写不敏感文件系统会让
  // 大写版静默覆盖小写版，Linux 上则缺文件——check-audio 已抓过这个坑）。
  // 播放层必须同规则，否则 'Apple' 请求 /audio/en/Apple.mp3 必然 404。
  const src = lang === 'en' ? text.toLowerCase() : text;
  // URL 侧 percent-encode（浏览器语义）：服务器收到 %E4%B8%80 会解码回
  // 「一」再查磁盘——磁盘存的是**明文文件名**（audioFileName 的规则），
  // 这里的编码与磁盘明文正好对偶。此前磁盘存 %E4 字面名导致全链 400。
  const enc = encodeURIComponent(src).replace(/[()*!']/g, (c) =>
    ({ '(': '%28', ')': '%29', '*': '%2A', '!': '%21', "'": '%27' }[c] || c)
  );
  return `/audio/${lang}/${enc}.mp3`;
}

/** 第 0 层播放器：命中返回 true；404/解码失败返回 false（降级信号）。 */
function playLocalAudio(
  text: string,
  lang: 'zh' | 'en',
  wsRate: number,
  pauseMs: number,
  /** true = 跳过 20 字门（调用方确知文本在预生成清单里，如故事段落——
   * 833 条故事 MP3 已进镜像，但段落长 >20 字被门挡住等于白做）。 */
  skipLengthGate = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('Audio' in window)) {
      resolve(false);
      return;
    }
    // 动态文本（题干/台词/长短句）几乎必然未命中——快速长度门限，
    // 避免「先等 404 再降级」给高频动态调用加半拍延迟。静态清单的
    // 汉字/单词/古诗句全部 ≤ 20 字（古诗最长句 12 字 + 标点）。
    if (!skipLengthGate) {
      const plain = text.replace(/[，。！？、：；,.!?\s]/g, '');
      if (plain.length === 0 || plain.length > 20) {
        resolve(false);
        return;
      }
    }
    try {
      const audio = new Audio(localAudioUrl(text, lang));
      // playbackRate 与 Web Speech 的 rate 同域（0.5~2），超界浏览器自动钳制
      if (wsRate && wsRate > 0 && wsRate !== 1) audio.playbackRate = wsRate;
      let settled = false;
      // failTimer 必须先声明占位，done 定义后再赋值——箭头回调里引用
      // 「声明前」的 const 会构成 TDZ 隐患（15s 后触发时若按严格求值
      // 直接 ReferenceError），这里用 let 显式规避。
      let failTimer: ReturnType<typeof setTimeout> | null = null;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (failTimer) clearTimeout(failTimer);
        // 释放 src 让 GC 回收（本地静态文件走 HTTP 缓存，无需 ObjectURL）
        if (!ok) audio.removeAttribute('src');
        if (ok && pauseMs > 0) setTimeout(() => resolve(true), pauseMs);
        else resolve(ok);
      };
      // 时长兜底：部分安卓 WebView 在网络/解码异常时不触发 onerror，
      // 只静默停住（readyState 永远不前进）——挂一个「合理最长时长」
      // 计时器，超时按失败降级，绝不让 L0 把整个朗读链挂死。
      // 静态短句的合理时长上限：60 字符撑死 15s（含 playbackRate 0.5）。
      failTimer = setTimeout(() => done(false), 15000);
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    } catch {
      resolve(false);
    }
  });
}

function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const silent = new Audio(
      'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA'
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
    if (target.startsWith('zh'))
      return (vl === 'zh-cn' || vl === 'zh') && !vl.startsWith('zh-hk') && !vl.startsWith('zh-tw');
    if (target.startsWith('en')) return (vl === 'en-us' || vl === 'en') && !vl.startsWith('en-gb');
    return vl.startsWith(target);
  };
  const pool = voices.filter(match);
  const friendly = pool.find((x) =>
    /female|woman|girl|ting|huihui|yaoyao|xiao|mei|child|kids|samantha|zira|google us|microsoft|晓晓|晓颜|婷婷/i.test(
      x.name
    )
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
  opts: { wsRate?: number; pitch?: number; pauseMs?: number; preferStatic?: boolean } = {}
) {
  await playTtsWithResult(text, lang, opts);
}

/**
 * 与 playTts 完全相同的降级流程，但额外回执「哪一层成功了 + 耗时多少」。
 *
 * ## 为什么需要它
 * 本项目此前存在两套并行的三层降级实现：`lib/speak.ts`（生产路径，55 个文件在用）
 * 与 `lib/tts/orchestrator.ts`（仅诊断页在用，自建一套引擎 + 熔断器）。
 * 两套各自实现一遍降级，既有重复维护成本，也出现了能力分叉 ——
 * orchestrator 的引擎缺少长文本切分、keep-alive、blob 缓存等 speak.ts 才有的关键处理。
 *
 * 现在统一为 speak.ts 是唯一实现，orchestrator 退化为薄适配器（见 lib/tts/orchestrator.ts）。
 * 适配层需要知道「实际用了哪一层」来做指标统计，故由这里回执。
 *
 * @returns success + 命中的降级层 + 耗时（ms）
 */
export async function playTtsWithResult(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number; preferStatic?: boolean } = {}
): Promise<{
  success: boolean;
  engineUsed: 'local-audio' | 'web-speech-strict' | 'web-speech-loose' | 'edge-tts';
  latencyMs: number;
}> {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  const pauseMs = opts.pauseMs ?? 0;

  // ── 第 0 层：预生成本地音频（2026-10-18 B0）──────────────────
  // 静态学习内容（汉字/拼音例字/古诗句/英语单词）已由 edge-tts 预生成 MP3
  //（scripts/gen-audio.mjs → public/audio，与第 3 层同嗓音）。命中 = 零合成
  // 延迟 + 音色与在线合成完全一致。排在 Web Speech 之前：Android WebView
  // 的 Web Speech 本就不可靠，且神经嗓音在 iOS 上也比系统嗓音稳。
  // 速率用 HTMLAudioElement.playbackRate 实现（0.5~2 与 Web Speech 域对齐）。
  const localHit = await playLocalAudio(text, lang, wsRate, pauseMs, opts.preferStatic === true);
  if (localHit) {
    return {
      success: true,
      engineUsed: 'local-audio',
      latencyMs: Math.round(now() - startedAt),
    };
  }

  // ── 第 1 层：本地 Web Speech 严格匹配（零延迟，普通话）────────
  if (hasStrictVoice(lang)) {
    ttsDebug('[TTS-L1] strict Web Speech', lang, text.slice(0, 25));
    const played = await speakEnd(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch, pauseMs);
    if (played)
      return {
        success: true,
        engineUsed: 'web-speech-strict',
        latencyMs: Math.round(now() - startedAt),
      };
  }

  // ── 第 2 层：Web Speech 宽松兜底（零延迟，粤语/台式也行）────
  // 本机无严格嗓音时（如 Android Edge）先走宽松，总比走服务端快。
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    ttsDebug('[TTS-L2] loose Web Speech', lang, text.slice(0, 25));
    const loosePlayed = await speakEndLoose(
      text,
      lang === 'zh' ? 'zh' : 'en',
      wsRate,
      pitch,
      pauseMs
    );
    if (loosePlayed)
      return {
        success: true,
        engineUsed: 'web-speech-loose',
        latencyMs: Math.round(now() - startedAt),
      };
  }

  // ── 第 3 层：服务端 edge-tts（神经嗓音，最后兜底）────────────
  ttsDebug('[TTS-L3] server edge-tts', lang, text.slice(0, 30));
  const serverOk = await tryServer(text, lang, { ...opts, wsRate, pitch });
  if (serverOk)
    return { success: true, engineUsed: 'edge-tts', latencyMs: Math.round(now() - startedAt) };

  return { success: false, engineUsed: 'edge-tts', latencyMs: Math.round(now() - startedAt) };
}

/** 第 3 层：走服务端 /api/tts 播放，结束时 resolve；失败则结束（两层 Web Speech 已兜底）。 */
function tryServer(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number }
): Promise<boolean> {
  const wsRate = opts.wsRate ?? 0.8;
  const pauseMs = opts.pauseMs ?? 0;
  return new Promise<boolean>(async (resolve) => {
    if (typeof window === 'undefined' || !('fetch' in window)) {
      resolve(false);
      return;
    }
    // ⚠️ settle() 统一收口：所有出口（成功/失败/超时）都经它 resolve，
    // 并保证 (a) 挂起定时器被清掉、(b) ObjectURL 被释放。
    // 原实现里 abort 计时只在 .catch 里 clearTimeout，**成功路径完全不清理**；
    // pauseMs 定时器与 ObjectURL 同理。故事页长文连读会持续累积这些定时器
    // （实测长文本一次朗读残留 15 个），构成真实内存泄漏。
    let settled = false;
    let abortTimer: ReturnType<typeof setTimeout> | null = null;
    let objectUrl: string | null = null;
    const settle = (ok: boolean, ms = 0) => {
      if (settled) return;
      settled = true;
      if (abortTimer) {
        clearTimeout(abortTimer);
        abortTimer = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      if (ms > 0) setTimeout(() => resolve(ok), ms);
      else resolve(ok);
    };

    // 缓存命中：跳过 fetch，直接播放 blob（~0ms 延迟）。
    // 播放失败（onerror：localStorage 恢复的坏 blob / 编码不兼容）时
    // 丢弃缓存并 fetch 重新合成——此前直接判死整层，导致「明明有服务端
    // 却静默无声」（安卓 WebView 对坏 blob 只触发 onerror 不抛异常）。
    const edgeRate = toEdgeRate(wsRate);
    const cached = getCachedBlob(text, lang, edgeRate);
    if (cached) {
      const url = URL.createObjectURL(cached);
      objectUrl = url;
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.onended = () => settle(true, pauseMs);
      audio.onerror = () => {
        // 坏 blob：清缓存 + 撤 URL + 判失败（本层重取由上层整体重试
        // 语义决定：playTtsWithResult 已尽力，不在此处再发请求，
        // 保持「一次调用 = 一次网络尝试」的可预测性）
        ttsBlobCache.delete(`${lang}|${edgeRate}|${text}`);
        try {
          window.localStorage.removeItem(`tts-audio:${lang}|${edgeRate}|${text}`);
        } catch {}
        settle(false);
      };
      audio.play().catch(() => settle(false));
      return;
    }
    const controller = new AbortController();
    // 超时时长按文本长度动态计算：整段长文一次合成需要数秒，
    // 旧的固定 5s 对故事长段会误杀 → 静默失败。语音播放本身不在此计时内。
    const timeoutMs = Math.min(20000, Math.max(6000, text.length * 120));
    abortTimer = setTimeout(() => controller.abort(), timeoutMs);
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
        // B1: 播放路径也入缓存（原先只播不存，同一段文字重播要再付一次合成）。
        // 静态内容已走第 0 层本地文件，这里进缓存的都是动态文本——正是
        // 最值得持久化的内容。
        const cacheKey = `${lang}|${toEdgeRate(wsRate)}|${text}`;
        if (!ttsBlobCache.has(cacheKey)) {
          ttsBlobCache.set(cacheKey, blob);
          persistToLocalStorage(cacheKey, blob);
          if (ttsBlobCache.size > TTS_CACHE_MAX) {
            const first = ttsBlobCache.keys().next().value;
            if (first) ttsBlobCache.delete(first);
          }
        }
        const url = URL.createObjectURL(blob);
        objectUrl = url;
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.onended = () => {
          // pauseMs 暂停：音频播放结束后延迟 resolve
          settle(true, pauseMs);
        };
        audio.onerror = () => settle(false);
        audio.play().catch(() => settle(false));
      })
      .catch(() => settle(false));
  });
}

export function playTtsEnd(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number; preferStatic?: boolean } = {}
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
  const sentences = text.match(/[^。！？!?；;…\n]+[。！？!?；;…]*|\n+|[^。！？!?；;…\n]+$/g) ?? [
    text,
  ];
  const out: string[] = [];
  for (const raw of sentences) {
    const t = raw.replace(/\n+/g, '，').trim();
    if (!t || /^[，,、]+$/.test(t)) continue;
    if (t.length <= maxLen) {
      out.push(t);
      continue;
    }
    // 超长句再按逗号/顿号粗切
    let buf = '';
    for (const seg of t.split(/(?<=[，,、 ])/)) {
      if ((buf + seg).length > maxLen && buf) {
        out.push(buf);
        buf = '';
      }
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
  acceptEndWithoutStart = false
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    ensureVoices();
    const v = pickVoice(lang);
    if (!v) {
      resolve(false);
      return;
    }

    const chunks = splitSpeechText(text);
    let idx = 0;
    let done = false;
    let started = false;
    let keepAlive: ReturnType<typeof setInterval> | null = null;
    /** 所有一次性 setTimeout 的句柄：必须在 finish 时清理，否则逐句朗读会持续堆积。 */
    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
    /** 单个定时器的取消函数：供只想提前撤销某一个的场景（如 utterance 触发时）。 */
    const cancelers = new Map<ReturnType<typeof setTimeout>, () => void>();

    /**
     * 注册一个一次性定时器。
     *
     * ⚠️ `done` 守卫不可省：utterance 的 onend/onstart 在 finish() 之后仍可能被
     * 触发（引擎异步派发），此时 onend 里的 `later(speakNext, 60)` 会在
     * cleanup() **之后**注册新定时器 —— 于是它逃出清理，留下一个存活 60ms 的孤儿。
     * 实测「正常读完一句」恰好残留 1 个；长文本走服务端路径时残留更多。
     * 这里在已结束时直接不注册，从根上杜绝孤儿定时器。
     */
    const later = (fn: () => void, ms: number) => {
      if (done) return null;
      const h = setTimeout(() => {
        pendingTimeouts.delete(h);
        cancelers.delete(h);
        fn();
      }, ms);
      pendingTimeouts.add(h);
      cancelers.set(h, () => {
        clearTimeout(h);
        pendingTimeouts.delete(h);
        cancelers.delete(h);
      });
      return h;
    };

    /**
     * 提前撤销某个定时器。
     * 接受 null（later 在已结束时返回 null，见上方守卫说明），此时什么都不做。
     */
    const cancelLater = (h: ReturnType<typeof setTimeout> | null) => {
      if (h == null) return;
      const cancel = cancelers.get(h);
      if (cancel) cancel();
      else clearTimeout(h);
    };

    const cleanup = () => {
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
      // ⚠️ 必须一并清掉所有挂起定时器。原先只清了 keepAlive，
      // 而「总兜底计时」是按字数算的（最长 3 分钟）且从不清理 ——
      // 故事页顺序连读 20 句就堆积 20 个存活定时器，每个还持有 promise 闭包，
      // 构成真实内存泄漏（同文件的 keepAlive 有清理，说明作者知道要清，只是漏了这些）。
      for (const h of [...pendingTimeouts]) cancelLater(h);
      pendingTimeouts.clear();
      cancelers.clear();
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
        } catch {
          /* 引擎异常交给 utterance onerror/兜底计时处理 */
        }
      }, 8000);
    };

    // 总兜底：按字数估算（慢速童声约 300ms/字），封顶 3 分钟
    later(() => finish(started), Math.min(180000, Math.max(20000, text.length * 350)));

    const speakNext = () => {
      if (done) return;
      if (idx >= chunks.length) {
        // pauseMs 暂停：全部播完后延迟 resolve，用于顺序连读时的段落间隔
        if (pauseMs > 0) later(() => finish(started), pauseMs);
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
      const startTimer = later(
        () => {
          if (!chunkStarted) {
            // 只有第一句启动失败才算「朗读失败」让上层降级；
            // resize 后的句子失败按放弃处理（resolve started，见文件头注释）
            finish(started && idx > 1);
          }
        },
        idx === 1 ? 800 : 2000
      );
      u.onstart = () => {
        chunkStarted = true;
        started = true;
        cancelLater(startTimer);
        startKeepAlive();
      };
      u.onend = () => {
        cancelLater(startTimer);
        // ⚠️ done 守卫：引擎派发 onend 是异步的，可能发生在 finish() 之后
        // （例如最后一句播完 → speakNext 里 finish → 引擎又补发一次 onend）。
        // 此时若继续排下一句，就会注册一个逃过 cleanup 的孤儿定时器。
        if (done) return;
        if (acceptEndWithoutStart) started = true; // onend 到达说明确实出声了
        // 走 later() 以便 finish 时统一清理（组件卸载/被打断时不该再排下一句）
        later(speakNext, 60);
      };
      u.onerror = (e) => {
        cancelLater(startTimer);
        // 用户/代码主动 cancel 视为正常结束；started 后出错不降级重读
        if (e.error === 'interrupted' || e.error === 'canceled') {
          finish(true);
          return;
        }
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
          if (
            retries <= 0 ||
            (!window.speechSynthesis.speaking && !window.speechSynthesis.pending)
          ) {
            speakNext();
            return;
          }
          retries--;
          // 走 later()：朗读被打断（finish 已发生）时这条重试链必须停止，
          // 否则它会在已结束后继续把 speakNext 排上队列
          later(trySpeak, 10);
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
function speakEnd(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs = 0
): Promise<boolean> {
  return speakChunks(text, lang, rate, pitch, pauseMs, pickVoiceStrict);
}

/**
 * 宽松模式朗读（第 2 层兜底）：不排斥粤语/台式，
 * 只要 onstart 触发就视为成功，不再严格检查嗓音匹配。
 */
function speakEndLoose(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs = 0
): Promise<boolean> {
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
  // 弱网加固：表扬语全部在预生成静态集——直查本地 MP3（弱网/断网
  // 也必出声，这是孩子最重要的正反馈），未命中才走全链。
  void playTts(text, 'zh', { wsRate: rate, preferStatic: true });
}
