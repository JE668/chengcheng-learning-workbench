'use client';

import { useEffect, useState } from 'react';

function makeRound(level: number) {
  if (level <= 3) {
    // 第四轮 D+E 审查：上限从 20 降到 12 —— 此前高分支渲染 ⭐/🌙 交替图形，
    // 按「数星星」的题意数永远不等于答案（星星只有一半）。
    // 现在统一只渲染一种符号（见下方渲染处），≤12 个孩子可数得过来。
    const count = Math.floor(Math.random() * 12) + 1;
    return { type: 'count' as const, count, prompt: `数一数有多少颗星星？` };
  } else if (level <= 6) {
    const start = Math.floor(Math.random() * 10) + 1;
    const step = [2, 5][Math.floor(Math.random() * 2)];
    const count = 5;
    const seq = Array.from({ length: count }, (_, i) => start + i * step);
    return {
      type: 'skip' as const,
      count: seq[seq.length - 1],
      prompt: `从 ${start} 开始，每次加 ${step}，最后一个数是几？`,
      seq,
    };
  } else {
    // 高分支改为等差数列求和型（原「数 21~50 个月亮」最多渲染 40 个图形，
    // 41~50 的部分只显示「+N」文本，孩子无法数出来 —— 不可解题）。
    // 改为「从 a 开始每次加 b」的续数题：数列 ≤5 项全部可见，可推算。
    const start = Math.floor(Math.random() * 9) + 2;
    const step = [3, 4, 5][Math.floor(Math.random() * 3)];
    const seq = Array.from({ length: 4 }, (_, i) => start + i * step);
    return {
      type: 'skip' as const,
      count: seq[seq.length - 1],
      prompt: `从 ${start} 开始，每次加 ${step}，最后一个数是几？`,
      seq,
    };
  }
}

const TIME: Record<number, number> = { 1: 100, 2: 90, 3: 80 };

export default function CountChallenge({
  onFinish,
  level = 1,
}: {
  onFinish: (score: number) => void;
  level?: number;
}) {
  const lv = Math.min(3, Math.max(1, level));
  const seed = lv * 3;
  const [levelState, setLevelState] = useState(seed);
  const [round, setRound] = useState(makeRound(seed));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(TIME[lv]);
  const [done, setDone] = useState(false);
  const total = 10;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) {
      setDone(true);
      onFinish(score);
    }
  }, [time, done, score, onFinish]);

  function submit() {
    if (done) return;
    const n = Number(input);
    const ok = n === round.count;
    const ns = ok ? score + 12 : score;
    setScore(ns);
    if (idx + 1 >= total) {
      setDone(true);
      onFinish(ns);
    } else {
      const nl = Math.min(9, levelState + 1);
      setLevelState(nl);
      setRound(makeRound(nl));
      setInput('');
      setIdx(idx + 1);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">
          {idx + 1}/{total} 积分 {score}
        </span>
      </div>
      <p className="text-xl font-bold text-moko-violet mb-4">{round.prompt}</p>
      {round.type === 'count' && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 text-3xl">
          {/* 只渲染星星一种符号：题意「数星星」= 图形总数，可数（上限已降到 12）。
              原先是 ⭐/🌙 按索引交替，星星只有一半，按题意数永远不等于答案。 */}
          {Array.from({ length: round.count }, (_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
      )}
      {round.type === 'skip' && (
        <div className="text-3xl font-black text-moko-yellow mb-6 flex justify-center gap-3">
          {round.seq.slice(0, -1).map((n, i) => (
            <span key={i}>{n}</span>
          ))}
          <span className="text-moko-rose">?</span>
        </div>
      )}
      <div className="flex justify-center gap-3">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-32 text-center text-3xl font-black rounded-2xl border-4 border-moko-pink py-2"
          placeholder="?"
        />
        <button
          onClick={submit}
          className="px-8 py-3 bg-gradient-to-r from-moko-purple to-moko-violet text-white text-xl font-extrabold rounded-full shadow hover:scale-105 transition"
        >
          提交
        </button>
      </div>
    </div>
  );
}
