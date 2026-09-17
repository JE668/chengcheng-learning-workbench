'use client';

import { useState, useEffect, useRef } from 'react';
import { PICTOGRAPHS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function PictographModule() {
  const { record } = useModuleProgress('chinese', 'pictograph');
  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const item = PICTOGRAPHS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playChar() {
    speakZh(item.char);
  }

  function reveal() {
    if (showHint) return;
    praise();
    speakZh(item.meaning);
    setShowHint(true);
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % PICTOGRAPHS.length);
    setShowHint(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-green to-moko-mint text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎨✨</div>
        <h2 className="text-2xl font-black">象形字博物馆</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可：古人是怎样造字的？点一点，看古字变今字！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-green/30 text-center">
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-7xl font-black text-moko-green bg-moko-green/5 rounded-2xl w-32 h-32 flex items-center justify-center">
            {item.char}
          </div>
          <div className="text-4xl text-gray-300">←</div>
          <div className="text-7xl">{item.emoji}</div>
        </div>
        <div className="text-sm text-gray-400 mb-2">这个字是什么意思？</div>
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={playChar}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-green to-moko-mint text-white font-black hover:scale-105 transition"
          >
            🔊 听读音
          </button>
          <button
            onClick={reveal}
            disabled={showHint}
            className={`px-6 py-3 rounded-full font-black transition ${
              showHint
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-moko-violet to-moko-purple text-white hover:scale-105'
            }`}
          >
            {showHint ? '已显示' : '💡 显示答案'}
          </button>
        </div>
        {showHint && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-moko-green/10 to-moko-mint/10 border-2 border-dashed border-moko-green/30">
            <div className="text-lg font-bold text-moko-green mb-2">「{item.meaning}」{item.py}</div>
            <div className="text-sm text-gray-600">{item.hint}</div>
          </div>
        )}
        <button
          onClick={next}
          className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-moko-green to-moko-mint text-white font-black shadow hover:scale-105 transition"
        >
          下一个象形字 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          已探索 <span className="font-bold text-moko-green">{streak}</span> / {PICTOGRAPHS.length} 个字 · 进度 {idx + 1}/{PICTOGRAPHS.length}
        </div>
      </div>
    </div>
  );
}