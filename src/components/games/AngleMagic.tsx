'use client';

import { useEffect, useState } from 'react';

function makeRound() {
  const targets = [30, 45, 60, 90, 120, 135, 150];
  const target = targets[Math.floor(Math.random() * targets.length)];
  return { target };
}

export default function AngleMagic({ onFinish }: { onFinish: (score: number) => void }) {
  const [rounds] = useState(() => Array.from({ length: 5 }, makeRound));
  const [idx, setIdx] = useState(0);
  const [angle, setAngle] = useState(90);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const target = rounds[idx].target;

  function submit() {
    if (done) return;
    const diff = Math.abs(angle - target);
    let pts = 0;
    if (diff <= 3) pts = 50;
    else if (diff <= 8) pts = 30;
    else if (diff <= 15) pts = 15;
    else pts = 5;
    const newScore = score + pts;
    setScore(newScore);
    if (idx + 1 >= rounds.length) {
      setDone(true);
      onFinish(newScore);
    } else {
      setIdx(idx + 1);
      setAngle(90);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="mb-4 flex justify-between">
        <span className="font-bold text-moko-violet">目标角度：{target}°</span>
        <span className="font-bold text-moko-rose">{idx + 1}/{rounds.length}</span>
      </div>
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-moko-cyan"></div>
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left bg-moko-rose transition-transform duration-300"
             style={{ transform: `translateY(-50%) rotate(${angle}deg)` }}></div>
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left bg-gray-300"
             style={{ transform: 'translateY(-50%) rotate(0deg)' }}></div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-moko-violet rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      <div className="text-4xl font-black text-moko-blue mb-4">{angle}°</div>
      <input
        type="range"
        min="0"
        max="180"
        value={angle}
        onChange={(e) => setAngle(Number(e.target.value))}
        className="w-full mb-6 accent-moko-rose"
      />
      <button onClick={submit} className="px-10 py-3 bg-gradient-to-r from-moko-cyan to-moko-blue text-white text-xl font-extrabold rounded-full shadow hover:scale-105 transition">
        发射流星箭 ✨
      </button>
    </div>
  );
}
