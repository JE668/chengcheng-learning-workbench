'use client';

import { useState } from 'react';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';

type Prob = { seq: string[]; options: string[]; answer: number; say: string };

const PROBS: Prob[] = [
  { seq: ['🔴', '⭐', '🔴', '⭐', '🔴', '❓'], options: ['⭐', '🔴', '🔵'], answer: 0, say: '红星星红星星红，下一个是？' },
  { seq: ['🔵', '🔵', '🟡', '🟡', '🔵', '🔵', '❓'], options: ['🟡', '🔵', '⭐'], answer: 0, say: '蓝蓝黄黄蓝蓝，下一个是？' },
  { seq: ['🍎', '🍌', '🍎', '🍌', '🍎', '❓'], options: ['🍌', '🍎', '🍊'], answer: 0, say: '苹果香蕉苹果香蕉苹果，下一个？' },
  { seq: ['🌞', '🌙', '🌞', '🌙', '❓'], options: ['🌞', '🌙', '⭐'], answer: 0, say: '太阳月亮太阳月亮，下一个？' },
  { seq: ['2', '4', '6', '8', '❓'], options: ['10', '9', '12'], answer: 0, say: '二四六八，接下来是？' },
  { seq: ['5', '10', '15', '❓'], options: ['20', '25', '18'], answer: 0, say: '五、十、十五，接下来是？' },
  { seq: ['1', '3', '5', '7', '❓'], options: ['9', '8', '11'], answer: 0, say: '一三五七，接下来是？' },
  { seq: ['10', '20', '30', '❓'], options: ['40', '35', '50'], answer: 0, say: '十、二十、三十，接下来是？' },
  { seq: ['A', 'C', 'E', 'G', '❓'], options: ['I', 'H', 'J'], answer: 0, say: 'A C E G，接下来是？' },
  { seq: ['🐱', '🐶', '🐱', '🐶', '🐱', '❓'], options: ['🐶', '🐱', '🐰'], answer: 0, say: '猫狗猫狗猫，下一个？' },
  { seq: ['🌸', '🌸', '🌿', '🌸', '🌸', '❓'], options: ['🌿', '🌸', '🌞'], answer: 0, say: '花花草花花，下一个是？' },
  { seq: ['3', '6', '9', '❓'], options: ['12', '10', '15'], answer: 0, say: '三六九，接下来是？' },
];

export function FindPatternModule() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [picked, setPicked] = useState<number | null>(null);
  const logM = useMistakeLogger();
  const p = PROBS[idx];

  function pick(i: number) {
    if (result !== 'idle') return;
    setPicked(i);
    const ok = i === p.answer;
    setResult(ok ? 'right' : 'wrong');
    speakZh(ok ? '答对啦！你发现规律了！' : '再观察一下规律～');
    if (ok) {
      setTimeout(() => {
        setResult('idle');
        setPicked(null);
        setIdx((k) => (k + 1) % PROBS.length);
      }, 1400);
    } else {
      logM({ subject: '数学', kind: '找规律', prompt: p.say, answer: p.options[p.answer], wrong: p.options[i] });
      setTimeout(() => {
        setResult('idle');
        setPicked(null);
      }, 1600);
    }
  }

  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20">
      <p className="text-gray-600 mb-3">🔍 看清楚前面排好的顺序，找出规律，把「❓」换成正确的那一个吧！</p>
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        {p.seq.map((s, i) => (
          <span
            key={i}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl text-3xl font-black ${
              s === '❓' ? 'bg-moko-yellow/30 border-2 border-dashed border-moko-yellow' : 'bg-moko-blue/10'
            }`}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-3 flex-wrap">
        {p.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={result !== 'idle'}
            className={`w-16 h-16 rounded-2xl text-3xl font-black shadow active:scale-95 transition ${
              result !== 'idle' && i === p.answer
                ? 'bg-green-500 text-white'
                : result === 'wrong' && i === picked
                ? 'bg-red-400 text-white'
                : 'bg-moko-blue text-white'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {result !== 'idle' && (
        <p className={`text-center mt-4 font-bold ${result === 'right' ? 'text-green-600' : 'text-red-500'}`}>
          {result === 'right' ? '🎉 你找到规律啦！' : '💡 看看前面的顺序，再试一次～'}
        </p>
      )}
      <button
        onClick={() => speakZh(p.say)}
        className="mt-4 mx-auto block px-4 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
      >
        🔊 听题目
      </button>
    </div>
  );
}
