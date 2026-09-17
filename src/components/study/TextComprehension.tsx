'use client';

import { useState, useEffect, useRef } from 'react';
import { TEXT_COMPREHENSION_QS, TEXTBOOK_TEXTS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function TextComprehensionModule() {
  const { record } = useModuleProgress('chinese', 'text-comprehension');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const q = TEXT_COMPREHENSION_QS[idx];
  const text = TEXTBOOK_TEXTS.find((t) => t.title === q.textRef);
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function readPoem() {
    if (text) {
      speakZh(text.lines.join(''));
    }
  }

  function select(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) {
      praise();
      setStreak((s) => s + 1);
    }
    setShowExplain(true);
  }

  function next() {
    setIdx((i) => (i + 1) % TEXT_COMPREHENSION_QS.length);
    setSelected(null);
    setShowExplain(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-purple to-moko-violet text-white shadow-lg text-center">
        <div className="text-4xl mb-1">📖✨</div>
        <h2 className="text-2xl font-black">课文理解</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：读读这首诗，回答小问题！</p>
      </div>

      {text && (
        <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-purple/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{text.emoji}</span>
            <h3 className="text-lg font-black text-moko-purple">《{text.title}》</h3>
            <span className="text-sm text-gray-400">— {text.author}</span>
          </div>
          <div className="text-center text-lg font-bold text-gray-700 space-y-1 mb-3">
            {text.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <button
            onClick={readPoem}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-moko-purple to-moko-violet text-white font-bold text-sm hover:scale-105 transition"
          >
            🔊 朗读全诗
          </button>
        </div>
      )}

      <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-cyan/30">
        <div className="text-3xl mb-2">{q.emoji}</div>
        <div className="text-base font-bold text-gray-700 mb-4">{q.question}</div>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                  selected === null
                    ? 'bg-moko-cyan/5 hover:bg-moko-cyan/15 border border-moko-cyan/20'
                    : isCorrect
                      ? 'bg-moko-green text-white border border-moko-green'
                      : isSelected
                        ? 'bg-moko-rose text-white border border-moko-rose'
                        : 'bg-gray-50 border border-gray-100 opacity-50'
                }`}
              >
                <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
        {showExplain && (
          <div className="mt-3 rounded-xl p-3 bg-gradient-to-r from-moko-yellow/10 to-moko-orange/10 border border-moko-yellow/30 text-sm">
            <span className="font-bold">💡 </span>
            <span className="text-gray-600">{q.explain}</span>
          </div>
        )}
        <button
          onClick={next}
          className="mt-4 w-full px-6 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black hover:scale-105 transition"
        >
          下一题 →
        </button>
        <div className="mt-2 text-xs text-gray-400 text-center">
          连对 <span className="font-bold text-moko-green">{streak}</span> 题 · 进度 {idx + 1}/{TEXT_COMPREHENSION_QS.length}
        </div>
      </div>
    </div>
  );
}