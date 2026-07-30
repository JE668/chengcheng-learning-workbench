'use client';

import { useEffect, useState } from 'react';

function makeRound(lv: number) {
  const range = [20, 50, 100][Math.min(2, Math.max(0, lv - 1))];
  const a = Math.floor(Math.random() * range) + 1;
  const b = Math.floor(Math.random() * range) + 1;
  const ops: ('>' | '<' | '=')[] = ['>', '<', '='];
  const answer = a > b ? '>' : a < b ? '<' : '=';
  return { a, b, answer, choices: ops.sort(() => 0.5 - Math.random()) };
}

export default function CompareBalance({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [60, 50, 45][lv - 1];
  const [round, setRound] = useState(makeRound(lv));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const total = 12;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) finish(correct);
  }, [time, done, correct]);

  function finish(c: number) {
    setDone(true);
    onFinish(c * 12 + Math.max(0, time));
  }

  function pick(sym: string) {
    if (done) return;
    const ok = sym === round.answer;
    const nextCorrect = ok ? correct + 1 : correct;
    setCorrect(nextCorrect);
    if (idx + 1 >= total) {
      finish(nextCorrect);
    } else {
      setIdx(idx + 1);
      setRound(makeRound(lv));
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">{idx + 1}/{total} 对 {correct}</span>
      </div>
      <div className="flex items-center justify-center gap-6 mb-8 text-5xl md:text-6xl font-black text-moko-violet">
        <div className="w-28 h-28 rounded-2xl bg-moko-pink text-white flex items-center justify-center shadow">{round.a}</div>
        <span className="text-gray-400">?</span>
        <div className="w-28 h-28 rounded-2xl bg-moko-blue text-white flex items-center justify-center shadow">{round.b}</div>
      </div>
      <div className="flex justify-center gap-4">
        {round.choices.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="w-24 h-24 text-4xl font-black rounded-2xl bg-gradient-to-br from-moko-purple to-moko-violet text-white shadow hover:scale-110 transition"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
