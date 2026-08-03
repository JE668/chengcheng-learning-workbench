'use client';

import { useEffect, useState } from 'react';

// 凑十法：用十格阵直观展示「还差几个凑成 10」。
function makeProblem(lv: number) {
  const n = Math.floor(Math.random() * 9) + 1; // 已填 1~9 个
  const answer = 10 - n;
  const flip = Math.random() < 0.5;
  const text = flip ? `${n} + ? = 10` : `? + ${n} = 10`;
  const choices = [answer];
  while (choices.length < 4) {
    const d = Math.floor(Math.random() * 9) + 1; // 1~9 干扰项
    if (d !== answer && !choices.includes(d)) choices.push(d);
  }
  return { n, answer, text, choices: choices.sort(() => 0.5 - Math.random()) };
}

export default function MakeTen({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 70, 60][lv - 1];
  const [prob, setProb] = useState(makeProblem(lv));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

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
    if (n === prob.answer) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
    } else {
      setStreak(0);
    }
    setProb(makeProblem(lv));
  }

  const cells = Array.from({ length: 10 }, (_, i) => i < prob.n);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-lg text-gray-600 mb-3">
        数一数，再凑成 <span className="font-extrabold text-moko-blue text-2xl">10</span> 个！
      </p>
      <div className="inline-grid grid-cols-5 gap-2 mb-5 bg-blue-50 rounded-2xl p-4">
        {cells.map((filled, i) => (
          <div
            key={i}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-xl ${
              filled ? 'bg-moko-blue border-moko-blue text-white' : 'border-dashed border-gray-300 text-gray-300'
            }`}
          >
            {filled ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="text-4xl md:text-5xl font-black text-moko-violet mb-6 py-4">{prob.text}</div>
      <div className="grid grid-cols-4 gap-3">
        {prob.choices.map((c) => (
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
