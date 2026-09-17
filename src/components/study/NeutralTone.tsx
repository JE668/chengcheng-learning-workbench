'use client';

import { useState, useEffect, useRef } from 'react';
import { NEUTRAL_TONE_WORDS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function NeutralToneModule() {
  const { record } = useModuleProgress('chinese', 'neutral-tone');
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const item = NEUTRAL_TONE_WORDS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playWord() {
    speakZh(item.word);
  }

  function reveal() {
    if (showAnswer) return;
    praise();
    setShowAnswer(true);
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % NEUTRAL_TONE_WORDS.length);
    setShowAnswer(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-yellow to-moko-orange text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎵✨</div>
        <h2 className="text-2xl font-black">轻声小课堂</h2>
        <p className="text-sm opacity-90 mt-1">甜甜萌可：有些字读起来轻轻的、短短的，就是轻声！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
        <div className="text-5xl mb-3">{item.emoji}</div>
        <div className="text-lg font-bold text-gray-500 mb-4">这个词哪个字读轻声？</div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="rounded-2xl bg-moko-yellow/10 border-2 border-moko-yellow/30 px-6 py-4">
            <div className="text-4xl font-black text-moko-yellow">{item.word[0]}</div>
            <div className="text-sm text-gray-400 mt-1">{item.normal[0]}</div>
          </div>
          <div className="rounded-2xl bg-moko-pink/10 border-2 border-dashed border-moko-pink/30 px-6 py-4">
            <div className="text-4xl font-black text-moko-pink">{item.word[1]}</div>
            <div className="text-sm text-gray-400 mt-1">
              {showAnswer ? item.light[1] : '? ? ?'}
            </div>
          </div>
        </div>
        <button
          onClick={playWord}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-yellow to-moko-orange text-white font-black hover:scale-105 transition mb-3"
        >
          🔊 听读音
        </button>
        <button
          onClick={reveal}
          disabled={showAnswer}
          className={`px-6 py-3 rounded-full font-black transition ${
            showAnswer
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-moko-violet to-moko-purple text-white hover:scale-105'
          }`}
        >
          {showAnswer ? '已显示' : '💡 显示答案'}
        </button>
        {showAnswer && (
          <div className="mt-4 rounded-xl p-4 bg-gradient-to-r from-moko-green/10 to-moko-mint/10 border-2 border-dashed border-moko-green/30">
            <div className="text-sm text-gray-600">{item.tip}</div>
          </div>
        )}
        <button
          onClick={next}
          className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black shadow hover:scale-105 transition"
        >
          下一个词 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          已学会 <span className="font-bold text-moko-green">{streak}</span> / {NEUTRAL_TONE_WORDS.length} 个 · 进度 {idx + 1}/{NEUTRAL_TONE_WORDS.length}
        </div>
      </div>
    </div>
  );
}