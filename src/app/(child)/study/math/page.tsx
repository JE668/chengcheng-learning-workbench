'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  NUMBER_SENSE,
  COMPARE_QUESTIONS,
  ANGLES,
  makeMathQuestions,
  type AngleItem,
  type CompareItem,
  type MathQuestion,
} from '@/lib/study-data';

function speak(text: string, rate = 0.85) {
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ---------- 数感：1~10 ---------- */
function NumberSense() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {NUMBER_SENSE.map((n) => (
        <button
          key={n.num}
          onClick={() => speak(String(n.num))}
          className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-blue/20 text-center active:scale-95 transition"
        >
          <div className="text-4xl font-black text-moko-blue mb-1">{n.num}</div>
          <div className="text-lg">{n.finger}</div>
        </button>
      ))}
    </div>
  );
}

/* ---------- 比较大小 ---------- */
function CompareGame() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const q = COMPARE_QUESTIONS[idx];

  function pick(ans: '>' | '<' | '=') {
    let correct: '>' | '<' | '=' = q.left > q.right ? '>' : q.left < q.right ? '<' : '=';
    const ok = ans === correct;
    setResult(ok ? 'right' : 'wrong');
    speak(ok ? '答对啦！' : '再想想看～');
    if (ok) setTimeout(() => {
      setResult('idle');
      setIdx((i) => (i + 1) % COMPARE_QUESTIONS.length);
    }, 1200);
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

/* ---------- 角度认知 ---------- */
function AngleCard({ item }: { item: AngleItem }) {
  const colors = { 锐角: 'from-moko-yellow to-amber-300', 直角: 'from-moko-mint to-emerald-300', 钝角: 'from-moko-purple to-violet-300' };
  return (
    <button
      onClick={() => speak(`${item.name}，${item.desc}`)}
      className={`rounded-2xl p-4 bg-gradient-to-br ${colors[item.name]} text-white shadow-lg text-center active:scale-95 transition`}
    >
      <div className="text-4xl mb-1">{item.emoji}</div>
      <div className="text-2xl font-black">{item.name}</div>
      <div className="text-sm opacity-90">{item.desc}</div>
    </button>
  );
}

/* ---------- 加减法练习 ---------- */
function MathQuiz() {
  const [qs] = useState(() => makeMathQuestions('easy'));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const q = qs[idx];

  function check() {
    const ans = q.op === '+' ? q.a + q.b : q.a - q.b;
    const ok = Number(input) === ans;
    setResult(ok ? 'right' : 'wrong');
    speak(ok ? '正确！' : `不对哦，${q.a}${q.op}${q.b}等于${ans}`);
    if (ok) setTimeout(() => {
      setResult('idle');
      setInput('');
      setIdx((i) => (i + 1) % qs.length);
    }, 1500);
  }

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-cyan to-sky-300 text-white shadow-lg">
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

export default function MathStudyPage() {
  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-blue mb-2">🔢 数学小天地</h1>
      <p className="text-gray-600 mb-6">和正正萌可一起认数字、比大小、看角度、练加减法～</p>

      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🔟 1~10 数感</h2>
        <NumberSense />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">⚖️ 比较大小 / 多少</h2>
        <CompareGame />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">📐 认识角</h2>
        <div className="grid grid-cols-3 gap-3">
          {ANGLES.map((a) => (
            <AngleCard key={a.name} item={a} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">➕➖ 10 以内加减法</h2>
        <MathQuiz />
      </section>
    </div>
  );
}
