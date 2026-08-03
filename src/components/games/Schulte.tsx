'use client';

import { useEffect, useState } from 'react';

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

function makeGrid(size: number): number[] {
  return shuffle(Array.from({ length: size * size }, (_, i) => i + 1));
}

// 舒尔特方格：按顺序点出 1→N，训练专注力与视觉搜索。计时越短得分越高。
export default function Schulte({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const size = [3, 4, 5][lv - 1];
  const base = [120, 200, 320][lv - 1];
  const [grid, setGrid] = useState<number[]>(() => makeGrid(size));
  const [done, setDone] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [finished]);

  function tap(n: number) {
    if (finished) return;
    if (n === next) {
      const d = [...done, n];
      setDone(d);
      if (d.length === size * size) {
        setFinished(true);
        const score = Math.max(30, base - elapsed - mistakes * 5);
        onFinish(score);
      } else {
        setNext(next + 1);
      }
    } else {
      setMistakes((m) => m + 1);
    }
  }

  const fmt = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {fmt}</span>
        <span className="font-bold text-moko-rose">下一个：{next}</span>
      </div>
      <p className="text-lg text-gray-600 mb-4">
        按顺序点出 <span className="font-extrabold text-moko-blue">1 → {size * size}</span>，越快越好！
      </p>
      <div
        className="grid gap-2 mx-auto"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, maxWidth: 360 }}
      >
        {grid.map((n) => {
          const isDone = done.includes(n);
          const isNext = n === next;
          return (
            <button
              key={n}
              onClick={() => tap(n)}
              className={`aspect-square rounded-2xl text-2xl md:text-3xl font-black flex items-center justify-center transition ${
                isDone
                  ? 'bg-moko-mint text-white opacity-60'
                  : isNext
                  ? 'bg-gradient-to-br from-moko-yellow to-moko-gold text-white shadow-lg scale-105'
                  : 'bg-gradient-to-br from-moko-purple to-moko-violet text-white shadow hover:scale-105'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {mistakes > 0 && (
        <p className="text-sm text-gray-400 mt-3">点错 {mistakes} 次（不影响流程，但会扣一点分）</p>
      )}
    </div>
  );
}
