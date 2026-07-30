'use client';

import { useState, useEffect } from 'react';
import {
  NUMBER_SENSE,
  COMPARE_QUESTIONS,
  SHAPES,
  ANGLES,
  makeMathQuestions,
  type AngleItem,
  type CompareItem,
  type MathQuestion,
} from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { logMistake } from '@/lib/mistake-log';

/* ---------- 数感：1~10 ---------- */
export function NumberSenseModule() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {NUMBER_SENSE.map((n) => (
        <button
          key={n.num}
          onClick={() => speakZh(String(n.num))}
          className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-blue/20 text-center active:scale-95 transition"
        >
          <div className="text-4xl font-black text-moko-blue mb-1">{n.num}</div>
          <div className="text-lg">{n.finger}</div>
        </button>
      ))}
    </div>
  );
}

/* ---------- 比较大小 / 多少 ---------- */
export function CompareModule() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const q: CompareItem = COMPARE_QUESTIONS[idx];

  function pick(ans: '>' | '<' | '=') {
    const correct: '>' | '<' | '=' = q.left > q.right ? '>' : q.left < q.right ? '<' : '=';
    const ok = ans === correct;
    setResult(ok ? 'right' : 'wrong');
    speakZh(ok ? '答对啦！' : '再想想看～');
    if (ok)
      setTimeout(() => {
        setResult('idle');
        setIdx((i) => (i + 1) % COMPARE_QUESTIONS.length);
      }, 1200);
    else logMistake({ subject: '数学', kind: '比较大小', prompt: `${q.left} ? ${q.right}`, answer: correct, wrong: ans });
  }

  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20">
      <div className="flex items-center justify-center gap-6 text-4xl mb-4">
        <div className="text-center">
          <div>{q.leftIcon.repeat(q.left)}</div>
          <div className="text-2xl font-black text-moko-blue mt-1">{q.left}</div>
        </div>
        <div className="text-3xl text-gray-400">?</div>
        <div className="text-center">
          <div>{q.rightIcon.repeat(q.right)}</div>
          <div className="text-2xl font-black text-moko-blue mt-1">{q.right}</div>
        </div>
      </div>
      <div className="flex justify-center gap-3">
        {(['>', '<', '='] as const).map((op) => (
          <button
            key={op}
            onClick={() => pick(op)}
            className="w-16 h-16 rounded-2xl bg-moko-blue text-white text-3xl font-black shadow active:scale-95 transition"
          >
            {op}
          </button>
        ))}
      </div>
      {result !== 'idle' && (
        <p className={`text-center mt-3 font-bold ${result === 'right' ? 'text-green-600' : 'text-red-500'}`}>
          {result === 'right' ? '🎉 太棒了！' : '💡 再试一次'}
        </p>
      )}
    </div>
  );
}

/* ---------- 认识图形 ---------- */
function ShapeCard({ item }: { item: (typeof SHAPES)[number] }) {
  return (
    <button
      onClick={() => speakZh(`${item.name}，${item.desc}`)}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-mint to-emerald-300 text-white shadow-lg text-center active:scale-95 transition"
    >
      <div className="text-5xl mb-1">{item.emoji}</div>
      <div className="text-2xl font-black">{item.name}</div>
      <div className="text-xs opacity-90">{item.desc}</div>
      <div className="text-xs opacity-80 mt-1">{item.sides === 0 ? '弯弯的边' : `${item.sides} 条边`}</div>
    </button>
  );
}

export function ShapeModule() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {SHAPES.map((s) => (
        <ShapeCard key={s.name} item={s} />
      ))}
    </div>
  );
}

/* ---------- 角度认知 ---------- */
function AngleCard({ item }: { item: AngleItem }) {
  const colors: Record<string, string> = {
    锐角: 'from-moko-yellow to-amber-300',
    直角: 'from-moko-mint to-emerald-300',
    钝角: 'from-moko-purple to-violet-300',
  };
  return (
    <button
      onClick={() => speakZh(`${item.name}，${item.desc}`)}
      className={`rounded-2xl p-4 bg-gradient-to-br ${colors[item.name]} text-white shadow-lg text-center active:scale-95 transition`}
    >
      <div className="text-4xl mb-1">{item.emoji}</div>
      <div className="text-2xl font-black">{item.name}</div>
      <div className="text-sm opacity-90">{item.desc}</div>
    </button>
  );
}

export function AngleModule() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ANGLES.map((a) => (
        <AngleCard key={a.name} item={a} />
      ))}
    </div>
  );
}

/* ---------- 加减法练习（难度自适应） ---------- */
type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

export function MathQuizModule() {
  const [level, setLevel] = useState<DiffLevel>('easy');
  const [qs, setQs] = useState<MathQuestion[]>(() => makeMathQuestions('easy'));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const q = qs[idx];

  useEffect(() => {
    const saved = localStorage.getItem('mathDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQs(makeMathQuestions(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mathDiffLevel', level);
    setQs(makeMathQuestions(level));
    setIdx(0);
    setInput('');
    setResult('idle');
  }, [level]);

  function adjust(next: DiffLevel) {
    if (next !== level) setLevel(next);
    setStreak({ right: 0, wrong: 0 });
  }

  function check() {
    const ans = q.op === '+' ? q.a + q.b : q.a - q.b;
    const ok = Number(input) === ans;
    setResult(ok ? 'right' : 'wrong');
    speakZh(ok ? '正确！' : `不对哦，${q.a}${q.op}${q.b}等于${ans}`);
    if (ok) {
      const nr = streak.right + 1;
      setStreak({ right: nr, wrong: 0 });
      if (nr >= 3 && level !== 'hard') {
        const ni = LEVEL_ORDER.indexOf(level) + 1;
        adjust(LEVEL_ORDER[ni]);
        speakZh('太厉害了，难度升级！');
      }
      setTimeout(() => {
        setResult('idle');
        setInput('');
        setIdx((i) => (i + 1) % qs.length);
      }, 1500);
    } else {
      const nw = streak.wrong + 1;
      setStreak({ right: 0, wrong: nw });
      if (nw >= 2 && level !== 'easy') {
        const ni = LEVEL_ORDER.indexOf(level) - 1;
        adjust(LEVEL_ORDER[ni]);
        speakZh('没关系，换简单一点的～');
      }
      logMistake({ subject: '数学', kind: '加减法', prompt: `${q.a} ${q.op} ${q.b} = ?`, answer: String(ans), wrong: input || '' });
    }
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-cyan to-sky-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">难度：{meta.emoji} {meta.label}</span>
        <span className="text-xs opacity-90">连对 {streak.right} · 自动调整中</span>
      </div>
      <div className="text-center text-5xl font-black mb-4">
        {q.a} {q.op} {q.b} = ?
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
        <button onClick={check} className="px-6 py-2 rounded-xl bg-white text-moko-cyan font-black text-xl shadow active:scale-95 transition">
          提交
        </button>
      </div>
      {result !== 'idle' && (
        <p className={`text-center mt-3 font-bold ${result === 'right' ? 'text-white' : 'text-yellow-200'}`}>
          {result === 'right' ? '🎉 答对啦！' : '💡 再算一次'}
        </p>
      )}
    </div>
  );
}
