'use client';

import { useEffect, useState } from 'react';

function makeProblem(level: number) {
  const ops = level > 2 ? ['+', '-'] : ['+'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 12) + 1;
  let b = Math.floor(Math.random() * 12) + 1;
  if (op === '-') { if (a < b) [a, b] = [b, a]; }
  const ans = op === '+' ? a + b : a - b;
  const text = `${a} ${op} ${b} = ?`;
  const choices = new Set<number>([ans]);
  while (choices.size < 4) {
    const d = Math.floor(Math.random() * 25) - 5;
    if (d !== ans && d >= 0) choices.add(d);
  }
  return { text, answer: ans, choices: [...choices].sort(() => 0.5 - Math.random()) };
}

export default function MathChallenge({ onFinish }: { onFinish: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [prob, setProb] = useState(makeProblem(1));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) { setDone(true); onFinish(score); }
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
    const nextLevel = Math.min(4, level + 1);
    setLevel(nextLevel);
    setProb(makeProblem(nextLevel));
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <div className="text-5xl md:text-6xl font-black text-moko-blue mb-8 py-6 bg-blue-50 rounded-2xl">{prob.text}</div>
      <div className="grid grid-cols-2 gap-4">
        {prob.choices.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="py-5 rounded-2xl bg-gradient-to-r from-moko-yellow to-moko-gold text-white text-3xl font-black shadow hover:scale-105 transition"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
