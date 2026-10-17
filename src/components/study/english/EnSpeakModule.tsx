'use client';

import { useState } from 'react';
import { ALL_EN_WORDS } from '@/lib/study-data-en';
import { speakEn } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useRecorder, recognizeSpeech } from '../useRecorder';
import { lev } from './shared';

/* ---------- 口语跟读（逐词挑战） ---------- */
export function EnSpeakModule() {
  const practice = ALL_EN_WORDS.filter((w) => w.sentence);
  const [idx, setIdx] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState('');
  const { recording, micError, start: startRecord } = useRecorder({ maxMs: 3000 });
  const item = practice[idx % practice.length];
  const logM = useMistakeLogger();

  async function scorePronunciation() {
    setScoring(true);
    setScore(null);
    setHeard('');
    const raw = await recognizeSpeech({ lang: 'en-US' });
    setScoring(false);
    if (raw === null) return; // 不支持/没听清：安静失败，孩子可再点一次
    const text = raw.toLowerCase().trim();
    setHeard(text);
    const target = item.word.toLowerCase().trim();
    let s = 0;
    if (text && (text.includes(target) || target.includes(text))) s = 3;
    else {
      const dist = lev(text, target);
      const ratio = 1 - dist / Math.max(text.length, target.length, 1);
      s = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    }
    setScore(s);
    if (s < 2)
      logM({ subject: '英语', kind: '口语', prompt: item.word, answer: item.word, wrong: text });
  }

  const stars = score === null ? '' : '⭐'.repeat(score) + '☆'.repeat(3 - score);

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-moko-violet to-purple-400 text-white shadow-lg text-center">
      <div className="text-6xl mb-2">{item.emoji}</div>
      <button
        onClick={() => speakEn(item.word)}
        className="text-4xl font-black underline decoration-white/40"
      >
        {item.word}
      </button>
      <p className="text-sm opacity-90 mt-1">{item.cn}</p>
      <p className="text-xs opacity-80 italic mt-1">{item.sentence}</p>
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => speakEn(item.word)}
          className="px-5 py-2 rounded-full bg-white text-moko-violet font-bold text-sm active:scale-95 transition"
        >
          🔊 听
        </button>
        <button
          onClick={startRecord}
          disabled={recording}
          className={`px-5 py-2 rounded-full font-bold text-sm active:scale-95 transition ${recording ? 'bg-red-400' : 'bg-moko-pink'}`}
        >
          {recording ? '⏹ 录音中' : '🎙️ 跟读'}
        </button>
        <button
          onClick={scorePronunciation}
          disabled={scoring}
          className="px-5 py-2 rounded-full bg-moko-yellow font-bold text-sm active:scale-95 transition disabled:opacity-60"
        >
          {scoring ? '🎯 听…' : '🎯 评发音'}
        </button>
      </div>
      {micError && <p className="text-xs text-red-200 mt-2">{micError}</p>}
      {score !== null && (
        <div className="mt-4">
          <div className="text-3xl">{stars}</div>
          <p className="text-xs mt-1 opacity-90">
            {score >= 3 ? '太棒了！' : score === 2 ? '不错，再练一次～' : '加油，多跟读几遍！'}
            {heard && <span className="block">我听到：{heard}</span>}
          </p>
        </div>
      )}
      <button
        onClick={() => {
          setScore(null);
          setHeard('');
          setIdx((i) => i + 1);
        }}
        className="mt-4 px-6 py-2 rounded-full bg-white/25 font-bold text-sm active:scale-95 transition"
      >
        下一个 ›
      </button>
    </div>
  );
}

/* ---------- 单元浏览（人教版一年级起点） ---------- */
