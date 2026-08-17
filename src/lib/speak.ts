'use client';

/**
 * 共享的语音朗读助手（TTS），供各学习模块复用。
 * - 中文 / 英文 / 拼音统一优先走服务端 /api/tts（Edge 神经嗓音，跨设备音质一致）；
 *   任意失败（离线 / 合成服务异常 / 网络错误）降级到浏览器原生 Web Speech。
 * - 拼音直接以「带声调符号」的形式（如 bà / shuǐ / ü）交给 zh-CN 神经嗓音，
 *   由它读成正确的拼音音节并带上声调（不再转数字调号——「ba4」会被读成
 *   「八…四」，根本不像拼音）。
 * - 整体语速偏慢，适配一年级小朋友跟读。
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
    () => {
      voicesReady = true;
    },
    { once: true },
  );
}

/** 挑选与目标语言匹配的嗓音，优先女性/儿童友好的中文或英文嗓音。
 *  严格匹配 zh-CN（普通话），避免 Safari 在 iPad 系统设粤语时选到 zh-HK 粤语嗓音。
 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  // 严格匹配目标语言前缀（zh-CN 不能匹配到 zh-HK 粤语；en-US 不匹配 en-GB）
  const target = lang.toLowerCase();
  const same = voices.filter((x) => {
    const vl = (x.lang || '').toLowerCase();
    // 中文：精确匹配 zh-CN（排除 zh-HK 粤语 / zh-TW 台湾），若无 zh-CN 再退而求其次
    if (target.startsWith('zh')) return vl === 'zh-cn' || vl === 'zh';
    // 英文：精确匹配 en-US（排除 en-GB 英式）
    if (target.startsWith('en')) return vl === 'en-us' || vl === 'en';
    return vl.startsWith(target);
  });
  // 若严格匹配无果，放宽到「同语种但非目标方言」（如 zh-HK 也行，至少有声）
  const wider = same.length
    ? same
    : voices.filter((x) => (x.lang || '').toLowerCase().startsWith(target.slice(0, 2)));
  const friendly = wider.find((x) =>
    /female|woman|girl|ting|huihui|yaoyao|xiao|mei|child|kids|samantha|zira|google us|microsoft|晓晓|晓颜/i.test(x.name),
  );
  return friendly ?? wider[0];
}

/** 不同浏览器的 Web Speech 对 rate 的解释不同：
 *  - Safari：rate 0.65 确实明显慢
 *  - Edge/Chrome：rate 0.65 仍偏快（需要更低才能达到同样效果）
 *  这里按浏览器类型对 wsRate 做一次校准，使跨设备语速体感一致。
 */
/**
 * 不同浏览器的 Web Speech 对 rate 的解释不同：
 *  - Safari：rate 0.65 确实明显慢
 *  - Edge/Chrome：rate 0.65 仍偏快（需要更低才能达到同样效果）
 *  这里按浏览器类型对 wsRate 做一次校准，使跨设备语速体感一致。
 *
 * 注意：Chrome / Edge 的 UA 都自带 "Safari" 字样（例如 Chrome 的 UA 含
 * "...Chrome/120... Safari/537.36"），所以「排除 Safari」必须用「不含 Chrome
 * 才算真 Safari」来判断，否则校准分支对所有真实浏览器都进不去（历史版本就是
 * 这么写成死代码的，导致 Chrome/Edge 始终没被校准）。
 */
export function calibrateRate(wsRate: number): number {
  if (typeof navigator === 'undefined') return wsRate;
  const ua = navigator.userAgent;
  const hasChrome = /Chrome/i.test(ua);
  const isGenuineSafari = /Safari/i.test(ua) && !hasChrome; // 真 Safari 的 UA 不含 Chrome
  // Edge/Chrome 的 Web Speech 引擎对低 rate 不敏感，需要再降约 20%
  if ((hasChrome || /Edg/i.test(ua)) && !isGenuineSafari) {
    return Math.max(0.1, wsRate * 0.8);
  }
  return wsRate;
}

function speak(text: string, lang: string, rate: number, pitch: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  ensureVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = calibrateRate(rate);
  u.pitch = pitch;
  const v = pickVoice(lang);
  if (v) u.voice = v;

  const fire = () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  // 嗓音未就绪时，等 voiceschanged 再播，避免首句被吞
  if (voicesReady) fire();
  else window.speechSynthesis.addEventListener('voiceschanged', fire, { once: true });
}

