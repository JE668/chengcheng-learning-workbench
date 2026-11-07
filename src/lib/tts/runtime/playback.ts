/** TTS 恢复编排：本地音频 → 严格 Web Speech → 宽松 Web Speech → 服务端。 */

import {
  nowMs,
  type PlaybackOptions,
  type PlaybackResult,
  type SpeechLanguage,
} from './browser-platform';
import { playLocalAudio, playServerAudio } from './audio-player';
import { ttsDebug } from './browser-platform';
import { hasStrictVoice } from './voice-policy';
import { debugWebSpeechLayer, speakLoose, speakStrict } from './web-speech-player';

export async function playTtsWithResult(
  text: string,
  lang: SpeechLanguage,
  opts: PlaybackOptions = {}
): Promise<PlaybackResult> {
  const startedAt = nowMs();
  const elapsed = () => Math.round(nowMs() - startedAt);
  const wsRate = opts.wsRate ?? 0.8;
  const pitch = opts.pitch ?? 1.05;
  const pauseMs = opts.pauseMs ?? 0;

  // 第 0 层：预生成本地音频。命中 = 零合成延迟 + 弱网/断网可用。
  const localHit = await playLocalAudio(text, lang, wsRate, pauseMs, opts.preferStatic === true);
  if (localHit) {
    return { success: true, engineUsed: 'local-audio', latencyMs: elapsed() };
  }

  // 第 1 层：本地 Web Speech 严格匹配（普通话/美式英语）。
  if (hasStrictVoice(lang)) {
    debugWebSpeechLayer('strict', lang, text);
    const played = await speakStrict(
      text,
      lang === 'zh' ? 'zh-CN' : 'en-US',
      wsRate,
      pitch,
      pauseMs
    );
    if (played) {
      return { success: true, engineUsed: 'web-speech-strict', latencyMs: elapsed() };
    }
  }

  // 第 2 层：宽松 Web Speech（粤语/台式/英式也可以，总比无声好）。
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    debugWebSpeechLayer('loose', lang, text);
    const played = await speakLoose(text, lang, wsRate, pitch, pauseMs);
    if (played) {
      return { success: true, engineUsed: 'web-speech-loose', latencyMs: elapsed() };
    }
  }

  // 第 3 层：服务端 edge-tts（神经嗓音，最后兜底）。
  ttsDebug('[TTS-L3] server edge-tts', lang, text.slice(0, 30));
  const serverOk = await playServerAudio(text, lang, { ...opts, wsRate, pitch });
  return {
    success: serverOk,
    engineUsed: 'edge-tts',
    latencyMs: elapsed(),
  };
}

export async function playTts(
  text: string,
  lang: SpeechLanguage,
  opts: PlaybackOptions = {}
): Promise<void> {
  await playTtsWithResult(text, lang, opts);
}

export function playTtsEnd(
  text: string,
  lang: SpeechLanguage,
  opts: PlaybackOptions = {}
): Promise<void> {
  return playTts(text, lang, opts);
}
