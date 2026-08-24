'use client';

import { useEffect, useState } from 'react';

type Q = {
  kind: 'compose' | 'break' | 'carry' | 'borrow' | 'mixed';
  text: string;
  frames: number[]; // 每个十格阵已填点数（每阵 10 格）
  answer: number;
  choices: number[];
};

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

// L1：凑十法：a + ? = 10（或 ? + a = 10）
function makeComposeProblem(): Q {
  const n = Math.floor(Math.random() * 9) + 1; // 1..9
  const answer = 10 - n;
  const flip = Math.random() < 0.5;
  const text = flip ? `${n} + ? = 10` : `? + ${n} = 10`;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 9) + 1;
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { kind: 'compose', text, frames: [n], answer, choices: shuffle(choices) };
}
// L2：破十法：退位减法 11~18 - s（个位比减数小，需拆 10）
function makeBreakProblem(): Q {
  const M = Math.floor(Math.random() * 8) + 11; // 11..18
  const r = M % 10; // 1..8
  const s = Math.floor(Math.random() * (9 - r)) + r + 1; // r+1..9
  const answer = M - s;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 10);
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { kind: 'break', text: `${M} − ${s} = ?`, frames: [10, r], answer, choices: shuffle(choices) };
}
// L3：进位加法：a + b，a,b 各 6~9，和 11~18
function makeCarryProblem(): Q {
  const a = Math.floor(Math.random() * 4) + 6; // 6..9
  const b = Math.floor(Math.random() * 4) + 6; // 6..9
  const answer = a + b;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 10) + 9; // 9..18
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { kind: 'carry', text: `${a} + ${b} = ?`, frames: [a, b], answer, choices: shuffle(choices) };
}
// L4：退位减法（两位数减一位数，个位不够减需借位）20~49 范围
function makeBorrowProblem(): Q {
  const tens = Math.floor(Math.random() * 3) + 2; // 2..4 (20s, 30s, 40s)
  const ones = Math.floor(Math.random() * 9); // 0..8
  const M = tens * 10 + ones; // 20..49
  const s = Math.floor(Math.random() * (9 - ones)) + ones + 1; // ones+1..9
  const answer = M - s;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 30) + 10; // 10..39
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { kind: 'borrow', text: `${M} − ${s} = ?`, frames: [], answer, choices: shuffle(choices) };
}
// L5：混合运算（两步，20 以内加减混合）
function makeMixedProblem(): Q {
  const a = Math.floor(Math.random() * 9) + 1; // 1..9
  const b = Math.floor(Math.random() * 9) + 1; // 1..9
  const sum = a + b;
  const c = Math.floor(Math.random() * (sum - 1)) + 1; // 1..sum-1 确保结果为正
  const answer = sum - c;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 15) + 1; // 1..15
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { kind: 'mixed', text: `${a} + ${b} − ${c} = ?`, frames: [], answer, choices: shuffle(choices) };
}
function makeProblem(lv: number): Q {
  if (lv <= 1) return makeComposeProblem();
  if (lv === 2) return makeBreakProblem();
  if (lv === 3) return makeCarryProblem();
  if (lv === 4) return makeBorrowProblem();
  return makeMixedProblem();
}

function TenFrame({ filled }: { filled: number }) {
  const cells = Array.from({ length: 10 }, (_, i) => i < filled);
  return (
    <div className="inline-grid grid-cols-5 gap-1.5 bg-blue-50 rounded-2xl p-3">
      {cells.map((on, i) => (
        <div
          key={i}
          className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-lg ${
            on ? 'bg-moko-blue text-white' : 'border-2 border-dashed border-gray-300 text-gray-300'
          }`}
        >
          {on ? '●' : ''}
        </div>
      ))}
    </div>
  );
}

// 十格阵魔法屋：凑十法（L1）/ 破十法（L2）/ 进位加法（L3），用十格阵直观呈现。
export default function MakeTen({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(5, Math.max(1, level));
  const timeLimit = [80, 75, 70, 65, 60][lv - 1];
  const [q, setQ] = useState<Q>(() => makeProblem(lv));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const hint =
    lv === 1 ? '凑十法：还差几个凑成 10？' : lv === 2 ? '破十法：先拆出 10 再减' : lv === 3 ? '进位加法：两个十格阵合起来' : lv === 4 ? '退位减法：借一个十来减' : '混合运算：加加减减两步走';

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

  function pick(n: number) {
    if (done) return;
    if (n === q.answer) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
    } else {
      setStreak(0);
    }
    setQ(makeProblem(lv));
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-base text-gray-500 mb-3">{hint}</p>
      {q.frames.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-5">
          {q.frames.map((f, i) => (
            <TenFrame key={i} filled={f} />
          ))}
        </div>
      )}
      <div className="text-4xl md:text-5xl font-black text-moko-violet mb-6 py-3">{q.text}</div>
      <div className="grid grid-cols-4 gap-3">
        {q.choices.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="py-4 rounded-2xl bg-gradient-to-r from-moko-yellow to-moko-gold text-white text-3xl font-black shadow hover:scale-105 transition"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
