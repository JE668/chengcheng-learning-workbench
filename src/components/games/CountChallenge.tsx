'use client';

import { useEffect, useState } from 'react';

function makeRound(level: number) {
  if (level <= 3) {
    const count = Math.floor(Math.random() * 20) + 1;
    return { type: 'count' as const, count, prompt: `数一数有多少颗星星？` };
  } else if (level <= 6) {
    const start = Math.floor(Math.random() * 10) + 1;
    const step = [2, 5][Math.floor(Math.random() * 2)];
    const count = 5;
    const seq = Array.from({ length: count }, (_, i) => start + i * step);
    return { type: 'skip' as const, count: seq[seq.length - 1], prompt: `从 ${start} 开始，每次加 ${step}，最后一个数是几？`, seq };
  } else {
    const count = Math.floor(Math.random() * 50) + 21;
    return { type: 'count' as const, count, prompt: `快速数一数月亮的数量` };
  }
}

export default function CountChallenge({ onFinish }: { onFinish: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(makeRound(1));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(90);
  const [done, setDone] = useState(false);
  const total = 10;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) { setDone(true); onFinish(score); }
  }, [time, done, score, onFinish]);

  function submit() {
    if (done) return;
    const n = Number(input);
    const ok = n === round.count;
    const ns = ok ? score + 12 : score;
    setScore(ns);
    if (idx + 1 >= total) { setDone(true); onFinish(ns); }
    else {
      const nl = Math.min(9, level + 1);
      setLevel(nl);
      setRound(makeRound(nl));
      setInput('');
      setIdx(idx + 1);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">{idx + 1}/{total} 积分 {score}</span>
      </div>
      <p className="text-xl font-bold text-moko-violet mb-4">{round.prompt}</p>
      {round.type === 'count' && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 text-3xl">
          {Array.from({ length: Math.min(round.count, 40) }, (_, i) => (
            <span key={i}>{i % 2 === 0 ? '⭐' : '🌙'}</span>
          ))}
          {round.count > 40 && <span className="text-moko-rose">+{round.count - 40}</span>}
        </div>
      )}
      {round.type === 'skip' && (
        <div className="text-3xl font-black text-moko-yellow mb-6 flex justify-center gap-3">
          {round.seq.slice(0, -1).map((n, i) => <span key={i}>{n}</span>)}
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
        <button onClick={submit} className="px-8 py-3 bg-gradient-to-r from-moko-purple to-moko-violet text-white text-xl font-extrabold rounded-full shadow hover:scale-105 transition">
          提交
        </button>
      </div>
    </div>
  );
}
