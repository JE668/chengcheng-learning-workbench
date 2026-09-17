'use client';

import { useState, useEffect, useRef } from 'react';
import { RAZ_VOCAB, RAZ_ALL_WORDS } from '@/lib/raz-vocab';
import { speakEn } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function RazVocabModule() {
  const { record } = useModuleProgress('english', 'raz-vocab');
  const [category, setCategory] = useState<string>('动物');
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const prevStreak = useRef(0);
  const prevLearned = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('raz-vocab-learned');
    if (saved) setLearned(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]);

  useEffect(() => {
    if (learned.size === prevLearned.current) return;
    prevLearned.current = learned.size;
    localStorage.setItem('raz-vocab-learned', JSON.stringify([...learned]));
  }, [learned]);

  const words = RAZ_VOCAB[category] || RAZ_ALL_WORDS;
  const word = words[idx % words.length];

  function playWord() {
    speakEn(word.word);
  }

  function reveal() {
    if (showAnswer) return;
    setShowAnswer(true);
    if (!learned.has(word.word)) {
      setLearned((s) => new Set(s).add(word.word));
      setStreak((s) => s + 1);
    }
  }

  function next() {
    setIdx((i) => (i + 1) % words.length);
    setShowAnswer(false);
  }

  function pickCategory(cat: string) {
    setCategory(cat);
    setIdx(0);
    setShowAnswer(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-purple to-moko-violet text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔤✨</div>
        <h2 className="text-2xl font-black">RAZ 词汇练习</h2>
        <p className="text-sm opacity-90 mt-1">甜甜萌可：RAZ AA 级核心词汇，听一听，认一认！</p>
      </div>

      {/* Progress */}
      <div className="rounded-2xl p-3 bg-white shadow-lg border-2 border-moko-purple/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">已学 <span className="font-bold text-moko-green">{learned.size}</span> / {RAZ_ALL_WORDS.length} 词</span>
          <span className="text-xs text-gray-400">连对 <span className="font-bold text-moko-green">{streak}</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-moko-purple to-moko-violet" style={{ width: `${(learned.size / RAZ_ALL_WORDS.length) * 100}%` }}></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.keys(RAZ_VOCAB).map((cat) => (
          <button
            key={cat}
            onClick={() => pickCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              category === cat
                ? 'bg-moko-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat} ({RAZ_VOCAB[cat].length})
          </button>
        ))}
      </div>

      {/* Word Card */}
      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
        <div className="text-7xl mb-4">{word.emoji}</div>
        <div className="text-4xl font-black text-gray-800 mb-2">{word.word}</div>
        {showAnswer && (
          <div className="text-lg text-gray-500 mb-3">{word.cn}</div>
        )}
        {showAnswer && (
          <div className="rounded-xl p-3 bg-moko-purple/5 border border-moko-purple/20 mb-4">
            <div className="text-sm text-gray-600">📖 {word.sentence}</div>
            <div className="text-xs text-gray-400 mt-1">来自《{word.book.replace('AA-', '').replace(/_/g, ' ')}》</div>
          </div>
        )}

        <button
          onClick={playWord}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-purple to-moko-violet text-white font-black hover:scale-105 transition mb-3"
        >
          🔊 听读音
        </button>
        <button
          onClick={reveal}
          disabled={showAnswer}
          className={`px-6 py-3 rounded-full font-black transition ${
            showAnswer
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-moko-cyan to-moko-blue text-white hover:scale-105'
          }`}
        >
          {showAnswer ? '已显示' : '💡 显示答案'}
        </button>
        <button
          onClick={next}
          className="ml-2 px-6 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black hover:scale-105 transition"
        >
          下一个 →
        </button>

        <div className="mt-3 text-xs text-gray-400">
          进度 {idx % words.length + 1} / {words.length} · 类别: {category}
        </div>
      </div>
    </div>
  );
}