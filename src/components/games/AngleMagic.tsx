'use client';

import { useCallback, useEffect, useState } from 'react';

function makeRound() {
  const targets = [30, 45, 60, 90, 120, 135, 150];
  const target = targets[Math.floor(Math.random() * targets.length)];
  return { target };
}

const ROUNDS: Record<number, number> = { 1: 5, 2: 7, 3: 10 };
const TOL: Record<number, { great: number; good: number; ok: number }> = {
  1: { great: 5, good: 10, ok: 18 },
  2: { great: 4, good: 8, ok: 15 },
  3: { great: 3, good: 6, ok: 12 },
};

export default function AngleMagic({
  onFinish,
  level = 1,
}: {
  onFinish: (score: number) => void;
  level?: number;
}) {
  const lv = Math.min(3, Math.max(1, level));
  const total = ROUNDS[lv];
  const tol = TOL[lv];
  const [rounds, setRounds] = useState(() => Array.from({ length: total }, makeRound));
  const [idx, setIdx] = useState(0);
  const [angle, setAngle] = useState(90);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const target = rounds[idx].target;

  /**
   * 重开一局（并在 total 变化时由下面的 effect 调用）。
   *
   * 原先写作 `const [rounds] = useState(() => ...)` —— 连 setter 都没有，惰性初始化
   * 只在挂载时跑一次。若本组件在挂载后被换成另一个 level，`total` 从 ROUNDS[1]=5
   * 变成 ROUNDS[3]=10，而 `rounds` 仍是 5 个 → 界面显示第 3 关却只出 5 题，
   * 关卡进度形同虚设。
   *
   * 与 Schulte 同源。同样地：**这条路径当前不可达**（GameShell 只在 started=true 时
   * 渲染关卡组件，level 在那之前已定；结束时先卸载再重挂载）。这里是为了让组件
   * 对自己的 props 负责，不是在修线上故障 —— 实测见 schulte-gameshell.test.tsx。
   */
  const restart = useCallback(() => {
    setRounds(Array.from({ length: total }, makeRound));
    setIdx(0);
    setAngle(90);
    setScore(0);
    setDone(false);
  }, [total]);

  useEffect(() => {
    restart();
  }, [restart]);

  function submit() {
    if (done) return;
    const diff = Math.abs(angle - target);
    let pts = 0;
    if (diff <= tol.great) pts = 50;
    else if (diff <= tol.good) pts = 30;
    else if (diff <= tol.ok) pts = 15;
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
        <span className="font-bold text-moko-rose">
          {idx + 1}/{rounds.length}
        </span>
      </div>
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-moko-cyan"></div>
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left bg-moko-rose transition-transform duration-300"
          style={{ transform: `translateY(-50%) rotate(${angle}deg)` }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left bg-gray-300"
          style={{ transform: 'translateY(-50%) rotate(0deg)' }}
        ></div>
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
      <button
        onClick={submit}
        className="px-10 py-3 bg-gradient-to-r from-moko-cyan to-moko-blue text-white text-xl font-extrabold rounded-full shadow hover:scale-105 transition"
      >
        发射流星箭 ✨
      </button>
    </div>
  );
}
