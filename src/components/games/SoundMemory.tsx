'use client';

import { useEffect, useRef, useState } from 'react';
import { speakZh, praise } from '@/lib/speak';

const TOTAL_ROUNDS = 5;

function makeSeq(len: number): number[] {
  const s: number[] = [];
  for (let i = 0; i < len; i++) s.push(Math.floor(Math.random() * 10));
  return s;
}

export default function SoundMemory({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const baseLen = level === 1 ? 3 : level === 2 ? 4 : 5;
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>(() => makeSeq(baseLen));
  const [input, setInput] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'idle' | 'wrong'>('idle');
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);

  function play() {
    if (playing) return;
    setPlaying(true);
    const text = seq.join('、');
    speakZh(`请记住这一串数字：${text}`, 0.7);
    // 估算朗读时长，结束解除锁定
    const ms = 1400 + seq.length * 650;
    setTimeout(() => setPlaying(false), ms);
  }

  // 进入每一关自动播一次
  useEffect(() => {
    const t = setTimeout(play, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, seq]);

  function tapDigit(d: number) {
    if (playing || result !== 'idle') return;
    if (input.length >= seq.length) return;
    setInput((arr) => [...arr, d]);
  }

  function submit() {
    if (input.length !== seq.length) return;
    const ok = input.every((d, i) => d === seq[i]);
    if (ok) {
      setScore((s) => s + 20);
      praise();
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          onFinish(score + 20);
        } else {
          const nextLen = baseLen + Math.floor((round + 1) / 2);
          setRound((x) => x + 1);
          setSeq(makeSeq(nextLen));
          setInput([]);
          setResult('idle');
        }
      }, 1100);
    } else {
      setResult('wrong');
      speakZh('顺序不太对，再听一次，记住它～', 0.85);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => {
        setInput([]);
        setResult('idle');
        play();
      }, 1600);
    }
  }

  function backspace() {
    if (playing) return;
    setInput((arr) => arr.slice(0, -1));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-moko-violet to-moko-blue text-white text-center shadow">
        <div className="text-3xl mb-1">👂🌟</div>
        <p className="font-bold">睿智萌可：仔细听数字，按顺序点出来！</p>
        <p className="text-xs opacity-90 mt-1">
          第 {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS} 关（长度 {seq.length}）· 已得 {score} 分
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={play}
          disabled={playing}
          className="px-5 py-2 rounded-full bg-moko-violet text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
        >
          🔊 {playing ? '播放中…' : '再听一次'}
        </button>
      </div>

      {/* 输入显示 */}
      <div className="rounded-2xl p-4 bg-white shadow border-2 border-moko-blue/20 flex items-center justify-center gap-3 min-h-[60px]">
        {input.length === 0 ? (
          <span className="text-gray-400 text-sm">听完数字，按顺序点下面的键盘～</span>
        ) : (
          input.map((d, i) => (
            <span key={i} className="w-10 h-10 rounded-xl bg-moko-blue text-white font-black text-2xl flex items-center justify-center shadow">
              {d}
            </span>
          ))
        )}
      </div>

      {result === 'wrong' && <p className="text-center font-bold text-red-500">💡 再听一次，记住顺序哦～</p>}

      {/* 数字键盘 */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, d) => (
          <button
            key={d}
            onClick={() => tapDigit(d)}
            disabled={playing || input.length >= seq.length}
            className="py-4 rounded-2xl font-black text-2xl shadow bg-white text-moko-blue border-2 border-moko-blue/30 active:scale-95 transition disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={backspace}
          disabled={playing || input.length === 0}
          className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition disabled:opacity-50"
        >
          ⌫ 退一格
        </button>
        <button
          onClick={submit}
          disabled={playing || input.length !== seq.length}
          className="px-6 py-2 rounded-full bg-moko-pink text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
        >
          ✅ 提交
        </button>
      </div>
    </div>
  );
}
