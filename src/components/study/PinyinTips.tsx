'use client';

import { useState, useEffect, useRef } from 'react';
import { PINYIN_TIPS, PINYIN_GROUPS, PINYIN_HAN } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function PinyinTipsModule() {
  const { record } = useModuleProgress('chinese', 'pinyin-tips');
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const tip = PINYIN_TIPS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 9) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playExample() {
    // Find an example character from PINYIN_HAN that matches the tip
    const group = PINYIN_GROUPS.find((g) => {
      const tipLetters = tip.tip.toLowerCase();
      return tipLetters.includes(g.group.toLowerCase());
    });
    if (group) {
      const han = PINYIN_HAN[group.group];
      if (han) {
        speakZh(han);
      }
    }
  }

  function markDone() {
    if (streak > 0 && streak <= idx + 1) return; // already marked
    praise();
    setStreak((s) => s + 1);
  }

  function next() {
    setIdx((i) => (i + 1) % PINYIN_TIPS.length);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-pink to-moko-rose text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔤✨</div>
        <h2 className="text-2xl font-black">拼音口诀歌</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：拼音有口诀，记起来更快哦！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-pink/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-5xl">{tip.emoji}</div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-moko-rose">{tip.title}</h3>
            <p className="text-sm text-gray-400">第 {idx + 1} / {PINYIN_TIPS.length} 个口诀</p>
          </div>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-r from-moko-pink/5 to-moko-rose/5 border-2 border-dashed border-moko-pink/30 mb-4">
          <p className="text-base font-bold text-gray-700 leading-relaxed text-center">{tip.tip}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={playExample}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black hover:scale-105 transition"
          >
            🔊 听例子
          </button>
          <button
            onClick={markDone}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-green to-moko-cyan text-white font-black hover:scale-105 transition"
          >
            ✅ 记住了
          </button>
        </div>
        <button
          onClick={next}
          className="mt-3 w-full px-4 py-2 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-bold text-sm hover:scale-105 transition"
        >
          下一个口诀 →
        </button>
        <div className="mt-3 text-xs text-gray-400 text-center">
          已记住 <span className="font-bold text-moko-green">{streak}</span> / {PINYIN_TIPS.length} 个
        </div>
      </div>
    </div>
  );
}