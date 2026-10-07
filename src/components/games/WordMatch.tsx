'use client';

import { useEffect, useState } from 'react';

const WORDS = [
  { en: 'apple', zh: '苹果' },
  { en: 'cat', zh: '小猫' },
  { en: 'dog', zh: '小狗' },
  { en: 'sun', zh: '太阳' },
  { en: 'moon', zh: '月亮' },
  { en: 'book', zh: '书本' },
  { en: 'water', zh: '水' },
  { en: 'bird', zh: '小鸟' },
  { en: 'fish', zh: '鱼' },
  { en: 'star', zh: '星星' },
  { en: 'ball', zh: '球' },
  { en: 'tree', zh: '树' },
  { en: 'car', zh: '汽车' },
  { en: 'red', zh: '红色' },
  { en: 'happy', zh: '开心' },
  { en: 'milk', zh: '牛奶' },
];

const COUNT: Record<number, number> = { 1: 6, 2: 7, 3: 8 };
const TIME: Record<number, number> = { 1: 100, 2: 90, 3: 80 };

export default function WordMatch({
  onFinish,
  level = 1,
}: {
  onFinish: (score: number) => void;
  level?: number;
}) {
  const lv = Math.min(3, Math.max(1, level));
  const pairCount = COUNT[lv];
  // ⚠️ 初始值必须**确定性**：这是会被 SSR 的客户端组件，若在首帧就用 Math.random()
  // 选词，服务端 HTML 与客户端首帧会不一致 → React 报 hydration 错误并整棵子树重渲染。
  // 因此先用固定切片，挂载后再打乱（下面的 effect 会据此重建牌面）。
  const [pairs, setPairs] = useState(() => WORDS.slice(0, pairCount));
  useEffect(() => {
    setPairs([...WORDS].sort(() => 0.5 - Math.random()).slice(0, pairCount));
  }, [pairCount]);
  const [cards, setCards] = useState<
    { id: number; text: string; kind: 'en' | 'zh'; flipped: boolean; matched: boolean }[]
  >([]);
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
    // ⚠️ 必须生成**新对象**，不能靠数组浅拷贝后就地改字段。
    // 原写法 `const next = [...cards]; next[i].flipped = true` 里
    // `next[i] === cards[i]` 是同一个引用 —— React 只能靠数组新引用察觉更新，
    // 若后续有别的路径依赖对象同一性（例如 memo 比较），行为就不可预期。
    setCards((prev) => prev.map((c, k) => (k === i ? { ...c, flipped: true } : c)));
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      const [a, b] = nf;
      const match = pairs.some(
        (p) =>
          (cards[a].kind === 'en' &&
            cards[a].text === p.en &&
            cards[b].kind === 'zh' &&
            cards[b].text === p.zh) ||
          (cards[b].kind === 'en' &&
            cards[b].text === p.en &&
            cards[a].kind === 'zh' &&
            cards[a].text === p.zh)
      );
      // 用函数式更新而不是闭包里的 `cards`：等 400/800ms 回来时，
      // `cards` 捕获的是**点击那一刻**的旧数组，期间牌面若已变化，
      // 基于旧数组构造的 m 会把过期状态写回（这里同时改为不可变更新）。
      setTimeout(
        () => {
          setCards((prev) =>
            prev.map((c, k) => {
              if (k !== a && k !== b) return c;
              return { ...c, flipped: false, matched: match ? true : c.matched };
            })
          );
          setFlipped([]);
        },
        match ? 400 : 800
      );
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">
          已解锁 {cards.filter((c) => c.matched).length / 2}/{pairCount}
        </span>
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
