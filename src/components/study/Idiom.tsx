'use client';

import { useState, useEffect, useRef } from 'react';
import { IDIOMS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function IdiomModule() {
  const { record } = useModuleProgress('chinese', 'idiom');
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const item = IDIOMS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate the idiom with blank
  const chars = item.idiom.split('');
  const displayIdiom = chars.map((c, i) => (i === item.position ? '_' : c)).join('');

  function playIdiom() {
    speakZh(item.idiom);
  }

  function reveal() {
    if (showAnswer) return;
    praise();
    setShowAnswer(true);
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % IDIOMS.length);
    setShowAnswer(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-rose to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">📚✨</div>
        <h2 className="text-2xl font-black">成语填空</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：成语里少了一个字，你能补上吗？</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-rose/30 text-center">
        <div className="text-5xl mb-4">{item.emoji}</div>
        <div className="flex items-center justify-center gap-2 mb-6">
          {chars.map((c, i) => (
            <div
              key={i}
              className={`rounded-xl font-black flex items-center justify-center transition ${
                i === item.position
                  ? showAnswer
                    ? 'w-16 h-16 bg-moko-green text-white text-3xl ring-4 ring-moko-green/30'
                    : 'w-16 h-16 bg-moko-yellow/20 border-2 border-dashed border-moko-yellow text-3xl text-moko-yellow'
                  : 'w-16 h-16 bg-moko-rose/5 text-moko-rose text-3xl'
              }`}
            >
              {i === item.position && !showAnswer ? '?' : c}
            </div>
          ))}
        </div>
        <button
          onClick={playIdiom}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-rose to-moko-pink text-white font-black hover:scale-105 transition mb-3"
        >
          🔊 听成语
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
          <div className="mt-4 rounded-xl p-4 bg-gradient-to-r from-moko-green/10 to-moko-mint/10 border-2 border-dashed border-moko-green/30 text-left">
            <div className="text-lg font-bold text-moko-green mb-2">「{item.idiom}」缺的是「{item.blank}」</div>
            <div className="text-sm text-gray-600 mb-2">{item.meaning}</div>
            <div className="text-xs text-gray-400">例：{item.example}</div>
          </div>
        )}
        <button
          onClick={next}
          className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black shadow hover:scale-105 transition"
        >
          下一个成语 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          已补全 <span className="font-bold text-moko-green">{streak}</span> / {IDIOMS.length} 个 · 进度 {idx + 1}/{IDIOMS.length}
        </div>
      </div>
    </div>
  );
}