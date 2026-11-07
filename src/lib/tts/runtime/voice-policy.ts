/** Web Speech 嗓音发现、筛选与启动预热。 */

let voicesReady = false;

export function ensureVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (voicesReady) return;
  if (window.speechSynthesis.getVoices().length) {
    voicesReady = true;
    return;
  }

  // 个别旧 WebView 没有 addEventListener；下一轮调用仍会重新枚举嗓音。
  window.speechSynthesis.addEventListener?.(
    'voiceschanged',
    () => {
      voicesReady = true;
    },
    { once: true }
  );
}

/**
 * voices 启动预热：
 * Chrome/WebView 的 getVoices() 在页面加载初期经常返回空数组（异步加载，
 * voiceschanged 可能数秒后才触发）。孩子端 layout 挂载时调用一次，立即枚举
 * 并持续轮询，避免冷启动阶段把有严格嗓音的设备误判到 L2/L3。
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
 * 严格匹配：优先女性/儿童友好的 zh-CN / en-US 嗓音。
 * 排除粤语(zh-HK)、台式(zh-TW)、英式(en-GB)——学习内容是普通话，选到粤语会教错发音。
 */
export function pickVoiceStrict(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const target = lang.toLowerCase();
  const match = (voice: SpeechSynthesisVoice) => {
    const voiceLang = (voice.lang || '').toLowerCase();
    if (target.startsWith('zh'))
      return (
        (voiceLang === 'zh-cn' || voiceLang === 'zh') &&
        !voiceLang.startsWith('zh-hk') &&
        !voiceLang.startsWith('zh-tw')
      );
    if (target.startsWith('en'))
      return (voiceLang === 'en-us' || voiceLang === 'en') && !voiceLang.startsWith('en-gb');
    return voiceLang.startsWith(target);
  };
  const pool = voices.filter(match);
  const friendly = pool.find((voice) =>
    /female|woman|girl|ting|huihui|yaoyao|xiao|mei|child|kids|samantha|zira|google us|microsoft|晓晓|晓颜|婷婷/i.test(
      voice.name
    )
  );
  return friendly ?? pool[0];
}

/**
 * 宽松匹配：任何 zh/en 前缀的嗓音都接受，包括粤语、台式与英式。
 * 总比静默好，但只在严格匹配失败后使用。
 */
export function pickVoiceLoose(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const target = lang.toLowerCase();
  return voices.find((voice) => (voice.lang || '').toLowerCase().startsWith(target));
}

export function hasStrictVoice(lang: 'zh' | 'en'): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  ensureVoices();
  if (!window.speechSynthesis.getVoices().length) return false;
  return pickVoiceStrict(lang === 'zh' ? 'zh-CN' : 'en-US') !== undefined;
}

export function hasVoices(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    window.speechSynthesis.getVoices().length > 0
  );
}
