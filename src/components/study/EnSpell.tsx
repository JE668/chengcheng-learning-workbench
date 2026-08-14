'use client';

import { useMemo, useState } from 'react';
import { ALL_EN_WORDS, type WordItem } from '@/lib/study-data';
import { speakEn, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';
import { useMistakeLogger } from '@/lib/mistake-logger';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 选出适合拼写的词（3-6 字母，不含特殊字符） */
const SPELLABLE = ALL_EN_WORDS.filter((w) => w.word.length >= 3 && w.word.length <= 6 && /^[a-z]+$/.test(w.word));

export function EnSpellModule() {
  const { record } = useModuleProgress('english', 'en-spell');
  const logM = useMistakeLogger();
  const [done, setDone] = useState(0);
  const [order] = useState(() => shuffle(SPELLABLE.map((_, i) => i)));
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [roundDone, setRoundDone] = useState(false);

  const item = SPELLABLE[order[pos % SPELLABLE.length]];

  // 选一个字母位置挖空（首字母不挖，降低难度）
  const blankIdx = useMemo(() => {
    const max = Math.min(item.word.length - 1, 4);
    return 1 + Math.floor(Math.random() * (max - 1));
  }, [item.word]);

  const display = item.word.split('').map((c, i) => (i === blankIdx ? '_' : c)).join(' ');

  // 干扰项：3 个与答案字形相近的字母
  const options = useMemo(() => {
    const answer = item.word[blankIdx];
    const pool = 'abcdefghijklmnopqrstuvwxyz'.replace(answer, '');
    const distractors = shuffle(pool.split('')).slice(0, 3);
    return shuffle([answer, ...distractors]);
  }, [item.word, blankIdx]);

  function pick(c: string) {
    if (picked) return;
    setPicked(c);
    const ok = c === item.word[blankIdx];
    if (ok) {
      praise();
      setCorrect((n) => n + 1);
    } else {
      logM({ subject: '英语', kind: '拼写', prompt: item.word, answer: item.word[blankIdx], wrong: c });
    }
    setTimeout(() => {
      const n = done + 1;
      setDone(n);
      if (n >= 8) {
        const stars = correct >= 7 ? 3 : correct >= 5 ? 2 : 1;
        record(stars);
        setRoundDone(true);
      } else {
        setPicked(null);
        setPos((p) => (p + 1) % SPELLABLE.length);
      }
    }, 1500);
  }

  if (roundDone) {
    return (
      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/40 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-black text-moko-violet mb-2">拼写练习完成！</h2>
        <p className="text-gray-500 mb-4">一共拼对了 {correct} / 8 个字母</p>
        <button onClick={() => { setRoundDone(false); setDone(0); setCorrect(0); setPicked(null); }}
          className="px-5 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
        >再来一轮</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-yellow to-moko-gold text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔤🍬</div>
        <h2 className="text-2xl font-black">英文拼写练习</h2>
        <p className="text-sm opacity-90 mt-1">甜心萌可：看 emoji 猜单词，选出少掉的那个字母吧！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
        <div className="text-5xl mb-3">{item.emoji}</div>
        <div className="text-lg font-bold text-gray-500 mb-1">{item.cn}</div>
        <div className="text-3xl font-black tracking-[0.2em] text-moko-violet mb-1">{display}</div>
        <div className="text-xs text-gray-400 mb-4">少了一个字母，点选正确的填上</div>
        <div className="flex justify-center gap-3">
          {options.map((c) => {
            const isAns = c === item.word[blankIdx];
            const isPicked = c === picked;
            let cls = 'w-12 h-12 rounded-2xl bg-moko-yellow/10 text-moko-violet border-2 border-moko-yellow/30 text-2xl font-black';
            if (picked) {
              if (isAns) cls = 'w-12 h-12 rounded-2xl bg-green-100 text-green-700 border-2 border-green-500 text-2xl font-black';
              else if (isPicked) cls = 'w-12 h-12 rounded-2xl bg-red-100 text-red-600 border-2 border-red-500 text-2xl font-black';
              else cls = 'w-12 h-12 rounded-2xl bg-gray-100 text-gray-300 border-2 border-gray-200 text-2xl font-black';
            }
            return (
              <button key={c} disabled={!!picked} onClick={() => pick(c)}
                className={`${cls} active:scale-95 transition`}
              >{c}</button>
            );
          })}
        </div>
        <button onClick={() => speakEn(item.word)} className="mt-4 text-xs px-3 py-1 rounded-full bg-moko-yellow text-white font-bold">
          🔊 听完整单词
        </button>
      </div>
      <p className="text-center text-xs text-gray-400">第 {done + 1} / 8 题（共 8 题一轮）</p>
    </div>
  );
}