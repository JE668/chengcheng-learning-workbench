'use client';

/**
 * 共享语音朗读入口。
 *
 * 内部按职责拆分在 lib/tts/runtime/：
 *   - browser-platform：UA/语速/服务端 rate 等平台细节
 *   - voice-policy：Web Speech 嗓音发现与严格/宽松选择
 *   - audio-cache：内存缓存 + localStorage 持久化 + 预取
 *   - audio-player：静态 MP3 播放与 edge-tts 服务端播放
 *   - web-speech-player：长文本切句、keep-alive 与 Web Speech 播放
 *   - playback：本地音频 → 严格 Web Speech → 宽松 → 服务端的恢复链
 *
 * 本文件只保留稳定的公开 API，避免 50+ 调用方随内部模块调整而改动。
 */

import { playTts } from './tts/runtime/playback';

export { calibrateRate, toEdgeRate } from './tts/runtime/browser-platform';
export { prefetchTts, prefetchTtsBatch } from './tts/runtime/audio-cache';
export { prefetchStaticAudio } from './tts/runtime/audio-player';
export { playTts, playTtsEnd, playTtsWithResult } from './tts/runtime/playback';
export { warmupVoices } from './tts/runtime/voice-policy';

/**
 * 拼音以「同音汉字」形式（如 bà→爸）交给 zh-CN 嗓音读，音节和声调都正确。
 * 整体语速偏慢，适配一年级小朋友跟读。
 */
export function speakZh(text: string, rate = 0.55) {
  void playTts(text, 'zh', { wsRate: rate, pitch: 1.1 });
}

export function speakEn(text: string, rate = 0.55) {
  void playTts(text, 'en', { wsRate: rate, pitch: 1.05 });
}

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
  // 表扬语全部在预生成静态集：直查本地 MP3，弱网/断网也能给出正反馈。
  void playTts(text, 'zh', { wsRate: rate, preferStatic: true });
}
