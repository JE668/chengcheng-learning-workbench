'use client';

import { useEffect, useState } from 'react';

const POOLS: Record<number, string[]> = {
  1: ['bā', 'mā', 'tā', 'dà', 'xiǎo', 'rén', 'kǒu', 'shǒu', 'mù', 'rì', 'yuè', 'shuǐ'],
  2: ['bā', 'mā', 'tā', 'dà', 'xiǎo', 'rén', 'kǒu', 'shǒu', 'mù', 'rì', 'yuè', 'shuǐ', 'pā', 'fā', 'lái', 'hǎo', 'shàng', 'xià', 'shān', 'huǒ'],
  3: ['bā', 'mā', 'tā', 'dà', 'xiǎo', 'rén', 'kǒu', 'shǒu', 'mù', 'rì', 'yuè', 'shuǐ', 'chuán', 'qiū', 'xuě', 'juān', 'zhōng', 'chē', 'shū', 'yǔ', 'fēng', 'yún', 'huā', 'niǎo', 'má', 'mǎ', 'mà', 'bá', 'bǎ', 'bà', 'dá', 'dǎ', 'tǎ', 'tà', 'lǐ', 'lí', 'nǐ', 'nì'],
};
const PAIRS: Record<number, number> = { 1: 6, 2: 8, 3: 10 };
const TIME: Record<number, number> = { 1: 90, 2: 75, 3: 60 };

export default function PinyinEliminate({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const pairCount = PAIRS[lv];
  const [cards, setCards] = useState<{ id: number; text: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [time, setTime] = useState(TIME[lv]);
  const [startedAt] = useState(Date.now());
  const [done, setDone] = useState(false);

  useEffect(() => {
    const pairs = [...(POOLS[lv] || POOLS[1])].sort(() => 0.5 - Math.random()).slice(0, pairCount);
    const deck = [...pairs, ...pairs]
      .map((text, i) => ({ id: i, text, flipped: false, matched: false }))
      .sort(() => 0.5 - Math.random());
    setCards(deck);
  }, [lv, pairCount]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched)) {
      setDone(true);
      const used = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const score = Math.max(20, 300 - used + 80);
      onFinish(score);
    }
  }, [cards, onFinish, startedAt]);

  useEffect(() => {
    if (time === 0 && !done) {
      setDone(true);
      const matched = cards.filter((c) => c.matched).length / 2;
      onFinish(matched * 25 + 10);
    }
  }, [time, done, cards, onFinish]);

  function clickCard(idx: number) {
    if (done || cards[idx].flipped || cards[idx].matched || flipped.length >= 2) return;
    const next = [...cards];
    next[idx].flipped = true;
    setCards(next);
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (cards[a].text === cards[b].text) {
        setTimeout(() => {
          const m = [...cards];
          m[a].matched = true;
          m[b].matched = true;
          m[a].flipped = false;
          m[b].flipped = false;
          setCards(m);
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          const m = [...cards];
          m[a].flipped = false;
          m[b].flipped = false;
          setCards(m);
          setFlipped([]);
        }, 800);
      }
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-moko-violet">⏱️ 剩余 {time} 秒</span>
        <span className="text-lg font-bold text-moko-rose">已消除 {cards.filter((c) => c.matched).length / 2}/{pairCount}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => clickCard(i)}
            disabled={c.matched || c.flipped}
            className={`aspect-square rounded-2xl text-2xl md:text-3xl font-extrabold flex items-center justify-center transition ${
              c.matched
                ? 'bg-moko-mint text-white opacity-60'
                : c.flipped
                ? 'bg-moko-pink text-white shadow-inner'
                : 'bg-gradient-to-br from-moko-purple to-moko-violet text-white shadow hover:scale-105'
            }`}
          >
            {c.matched ? '✅' : c.flipped ? c.text : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
}
