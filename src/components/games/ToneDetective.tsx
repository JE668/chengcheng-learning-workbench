'use client';

import { useEffect, useState } from 'react';
import { speakPinyin } from '@/lib/speak';

type Item = { syl: string; tone: 1 | 2 | 3 | 4; han: string; marked: string };

// 同一音节不同声调（mā/má/mǎ/mà）用于「同音辨调」训练。
const POOL: Item[] = [
  { syl: 'ma', tone: 1, han: '妈', marked: 'mā' },
  { syl: 'ba', tone: 1, han: '八', marked: 'bā' },
  { syl: 'ta', tone: 1, han: '他', marked: 'tā' },
  { syl: 'ge', tone: 1, han: '哥', marked: 'gē' },
  { syl: 'ma', tone: 2, han: '麻', marked: 'má' },
  { syl: 'ba', tone: 2, han: '拔', marked: 'bá' },
  { syl: 'ti', tone: 2, han: '提', marked: 'tí' },
  { syl: 'hu', tone: 2, han: '胡', marked: 'hú' },
  { syl: 'ma', tone: 3, han: '马', marked: 'mǎ' },
  { syl: 'ba', tone: 3, han: '把', marked: 'bǎ' },
  { syl: 'ni', tone: 3, han: '你', marked: 'nǐ' },
  { syl: 'hao', tone: 3, han: '好', marked: 'hǎo' },
  { syl: 'ma', tone: 4, han: '骂', marked: 'mà' },
  { syl: 'ba', tone: 4, han: '爸', marked: 'bà' },
  { syl: 'pa', tone: 4, han: '怕', marked: 'pà' },
  { syl: 'lu', tone: 4, han: '路', marked: 'lù' },
];

const TONES = [
  { t: 1, mark: 'ā', label: '第一声' },
  { t: 2, mark: 'á', label: '第二声' },
  { t: 3, mark: 'ǎ', label: '第三声' },
  { t: 4, mark: 'à', label: '第四声' },
];

function pickItem(lv: number): Item {
  // 入门避开 mā/má/mǎ/mà 同音干扰；进阶/高手加入同音辨调，更考验耳朵。
  const pool = lv >= 2 ? POOL : POOL.filter((x) => !(x.syl === 'ma' && x.tone !== 1));
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ToneDetective({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 75, 70][lv - 1];
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [item, setItem] = useState<Item>(() => pickItem(lv));
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null);

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

  // 每题自动朗读一次目标音节（用同音汉字发音，声调天然正确）。
  useEffect(() => {
    speakPinyin(item.syl, item.tone, item.han);
  }, [item]);

  function next() {
    setFeedback(null);
    setItem(pickItem(lv));
  }

  function choose(t: number) {
    if (done || feedback) return;
    if (t === item.tone) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
      setFeedback({ ok: true });
    } else {
      setStreak(0);
      setFeedback({ ok: false });
    }
    setTimeout(next, 950);
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-lg text-gray-600 mb-2">👂 听一听，选一选这是第几声</p>
      <button
        onClick={() => speakPinyin(item.syl, item.tone, item.han)}
        className="mx-auto mb-3 w-20 h-20 rounded-full bg-moko-pink text-white text-4xl shadow hover:scale-105 transition flex items-center justify-center"
        aria-label="再听一次"
      >
        🔊
      </button>
      <div className="text-xl text-gray-500 mb-4">音节：{item.syl}</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {TONES.map((x) => (
          <button
            key={x.t}
            onClick={() => choose(x.t)}
            disabled={!!feedback}
            className={`py-5 rounded-2xl text-4xl font-black shadow transition ${
              feedback && x.t === item.tone
                ? 'bg-moko-mint text-white'
                : feedback && feedback.ok === false && x.t !== item.tone
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-moko-purple to-moko-violet text-white hover:scale-105'
            }`}
          >
            {x.mark}
            <div className="text-sm font-normal mt-1">{x.label}</div>
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`text-lg font-bold ${feedback.ok ? 'text-green-600' : 'text-red-500'}`}>
          {feedback.ok ? '✅ 答对啦！' : `再听一遍～正确答案：${item.marked}（${item.han}）`}
        </p>
      )}
    </div>
  );
}
