'use client';

import { useState, useEffect, useRef } from 'react';
import { POLYPHONIC_CHARS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function PolyphonicModule() {
  const { record } = useModuleProgress('chinese', 'polyphonic');
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const item = POLYPHONIC_CHARS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 2) record(1);
    if (streak >= 4) record(2);
    if (streak >= 6) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function reveal() {
    if (showAnswer) return;
    praise();
    speakZh(item.tip);
    setShowAnswer(true);
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % POLYPHONIC_CHARS.length);
    setShowAnswer(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-violet to-moko-purple text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔀✨</div>
        <h2 className="text-2xl font-black">多音字认认认</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可：一个字怎么有好几种读音？点一点，听一听！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-violet/30 text-center">
        <div className="text-6xl mb-3">{item.emoji}</div>
        <div className="text-lg font-bold text-gray-500 mb-4">这个字有几种读音？</div>
        <div className="text-7xl font-black text-moko-violet mb-4 bg-moko-violet/5 rounded-2xl py-6">
          {item.char}
        </div>
        {showAnswer && (
          <div className="space-y-3 mb-4 text-left">
            {item.readings.map((r, i) => (
              <div key={i} className="rounded-xl p-4 bg-gradient-to-r from-moko-pink/10 to-moko-rose/10 border border-moko-pink/20">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-black text-moko-rose">{r.pinyin}</span>
                  <span className="font-bold text-gray-700">「{r.meaning}」</span>
                </div>
                <div className="text-sm text-gray-500">例：{r.example}</div>
              </div>
            ))}
            <div className="rounded-xl p-3 bg-gradient-to-r from-moko-yellow to-moko-orange text-white font-bold text-sm">
              💡 {item.tip}
            </div>
          </div>
        )}
        <button
          onClick={reveal}
          disabled={showAnswer}
          className={`mt-2 px-6 py-3 rounded-full font-black transition ${
            showAnswer
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-moko-violet to-moko-purple text-white hover:scale-105'
          }`}
        >
          {showAnswer ? '已显示' : '💡 显示答案'}
        </button>
        <button
          onClick={next}
          className="ml-2 px-6 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black text-sm hover:scale-105 transition"
        >
          下一个 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          连对 <span className="font-bold text-moko-green">{streak}</span> 个 · 进度 {idx + 1}/{POLYPHONIC_CHARS.length}
        </div>
      </div>
    </div>
  );
}