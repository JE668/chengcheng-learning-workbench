'use client';

import { LETTERS, type LetterItem } from '@/lib/study-data-en';
import { speakEn } from '@/lib/speak';

function LetterCard({ item }: { item: LetterItem }) {
  return (
    <button
      onClick={() => speakEn(`${item.letter}. ${item.word}`)}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-yellow to-amber-300 text-white shadow-lg text-center active:scale-95 transition"
    >
      <div className="text-4xl font-black">{item.letter}</div>
      <div className="text-2xl mb-1">{item.emoji}</div>
      <div className="text-sm font-bold">{item.word}</div>
    </button>
  );
}

export function LetterModule() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {LETTERS.map((l) => (
        <LetterCard key={l.letter} item={l} />
      ))}
    </div>
  );
}

/* ---------- 单词（按主题，可点读 + 跟读录音；可选「我认识」完成标记） ---------- */
