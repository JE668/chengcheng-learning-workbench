'use client';

import { useCallback, useEffect, useState } from 'react';

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

function makeGrid(size: number): number[] {
  return shuffle(Array.from({ length: size * size }, (_, i) => i + 1));
}

// 舒尔特方格：按顺序点出 1→N，训练专注力与视觉搜索。计时越短得分越高。
export default function Schulte({
  onFinish,
  level = 1,
}: {
  onFinish: (score: number) => void;
  level?: number;
}) {
  const lv = Math.min(3, Math.max(1, level));
  const size = [3, 4, 5][lv - 1];
  const base = [120, 200, 320][lv - 1];
  const [grid, setGrid] = useState<number[]>(() => makeGrid(size));
  const [done, setDone] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  /**
   * 重开一局（「换一批」按钮用），并在 size 变化时被下面的 effect 调用。
   *
   * ## 为什么按 size 重开
   * `grid` 用 useState 的惰性初始化（`useState(() => makeGrid(size))`），那个初始化
   * 函数**只在挂载时执行一次**。若本组件在挂载后被换成另一个 level：
   *   · size 由 3 变 4 → 布局变 4 列、完成条件变成 size*size=16
   *   · 但 grid 仍只有 9 个数 → 点到 9 之后 next=10，界面上没有 10
   *   · `d.length === size * size` 永不成立 → 卡死，计时器一直跑
   *
   * ## 实测结论（重要，别被上面吓到）
   * 这条路径**当前不可达**：GameShell 只在 started=true 时渲染关卡组件，而 level 在
   * 那之前就已被设为「记住的关卡」；结束时 setStarted(false) 会先把组件卸载，
   * 「再玩一次」才重新挂载。schulte-gameshell.test.tsx 用两条真实路径验证过：
   * **原始代码同样通过**。
   *
   * 所以这不是在修线上故障，而是让组件对**自己的 props** 负责 —— 谁若把 <Schulte />
   * 直接用在 level 会变的地方，不会再踩这个坑。顺带「换一批」也需要这个函数。
   */
  const restart = useCallback(() => {
    setGrid(makeGrid(size));
    setDone([]);
    setNext(1);
    setElapsed(0);
    setFinished(false);
    setMistakes(0);
  }, [size]);

  // 关卡（size）变化即重开一局；首帧也会跑一次（等价于初始化）
  useEffect(() => {
    restart();
  }, [restart]);

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
        按顺序点出 <span className="font-extrabold text-moko-blue">1 → {size * size}</span>
        ，越快越好！
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
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={restart}
          className="px-5 py-2 rounded-full bg-moko-violet/10 text-moko-violet font-bold hover:bg-moko-violet/20 active:scale-95 transition"
        >
          🔀 换一批
        </button>
      </div>
      {mistakes > 0 && (
        <p className="text-sm text-gray-400 mt-3">点错 {mistakes} 次（不影响流程，但会扣一点分）</p>
      )}
    </div>
  );
}
