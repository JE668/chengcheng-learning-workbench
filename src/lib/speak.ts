'use client';

/**
 * 共享的语音朗读助手（TTS），供各学习模块复用。
 * - 中文/英文按语言选择对应嗓音，避免英文被中文嗓音误读。
 * - 拼音统一转成「数字调号」再朗读（如 bà→ba4、shuǐ→shui3），
 *   因为 zh-CN 语音引擎不认带声调符号的拼音字母，直接读会错。
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

export function speakZh(text: string, rate = 0.85) {
  speak(text, 'zh-CN', rate, 1.1);
}

export function speakEn(text: string, rate = 0.75) {
  speak(text, 'en-US', rate, 1.05);
}

/** 带声调符号的拼音 → 数字调号（ā→a1, á→a2 …；无声调符号的 ü 等靠 tone 字段补） */
const TONE_MAP: Record<string, string> = {
  ā: 'a1', á: 'a2', ǎ: 'a3', à: 'a4',
  ē: 'e1', é: 'e2', ě: 'e3', è: 'e4',
  ī: 'i1', í: 'i2', ǐ: 'i3', ì: 'i4',
  ō: 'o1', ó: 'o2', ǒ: 'o3', ò: 'o4',
  ū: 'u1', ú: 'u2', ǔ: 'u3', ù: 'u4',
  ǖ: 'ü1', ǘ: 'ü2', ǚ: 'ü3', ǜ: 'ü4',
};

/**
 * 朗读一个拼音音节（如「bà」「shuǐ」「ü」）。
 * syllable 来自数据里的 pinyin 字段，tone 来自 tone 字段（0 表示无声调/声母/整体认读）。
 */
export function speakPinyin(syllable: string, tone = 0) {
  let s = syllable;
  for (const [k, v] of Object.entries(TONE_MAP)) {
    if (s.includes(k)) s = s.split(k).join(v);
  }
  // 无声调符号但 tone 字段给出 1~4（如单独的「ü」tone=2）→ 补数字
  if (!/[1-4]/.test(s) && tone >= 1 && tone <= 4) s = `${s}${tone}`;
  speakZh(s);
}
