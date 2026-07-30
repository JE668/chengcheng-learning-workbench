'use client';

import { useEffect, useState } from 'react';

const rounds = [
  { char: '大', options: ['大象', '小草', '太阳', '小河'], answer: '大象' },
  { char: '小', options: ['小猫', '大山', '天空', '森林'], answer: '小猫' },
  { char: '日', options: ['月亮', '太阳', '星星', '云朵'], answer: '太阳' },
  { char: '月', options: ['太阳', '月亮', '苹果', '花朵'], answer: '月亮' },
  { char: '水', options: ['火焰', '水滴', '石头', '土壤'], answer: '水滴' },
  { char: '木', options: ['树木', '汽车', '房屋', '书本'], answer: '树木' },
  { char: '口', options: ['嘴巴', '耳朵', '眼睛', '鼻子'], answer: '嘴巴' },
  { char: '手', options: ['手掌', '脚丫', '头发', '肚子'], answer: '手掌' },
];

export default function CharacterMatch({ onFinish }: { onFinish: (score: number) => void }) {
  const [order] = useState(() => [...rounds].sort(() => 0.5 - Math.random()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [time, setTime] = useState(90);
  const [done, setDone] = useState(false);
  const current = order[index];

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) finish(correct);
  }, [time, done, correct]);

  function finish(c: number) {
    setDone(true);
    onFinish(c * 15 + Math.max(0, time));
  }

  function choose(opt: string) {
    if (done) return;
    const ok = opt === current.answer;
    const nextCorrect = ok ? correct + 1 : correct;
    setCorrect(nextCorrect);
    if (index + 1 >= order.length) {
      finish(nextCorrect);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">{index + 1}/{order.length}</span>
      </div>
      <div className="text-8xl font-black text-moko-rose mb-2 drop-shadow">{current.char}</div>
      <p className="text-gray-500 mb-6">这个字代表什么？</p>
      <div className="grid grid-cols-2 gap-4">
        {current.options.map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className="py-4 rounded-2xl bg-gradient-to-r from-moko-blue to-moko-cyan text-white text-xl font-extrabold shadow hover:scale-105 transition"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
