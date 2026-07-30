'use client';

import { useEffect, useState } from 'react';

const WORDS = [
  { en: 'apple', zh: '苹果' }, { en: 'cat', zh: '小猫' }, { en: 'dog', zh: '小狗' },
  { en: 'sun', zh: '太阳' }, { en: 'moon', zh: '月亮' }, { en: 'book', zh: '书本' },
  { en: 'water', zh: '水' }, { en: 'bird', zh: '小鸟' }, { en: 'fish', zh: '鱼' },
  { en: 'star', zh: '星星' }, { en: 'ball', zh: '球' }, { en: 'tree', zh: '树' },
  { en: 'car', zh: '汽车' }, { en: 'red', zh: '红色' }, { en: 'happy', zh: '开心' }, { en: 'milk', zh: '牛奶' },
];

const COUNT: Record<number, number> = { 1: 6, 2: 7, 3: 8 };
const TIME: Record<number, number> = { 1: 100, 2: 90, 3: 80 };

export default function WordMatch({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const pairCount = COUNT[lv];
  const [pairs] = useState(() => [...WORDS].sort(() => 0.5 - Math.random()).slice(0, pairCount));
  const [cards, setCards] = useState<{ id: number; text: string; kind: 'en' | 'zh'; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [time, setTime] = useState(TIME[lv]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const deck = pairs
      .flatMap((p, i) => [
        { id: i * 2, text: p.en, kind: 'en' as const, flipped: false, matched: false },
        { id: i * 2 + 1, text: p.zh, kind: 'zh' as const, flipped: false, matched: false },
      ])
      .sort(() => 0.5 - Math.random());
    setCards(deck);
  }, [pairs]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched)) {
      setDone(true);
      onFinish(Math.max(20, 350 - (100 - time) + 70));
    }
  }, [cards, time, onFinish]);

  useEffect(() => {
    if (time === 0 && !done) {
      setDone(true);
      onFinish((cards.filter((c) => c.matched).length / 2) * 20 + 10);
    }
  }, [time, done, cards, onFinish]);

  function click(i: number) {
    if (done || cards[i].flipped || cards[i].matched || flipped.length >= 2) return;
    const next = [...cards];
    next[i].flipped = true;
    setCards(next);
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      const [a, b] = nf;
      const match = pairs.some(
        (p) =>
          (cards[a].kind === 'en' && cards[a].text === p.en && cards[b].kind === 'zh' && cards[b].text === p.zh) ||
          (cards[b].kind === 'en' && cards[b].text === p.en && cards[a].kind === 'zh' && cards[a].text === p.zh)
      );
      setTimeout(() => {
        const m = [...cards];
        if (match) {
          m[a].matched = true;
          m[b].matched = true;
        }
        m[a].flipped = false;
        m[b].flipped = false;
        setCards(m);
        setFlipped([]);
      }, match ? 400 : 800);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">已解锁 {cards.filter((c) => c.matched).length / 2}/{pairCount}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => click(i)}
            disabled={c.matched || c.flipped}
            className={`aspect-square rounded-xl text-sm md:text-lg font-bold flex items-center justify-center transition ${
              c.matched
                ? 'bg-moko-mint text-white opacity-60'
                : c.flipped
                ? 'bg-moko-pink text-white'
                : 'bg-gradient-to-br from-moko-violet to-moko-purple text-white hover:scale-105'
            }`}
          >
            {c.matched ? '✅' : c.flipped ? c.text : '🔑'}
          </button>
        ))}
      </div>
    </div>
  );
}
