'use client';

import { useState, useEffect, useRef } from 'react';
import { LETTER_PAIRS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function LetterDiscriminateModule() {
  const { record } = useModuleProgress('chinese', 'letter-discriminate');
  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const pair = LETTER_PAIRS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playLetters() {
    speakZh(`${pair.a} ${pair.b}`);
  }

  function reveal() {
    if (showHint) return;
    praise();
    setShowHint(true);
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % LETTER_PAIRS.length);
    setShowHint(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-violet to-moko-purple text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔍✨</div>
        <h2 className="text-2xl font-black">形近字母辨析</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可：这两个字母长得像不像？点一点，辨一辨！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-violet/30 text-center">
        <div className="text-5xl mb-4">{pair.emoji}</div>
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="rounded-2xl bg-moko-violet/5 border-2 border-moko-violet/20 w-32 h-32 flex items-center justify-center">
            <span className="text-7xl font-black text-moko-violet">{pair.a}</span>
          </div>
          <div className="text-3xl text-gray-300">vs</div>
          <div className="rounded-2xl bg-moko-pink/5 border-2 border-moko-pink/20 w-32 h-32 flex items-center justify-center">
            <span className="text-7xl font-black text-moko-pink">{pair.b}</span>
          </div>
        </div>

        <button
          onClick={playLetters}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black hover:scale-105 transition mb-4"
        >
          🔊 听读音
        </button>

        <button
          onClick={reveal}
          disabled={showHint}
          className={`px-6 py-3 rounded-full font-black transition ${
            showHint
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-moko-cyan to-moko-blue text-white hover:scale-105'
          }`}
        >
          {showHint ? '已显示' : '💡 显示辨别口诀'}
        </button>

        {showHint && (
          <div className="mt-4 space-y-2 text-left">
            <div className="rounded-xl p-3 bg-moko-violet/5 border border-moko-violet/20">
              <span className="font-bold text-moko-violet">「{pair.a}」</span>：{pair.aName}
            </div>
            <div className="rounded-xl p-3 bg-moko-pink/5 border border-moko-pink/20">
              <span className="font-bold text-moko-pink">「{pair.b}」</span>：{pair.bName}
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-r from-moko-yellow to-moko-orange text-white font-bold">
              💡 {pair.tip}
            </div>
          </div>
        )}

        <button
          onClick={next}
          className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black shadow hover:scale-105 transition"
        >
          下一组 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          已辨别 <span className="font-bold text-moko-green">{streak}</span> / {LETTER_PAIRS.length} 组 · 进度 {idx + 1}/{LETTER_PAIRS.length}
        </div>
      </div>
    </div>
  );
}