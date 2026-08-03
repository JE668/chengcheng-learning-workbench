'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { speakZh, praise } from '@/lib/speak';

const EMOJIS = [
  '🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍒', '🥝', '🍍',
  '🐶', '🐱', '🐰', '🐻', '🐼', '🐯', '🦁', '🐸', '🐵', '🐷',
  '🌸', '🌻', '🌟', '⭐', '🌈', '🔥', '💧', '🌙', '☀️', '🍀',
  '🚗', '🚀', '⚽', '🎈', '🎁', '📚', '🎈', '🍔', '🍕', '🐟',
];

const TOTAL_ROUNDS = 6;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Round {
  left: string[];
  right: string[];
  diff: number; // 左右不一致的格子下标
  cols: number;
}

function makeRound(level: number): Round {
  const size = level === 1 ? 12 : level === 2 ? 20 : 30;
  const cols = level === 1 ? 4 : level === 2 ? 5 : 6;
  const base: string[] = [];
  for (let i = 0; i < size; i++) base.push(pick(EMOJIS));
  const diff = Math.floor(Math.random() * size);
  const right = [...base];
  let replacement = pick(EMOJIS);
  while (replacement === base[diff]) replacement = pick(EMOJIS);
  right[diff] = replacement;
  return { left: base, right, diff, cols };
}

export default function SpotDifference({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const [round, setRound] = useState(0);
  const [r, setR] = useState<Round>(() => makeRound(level));
  const [found, setFound] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState<{ panel: 'l' | 'r'; i: number } | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current); }, []);

  function tap(panel: 'l' | 'r', i: number) {
    if (found) return;
    if (i === r.diff) {
      setFound(true);
      setScore((s) => s + 20);
      speakZh('找到啦！你眼睛真尖！');
      praise();
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          onFinish(score + 20);
        } else {
          setRound((x) => x + 1);
          setR(makeRound(level));
          setFound(false);
        }
      }, 1200);
    } else {
      setMistakes((m) => m + 1);
      setShake({ panel, i });
      speakZh('这里一样哦，再找找不一样的～', 0.85);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(null), 600);
    }
  }

  const cell = (panel: 'l' | 'r', i: number) => {
    const emoji = panel === 'l' ? r.left[i] : r.right[i];
    const isShake = shake?.panel === panel && shake.i === i;
    return (
      <button
        key={`${panel}-${i}`}
        onClick={() => tap(panel, i)}
        disabled={found}
        className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl rounded-xl bg-white border-2 border-moko-purple/20 shadow active:scale-90 transition ${
          isShake ? 'animate-pulse border-red-400' : ''
        }`}
      >
        {emoji}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-moko-purple to-moko-violet text-white text-center shadow">
        <div className="text-3xl mb-1">🔍✨</div>
        <p className="font-bold">好奇萌可：左右两幅图只有一处不一样，圈出它！</p>
        <p className="text-xs opacity-90 mt-1">
          第 {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS} 关 · 已得 {score} 分 · 点错 {mistakes} 次
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-2 bg-white shadow border-2 border-moko-purple/20">
          <div className="text-center text-xs font-bold text-moko-purple mb-1">左图</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${r.cols}, minmax(0, 1fr))` }}>
            {r.left.map((_, i) => cell('l', i))}
          </div>
        </div>
        <div className="rounded-2xl p-2 bg-white shadow border-2 border-moko-purple/20">
          <div className="text-center text-xs font-bold text-moko-purple mb-1">右图</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${r.cols}, minmax(0, 1fr))` }}>
            {r.right.map((_, i) => cell('r', i))}
          </div>
        </div>
      </div>
      {found && <p className="text-center font-black text-green-600">🎉 找到啦！下一组马上来～</p>}
    </div>
  );
}
