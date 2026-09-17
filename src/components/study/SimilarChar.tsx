'use client';

import { useState, useEffect, useRef } from 'react';
import { SIMILAR_CHARS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function SimilarCharModule() {
  const { record } = useModuleProgress('chinese', 'similar-char');
  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const [streak, setStreak] = useState(0);
  const g = SIMILAR_CHARS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    setIdx((i) => (i + 1) % SIMILAR_CHARS.length);
    setPicked(null);
    setShowHint(false);
  }

  function pick(side: 'a' | 'b') {
    if (picked) return;
    setPicked(side);
    if (side === 'a') {
      speakZh(g.a);
      praise();
      setStreak((s) => s + 1);
    } else {
      speakZh(g.b);
      setStreak((s) => s + 1);
    }
    setTimeout(() => {
      setShowHint(true);
    }, 800);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-cyan to-moko-blue text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔍✨</div>
        <h2 className="text-2xl font-black">形近字辨认</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可：这两个字长得像不像？点一点，听一听，辨一辨！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-cyan/30 text-center">
        <div className="text-5xl mb-2">{g.emoji}</div>
        <div className="text-lg font-bold text-gray-500 mb-4">看看这一组：哪个是哪个？</div>
        <div className="flex items-center justify-center gap-8 mb-6">
          <button
            onClick={() => pick('a')}
            className={`rounded-2xl w-28 h-28 flex items-center justify-center text-5xl font-black transition active:scale-95 ${
              picked === 'a' ? 'bg-moko-green text-white ring-4 ring-moko-green/30' : 'bg-moko-cyan/10 text-moko-blue hover:bg-moko-cyan/20'
            }`}
          >
            {g.a}
          </button>
          <button
            onClick={() => pick('b')}
            className={`rounded-2xl w-28 h-28 flex items-center justify-center text-5xl font-black transition active:scale-95 ${
              picked === 'b' ? 'bg-moko-rose text-white ring-4 ring-moko-rose/30' : 'bg-moko-pink/10 text-moko-rose hover:bg-moko-pink/20'
            }`}
          >
            {g.b}
          </button>
        </div>
        {picked && (
          <div className="space-y-2 mb-4 text-left">
            <div className="rounded-xl p-3 bg-moko-cyan/5 border border-moko-cyan/20">
              <span className="font-bold text-moko-blue">「{g.a}」</span>：{g.aMean}
            </div>
            <div className="rounded-xl p-3 bg-moko-pink/5 border border-moko-pink/20">
              <span className="font-bold text-moko-rose">「{g.b}」</span>：{g.bMean}
            </div>
          </div>
        )}
        {showHint && (
          <div className="rounded-xl p-3 bg-gradient-to-r from-moko-yellow to-moko-orange text-white text-sm font-bold">
            💡 {g.tip}
          </div>
        )}
        <button
          onClick={next}
          className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black shadow hover:scale-105 transition"
        >
          下一组 →
        </button>
        <div className="mt-3 text-xs text-gray-400">
          连对 <span className="font-bold text-moko-green">{streak}</span> 组 · 进度 {idx + 1}/{SIMILAR_CHARS.length}
        </div>
      </div>
    </div>
  );
}