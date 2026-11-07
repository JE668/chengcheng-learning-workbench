/** 浏览器 TTS 的平台差异、诊断日志与语速格式适配。 */

export type SpeechLanguage = 'zh' | 'en';

export interface PlaybackOptions {
  wsRate?: number;
  pitch?: number;
  pauseMs?: number;
  preferStatic?: boolean;
}

export type PlaybackEngine = 'local-audio' | 'web-speech-strict' | 'web-speech-loose' | 'edge-tts';

export interface PlaybackResult {
  success: boolean;
  engineUsed: PlaybackEngine;
  latencyMs: number;
}

/**
 * 诊断日志：默认静默。localStorage 设 tts-debug=1 后在设备控制台/
 * vConsole 里可见（安卓平板接 USB 调试时用），生产不刷屏。
 */
export function ttsDebug(...args: unknown[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('tts-debug') === '1')
      console.log('[TTS]', ...args);
  } catch {
    /* localStorage 不可用则静默 */
  }
}

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

/** Web Speech 语速(0~2) → 服务端百分比字符串（edge-tts 要求带显式 +/- 号）。 */
export function toEdgeRate(wsRate: number): string {
  const pct = Math.round((wsRate - 1) * 100);
  return pct === 0 ? '+0%' : `${pct > 0 ? '+' : ''}${pct}%`;
}

export function hasWebSpeech(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
