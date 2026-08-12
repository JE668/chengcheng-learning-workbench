'use client';

import { useState, useEffect } from 'react';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import type { MathQuestion } from '@/lib/study-data';

/* ============================================================
 * 退位减法（20 以内，个位不够减，需要借位）
 * ========================================================= */
function genBorrow(): MathQuestion[] {
  const qs: MathQuestion[] = [];
  let guard = 0;
  while (qs.length < 10 && guard++ < 200) {
    const a = Math.floor(Math.random() * 8) + 11; // 11 ~ 18
    const b = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
    if (b < a && a % 10 < b) {
      // 个位不够减 → 退位
      qs.push({ a, b, op: '-' });
    }
  }
  return qs;
}

export function BorrowModule() {
  const [qs, setQs] = useState<MathQuestion[]>(() => genBorrow());
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const q = qs[idx];
  const logM = useMistakeLogger();

  useEffect(() => {
    setInput('');
    setResult('idle');
  }, [idx]);

  function check() {
    const ans = q.a - q.b;
    const ok = Number(input) === ans;
    setResult(ok ? 'right' : 'wrong');
    speakZh(ok ? '正确！' : `不对哦，${q.a} 减 ${q.b} 等于 ${ans}，个位不够减要向十位借 1`);
    if (ok) {
      const nr = streak.right + 1;
      setStreak({ right: nr, wrong: 0 });
      setTimeout(() => {
        if (nr >= 5) {
          setQs(genBorrow());
          setIdx(0);
        } else {
          setIdx((i) => (i + 1) % qs.length);
        }
      }, 1300);
    } else {
      setStreak({ right: 0, wrong: streak.wrong + 1 });
      logM({ subject: '数学', kind: '退位减法', prompt: `${q.a} - ${q.b} = ?`, answer: String(ans), wrong: input || '' });
    }
  }

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-rose to-pink-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">退位减法 · 借一当十</span>
        <span className="text-xs opacity-90">连对 {streak.right} · 越练越熟</span>
      </div>
      <div className="text-center text-5xl font-black mb-4">
        {q.a} − {q.b} = ?
      </div>
      <div className="flex gap-2 justify-center">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          className="w-24 text-center text-3xl font-black text-moko-violet rounded-xl py-2"
          placeholder="?"
        />
        <button onClick={check} className="px-6 py-2 rounded-xl bg-white text-moko-rose font-black text-xl shadow active:scale-95 transition">
          提交
        </button>
      </div>
      {result !== 'idle' && (
        <p className={`text-center mt-3 font-bold ${result === 'right' ? 'text-white' : 'text-yellow-200'}`}>
          {result === 'right' ? '🎉 答对啦！' : '💡 个位不够减，向十位借 1'}
        </p>
      )}
    </div>
  );
}

/* ============================================================
 * 看图列式（看 emoji 场景，列出算式并算出结果）
 * ========================================================= */
const PIC_POOL = ['🍎', '🐟', '⭐', '🌸', '🚗', '🍓', '🐰', '🍪', '🦋', '🍊'];

interface PicQ {
  emoji: string;
  a: number;
  b: number;
}

function genPic(): PicQ {
  const emoji = PIC_POOL[Math.floor(Math.random() * PIC_POOL.length)];
  const a = Math.floor(Math.random() * 5) + 1; // 1 ~ 5
  const b = Math.floor(Math.random() * 5) + 1; // 1 ~ 5
  return { emoji, a, b };
}

export function PictureEquationModule() {
  const [q, setQ] = useState<PicQ>(() => genPic());
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const logM = useMistakeLogger();

  function check() {
    const ans = q.a + q.b;
    const ok = Number(input) === ans;
    setResult(ok ? 'right' : 'wrong');
    speakZh(ok ? '你真棒！' : `再看图数一数，${q.a} 加 ${q.b} 等于 ${ans}`);
    if (ok) {
      setTimeout(() => {
        setResult('idle');
        setInput('');
        setQ(genPic());
      }, 1300);
    } else {
      logM({ subject: '数学', kind: '看图列式', prompt: `${q.a} + ${q.b} = ?`, answer: String(ans), wrong: input || '' });
    }
  }

  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20">
      <div className="text-sm font-bold text-moko-blue mb-3 text-center">🖼️ 看图列式：把两堆合起来，一共几个？</div>
      <div className="flex items-center justify-center gap-4 text-4xl mb-4 flex-wrap">
        <div className="text-center">
          <div>{q.emoji.repeat(q.a)}</div>
          <div className="text-xl font-black text-moko-blue mt-1">{q.a}</div>
        </div>
        <div className="text-3xl text-gray-400">+</div>
        <div className="text-center">
          <div>{q.emoji.repeat(q.b)}</div>
          <div className="text-xl font-black text-moko-blue mt-1">{q.b}</div>
        </div>
        <div className="text-3xl text-gray-400">=</div>
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          className="w-20 text-center text-3xl font-black text-moko-violet rounded-xl py-2 border-2 border-moko-blue/30"
          placeholder="?"
        />
      </div>
      <div className="flex justify-center">
        <button onClick={check} className="px-6 py-2 rounded-xl bg-moko-blue text-white font-black text-xl shadow active:scale-95 transition">
          算一算
        </button>
      </div>
      {result !== 'idle' && (
        <p className={`text-center mt-3 font-bold ${result === 'right' ? 'text-green-600' : 'text-red-500'}`}>
          {result === 'right' ? '🎉 太棒了！' : '💡 再数数看'}
        </p>
      )}
    </div>
  );
}
