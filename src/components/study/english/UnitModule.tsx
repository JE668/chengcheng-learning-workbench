'use client';

import { useState } from 'react';
import { EN_WORD_TOPICS, type WordItem } from '@/lib/study-data-en';
import { EN_UNITS } from '@/lib/study-data/english';
import { speakEn } from '@/lib/speak';

function UnitWordCard({ item }: { item: WordItem }) {
  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
      <div className="text-4xl mb-1">{item.emoji}</div>
      <div
        onClick={() => speakEn(item.word)}
        className="text-2xl font-black text-moko-violet cursor-pointer hover:scale-105 transition"
      >
        {item.word}
      </div>
      <div className="text-sm text-gray-500 mb-2">{item.cn}</div>
      {item.sentence && <div className="text-xs text-gray-400 mb-2 italic">{item.sentence}</div>}
      <button
        onClick={() => speakEn(item.word)}
        className="px-4 py-1 rounded-full bg-moko-yellow text-white font-bold text-xs active:scale-95 transition"
      >
        🔊 点读
      </button>
    </div>
  );
}

export function UnitModule() {
  const [open, setOpen] = useState<string | null>(EN_UNITS[0]?.unit ?? null);
  return (
    <div className="space-y-4">
      {EN_UNITS.map((u) => {
        const words: WordItem[] = u.topics.flatMap((t) => EN_WORD_TOPICS[t] ?? []);
        const isOpen = open === u.unit;
        return (
          <div
            key={u.unit}
            className="rounded-2xl bg-white shadow-lg border-2 border-moko-yellow/20 overflow-hidden"
          >
            <button
              onClick={() => setOpen(isOpen ? null : u.unit)}
              className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition"
            >
              <span className="text-3xl">{u.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm text-gray-400">
                  {u.unit}
                  {u.extra ? (
                    <span className="ml-1 text-[10px] text-moko-yellow font-bold">拓展</span>
                  ) : null}
                  <span className="ml-1 text-[10px] text-gray-300">{words.length} 词</span>
                </span>
                <span className="block text-lg font-black text-moko-violet">{u.title}</span>
              </span>
              <span className="text-moko-yellow text-2xl">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {words.map((w) => (
                    <UnitWordCard key={w.word + u.unit} item={w} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
