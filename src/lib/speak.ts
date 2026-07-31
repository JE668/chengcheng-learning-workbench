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

/** 挑选与目标语言匹配的嗓音，优先女性/儿童友好的中文或英文嗓音 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const same = voices.filter((x) => x.lang && x.lang.toLowerCase().startsWith(lang.toLowerCase()));
  const friendly = same.find((x) =>
    /female|woman|girl|ting|huihui|yaoyao|xiao|mei|child|kids|samantha|zira|google us|microsoft/i.test(x.name),
  );
  return friendly ?? same[0] ?? voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(lang.toLowerCase()));
}

function speak(text: string, lang: string, rate: number, pitch: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  ensureVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
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

export function speakZh(text: string, rate = 0.8) {
  void playTts(text, 'zh', { wsRate: rate, pitch: 1.05 });
}

export function speakEn(text: string, rate = 0.75) {
  void playTts(text, 'en', { wsRate: rate, pitch: 1.0 });
}

/**
 * 朗读主流程：
 * 1) 优先请求服务端 /api/tts（Edge 神经嗓音，跨设备音质一致）；
 * 2) 任意失败（离线 / 合成服务异常 / 网络错误）降级到浏览器原生 Web Speech。
 * wsRate 同时用于：(a) Web Speech 降级时的语速；(b) 推算 Edge 的 relative rate。
 */
async function playTts(
  text: string,
  lang: 'zh' | 'en',
  opts: { wsRate?: number; pitch?: number } = {},
) {
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  if (typeof window !== 'undefined' && 'fetch' in window) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate) }),
      });
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
      /* 网络/解析异常 → 降级 */
    }
  }
  speak(text, lang === 'zh' ? 'zh-CN' : 'en-US', wsRate, pitch);
}

/**
 * 朗读一个拼音音节（如「bà」「shuǐ」「ü」）。
 * 拼音的拉丁字母会被语音引擎当成英文念，所以改读一个同音汉字（如 bà→爸）。
 * 中文神经嗓音读这个汉字时，音节和声调都正确，小朋友听起来就是标准的拼音。
 * - syllable：保留以兼容调用点；
 * - han：可选，从例词里取的第一个汉字，优先用它发音；
 * - wsRate 比普通中文更慢，方便小朋友听清并跟读。
 */
export function speakPinyin(syllable: string, _tone = 0, han?: string) {
  const text = han && /[\u4e00-\u9fff]/.test(han) ? han : syllable;
  void playTts(text, 'zh', { wsRate: 0.75, pitch: 1.1 });
}
