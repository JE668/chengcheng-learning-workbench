'use client';

import { useState, useEffect, useRef } from 'react';
import { ONOMATOPOEIA } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function OnomatopoeiaModule() {
  const { record } = useModuleProgress('chinese', 'onomatopoeia');
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const item = ONOMATOPOEIA[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playSound() {
    speakZh(item.sound);
    if (!showAnswer) {
      setStreak((s) => s + 1);
    }
  }

  function reveal() {
    if (showAnswer) return;
    praise();
    speakZh(`${item.subject}的声音是${item.sound}`);
    setShowAnswer(true);
  }

  function next() {
    setIdx((i) => (i + 1) % ONOMATOPOEIA.length);
    setShowAnswer(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-yellow to-moko-orange text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎵✨</div>
        <h2 className="text-2xl font-black">拟声词乐园</h2>
        <p className="text-sm opacity-90 mt-1">甜甜萌可：小动物们都有自己的声音！点一点，听一听！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
        <div className="text-6xl mb-3">{item.emoji}</div>
        <div className="text-lg font-bold text-gray-500 mb-4">猜猜这是什么动物的声音？</div>
        <button
          onClick={playSound}
          className="rounded-2xl px-10 py-6 bg-gradient-to-r from-moko-yellow to-moko-orange text-white text-3xl font-black shadow-lg hover:scale-105 transition active:scale-95 mb-4"
        >
          🔊 点我听一听
        </button>
        {showAnswer && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-moko-green to-moko-cyan text-white font-bold">
            <div className="text-2xl mb-1">📢 {item.sound}</div>
            <div className="text-sm">这是「{item.subject}」的声音</div>
          </div>
        )}
        <button
          onClick={reveal}
          disabled={showAnswer}
          className={`mt-3 px-6 py-2 rounded-full font-bold text-sm transition ${
            showAnswer
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-moko-violet text-white hover:scale-105'
          }`}
        >
          {showAnswer ? '已显示' : '💡 显示答案'}
        </button>
        <button
          onClick={next}
          className="ml-2 px-6 py-2 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-bold text-sm hover:scale-105 transition"
        >
          下一个 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          连对 <span className="font-bold text-moko-green">{streak}</span> 个 · 进度 {idx + 1}/{ONOMATOPOEIA.length}
        </div>
      </div>
    </div>
  );
}