/** Web Speech 的语速(0~2) ↔ Edge 百分比 的近似映射：1.0 = 100% = +0% */
function toEdgeRate(wsRate: number): string {
  const pct = Math.round((wsRate - 1) * 100);
  return pct === 0 ? '+0%' : `${pct}%`;
}

export function speakZh(text: string, rate = 0.55) {
  void playTts(text, 'zh', { wsRate: rate, pitch: 1.1 });
}

export function speakEn(text: string, rate = 0.55) {
  void playTts(text, 'en', { wsRate: rate, pitch: 1.05 });
}

/**
 * 朗读主流程：
 * 1) 优先请求服务端 /api/tts（Edge 神经嗓音，跨设备音质一致）；
 * 2) 任意失败（离线 / 合成服务异常 / 网络错误）降级到浏览器原生 Web Speech。
 * wsRate 同时用于：(a) Web Speech 降级时的语速；(b) 推算 Edge 的 relative rate。
 */
export async function playTts(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number } = {},
) {
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  const pauseMs = opts.pauseMs ?? 0;
  if (typeof window !== 'undefined' && 'fetch' in window) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000); // 8s 超时，避免挂太久
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate), pause: pauseMs }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          speak(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch);
        };
        await audio.play();
        return;
      }
    } catch {
      /* 网络/解析异常/超时 → 降级到 Web Speech */
    }
  }
  // Web Speech 降级；若浏览器不支持 Web Speech，静默失败（不弹 alert 以免打扰孩子）
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    speak(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch);
  }
}

/**
 * 朗读并在「播放结束」时 resolve 的 Promise 版本——用于剧情段落按顺序连读，
 * 保证上一句读完再开始下一句，不会叠在一起。
 * - Edge 路径：监听 audio.onended；失败/出错降级到 Web Speech 并同样等 onend。
 * - Web Speech 路径：监听 utterance.onend / onerror，并加 30s 兜底超时，避免卡死。
 */
export function playTtsEnd(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number; pauseMs?: number } = {},
): Promise<void> {
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  const pauseMs = opts.pauseMs ?? 0;
  return new Promise<void>((resolve) => {
    const fallback = () => speakEnd(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch).then(resolve);
    if (typeof window !== 'undefined' && 'fetch' in window) {
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate), pause: pauseMs }),
      })
        .then((res) => (res.ok ? res.blob() : Promise.reject()))
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            fallback();
          };
          audio.play().catch(fallback);
        })
        .catch(fallback);
    } else {
      fallback();
    }
  });
}

/** Web Speech 朗读并在 onend/onerror 时 resolve（含兜底超时）。
 *  若浏览器不支持 Web Speech（如某些小米浏览器），直接 resolve（不卡住顺序朗读）。
 */
function speakEnd(text: string, lang: string, rate: number, pitch: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    ensureVoices();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = calibrateRate(rate);
    u.pitch = pitch;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    const fire = () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };
    if (voicesReady) fire();
    else window.speechSynthesis.addEventListener('voiceschanged', fire, { once: true });
    // 兜底：最长朗读 30s，避免个别引擎不触发 onend 时卡住顺序朗读
    setTimeout(finish, 30000);
  });
}

/**
 * 朗读一个拼音音节（如「bà」「shuǐ」「ü」）。
 * 拼音的拉丁字母会被语音引擎当成英文念，所以改读一个同音汉字（如 bà→爸）。
 * 中文神经嗓音读这个汉字时，音节和声调都正确，小朋友听起来就是标准的拼音。
 * - syllable：保留以兼容调用点；
 * - han：可选，从例词里取的第一个汉字，优先用它发音；
 * - wsRate 用最慢稳定档（0.45，约 Edge -55%），并在音节后追加约 700ms 静音停顿，
 *   使单个拼音总时长接近 1.3 秒，方便小朋友听清并跟读。
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

/** 随机夸夸语音（答对/完成时给孩子情绪反馈） */
export function praise(rate = 0.7) {
  const text = PRAISES[Math.floor(Math.random() * PRAISES.length)];
  speakZh(text, rate);
}
