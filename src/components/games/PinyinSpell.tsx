'use client';

import { useEffect, useState } from 'react';
import { speakPinyin } from '@/lib/speak';

type Combo = { init: string; final: string; forms: string[]; han: string[] };

// 声母 + 韵母(带声调) → 拼出完整音节（如 b + ǎ → bǎ 把）
const COMBOS: Combo[] = [
  { init: 'b', final: 'a', forms: ['bā', 'bá', 'bǎ', 'bà'], han: ['八', '拔', '把', '爸'] },
  { init: 'm', final: 'a', forms: ['mā', 'má', 'mǎ', 'mà'], han: ['妈', '麻', '马', '骂'] },
  { init: 'p', final: 'a', forms: ['pā', 'pá', 'pǎ', 'pà'], han: ['趴', '爬', '怕', '怕'] },
  { init: 'h', final: 'u', forms: ['hū', 'hú', 'hǔ', 'hù'], han: ['呼', '胡', '虎', '户'] },
  { init: 'g', final: 'e', forms: ['gē', 'gé', 'gě', 'gè'], han: ['哥', '格', '葛', '个'] },
  { init: 'l', final: 'i', forms: ['lī', 'lí', 'lǐ', 'lì'], han: ['哩', '梨', '里', '立'] },
  { init: 't', final: 'u', forms: ['tū', 'tú', 'tǔ', 'tù'], han: ['突', '图', '土', '兔'] },
  { init: 'k', final: 'ou', forms: ['kōu', 'kóu', 'kǒu', 'kòu'], han: ['抠', '口', '扣', '扣'] },
  { init: 'f', final: 'an', forms: ['fān', 'fán', 'fǎn', 'fàn'], han: ['翻', '凡', '反', '饭'] },
  { init: 'd', final: 'ing', forms: ['dīng', 'díng', 'dǐng', 'dìng'], han: ['丁', '丁', '顶', '定'] },
  { init: 'sh', final: 'ang', forms: ['shāng', 'sháng', 'shǎng', 'shàng'], han: ['伤', '尝', '赏', '上'] },
  { init: 'ch', final: 'eng', forms: ['chēng', 'chéng', 'chěng', 'chèng'], han: ['称', '成', '逞', '秤'] },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

type Q = { init: string; final: string; forms: string[]; han: string[]; t: number; target: string; toneFinal: string; options: string[] };

function makeQ(): Q {
  const c = COMBOS[Math.floor(Math.random() * COMBOS.length)];
  const t = Math.floor(Math.random() * 4);
  const target = c.forms[t];
  const toneFinal = target.slice(c.init.length); // 带声调的韵母
  return { ...c, t, target, toneFinal, options: shuffle(c.forms) };
}

// 拼音拼拼拼：把「声母 + 带声调的韵母」拼成一个完整音节（拼 + 声调组合练习）。
export default function PinyinSpell({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 75, 70][lv - 1];
  const [q, setQ] = useState<Q>(makeQ);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) {
      setDone(true);
      onFinish(score);
    }
  }, [time, done, score, onFinish]);

  useEffect(() => {
    speakPinyin(q.target, q.t + 1, q.han[q.t]);
  }, [q]);

  function pick(form: string) {
    if (done) return;
    if (form === q.target) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
    } else {
      setStreak(0);
    }
    setQ(makeQ());
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-base text-gray-500 mb-3">声母 ＋ 韵母(带声调) ＝ 拼出一个音节</p>
      <div className="text-3xl md:text-4xl font-black text-moko-violet mb-2 py-3">
        {q.init} ＋ {q.toneFinal} ＝ ?
      </div>
      <button onClick={() => speakPinyin(q.target, q.t + 1, q.han[q.t])} className="mb-4 text-3xl" aria-label="听一听">
        🔊
      </button>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((f) => (
          <button
            key={f}
            onClick={() => pick(f)}
            className="py-5 rounded-2xl bg-gradient-to-r from-moko-purple to-moko-violet text-white text-3xl font-black shadow hover:scale-105 transition"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
