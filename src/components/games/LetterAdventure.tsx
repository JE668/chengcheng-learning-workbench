'use client';

import { useCallback, useEffect, useState } from 'react';

const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const al = 'abcdefghijklmnopqrstuvwxyz';

function makeRound(mode: 'upper' | 'lower' | 'mixed') {
  const pool = mode === 'upper' ? AL : mode === 'lower' ? al : Math.random() > 0.5 ? AL : al;
  const idx = Math.floor(Math.random() * (pool.length - 4)) + 2;
  const seq = pool.slice(idx - 2, idx + 3).split('');
  const hiddenAt = 2;
  const answer = seq[hiddenAt];
  const choices: string[] = [answer];
  while (choices.length < 4) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (c !== answer && !choices.includes(c)) choices.push(c);
  }
  return { seq, hiddenAt, answer, choices: choices.sort(() => 0.5 - Math.random()) };
}

const MODE: Record<number, 'upper' | 'lower' | 'mixed'> = { 1: 'upper', 2: 'lower', 3: 'mixed' };
const TOTAL: Record<number, number> = { 1: 12, 2: 14, 3: 16 };
const TIME: Record<number, number> = { 1: 90, 2: 80, 3: 70 };

export default function LetterAdventure({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const mode = MODE[lv];
  const total = TOTAL[lv];
  const [round, setRound] = useState(makeRound(mode));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [time, setTime] = useState(TIME[lv]);
  const [done, setDone] = useState(false);

  const finish = useCallback((c: number) => {
    setDone(true);
    onFinish(c * 10 + Math.max(0, time));
  }, [onFinish, time]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) finish(correct);
  }, [time, done, correct, finish]);

  function pick(l: string) {
    if (done) return;
    const ok = l === round.answer;
    const nc = ok ? correct + 1 : correct;
    setCorrect(nc);
    if (idx + 1 >= total) finish(nc);
    else {
      setIdx(idx + 1);
      setRound(makeRound(mode));
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">{idx + 1}/{total} 对 {correct}</span>
      </div>
      <p className="text-gray-600 mb-4">找出空缺的字母</p>
      <div className="flex justify-center gap-2 md:gap-4 mb-8 text-3xl md:text-5xl font-black text-moko-violet">
        {round.seq.map((c, i) => (
          <div
            key={i}
            className={`w-14 h-14 md:w-20 md:h-20 rounded-xl flex items-center justify-center shadow ${i === round.hiddenAt ? 'bg-moko-pink text-white' : 'bg-yellow-100'}`}
          >
            {i === round.hiddenAt ? '?' : c}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-3 flex-wrap">
        {round.choices.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="w-16 h-16 md:w-20 md:h-20 text-3xl font-black rounded-2xl bg-gradient-to-r from-moko-yellow to-moko-gold text-white shadow hover:scale-110 transition"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
