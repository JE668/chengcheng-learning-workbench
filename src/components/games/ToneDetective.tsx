'use client';

import { useEffect, useState } from 'react';
import { speakPinyin } from '@/lib/speak';

type Item = { syl: string; tone: 1 | 2 | 3 | 4; han: string; marked: string };

// 同一音节不同声调（mā/má/mǎ/mà）用于「同音辨调」训练。
// 每个条目的 han 必须与 tone 完全一致（TTS 借这个字发出正确声调）。
const POOL: Item[] = [
  // ── 第一声 ──
  { syl: 'ma', tone: 1, han: '妈', marked: 'mā' },
  { syl: 'ba', tone: 1, han: '八', marked: 'bā' },
  { syl: 'ta', tone: 1, han: '他', marked: 'tā' },
  { syl: 'ge', tone: 1, han: '哥', marked: 'gē' },
  { syl: 'shu', tone: 1, han: '书', marked: 'shū' },
  { syl: 'hua', tone: 1, han: '花', marked: 'huā' },
  { syl: 'tian', tone: 1, han: '天', marked: 'tiān' },
  { syl: 'gao', tone: 1, han: '高', marked: 'gāo' },
  { syl: 'xi', tone: 1, han: '西', marked: 'xī' },
  { syl: 'zhong', tone: 1, han: '中', marked: 'zhōng' },
  { syl: 'mao', tone: 1, han: '猫', marked: 'māo' },
  { syl: 'dong', tone: 1, han: '东', marked: 'dōng' },
  // ── 第二声 ──
  { syl: 'ma', tone: 2, han: '麻', marked: 'má' },
  { syl: 'ba', tone: 2, han: '拔', marked: 'bá' },
  { syl: 'ti', tone: 2, han: '提', marked: 'tí' },
  { syl: 'hu', tone: 2, han: '胡', marked: 'hú' },
  { syl: 'niu', tone: 2, han: '牛', marked: 'niú' },
  { syl: 'yang', tone: 2, han: '羊', marked: 'yáng' },
  { syl: 'lai', tone: 2, han: '来', marked: 'lái' },
  { syl: 'hong', tone: 2, han: '红', marked: 'hóng' },
  { syl: 'tian', tone: 2, han: '甜', marked: 'tián' },
  { syl: 'ren', tone: 2, han: '人', marked: 'rén' },
  { syl: 'yu', tone: 2, han: '鱼', marked: 'yú' },
  { syl: 'bai', tone: 2, han: '白', marked: 'bái' },
  // ── 第三声 ──
  { syl: 'ma', tone: 3, han: '马', marked: 'mǎ' },
  { syl: 'ba', tone: 3, han: '把', marked: 'bǎ' },
  { syl: 'ni', tone: 3, han: '你', marked: 'nǐ' },
  { syl: 'hao', tone: 3, han: '好', marked: 'hǎo' },
  { syl: 'shui', tone: 3, han: '水', marked: 'shuǐ' },
  { syl: 'gou', tone: 3, han: '狗', marked: 'gǒu' },
  { syl: 'wu', tone: 3, han: '五', marked: 'wǔ' },
  { syl: 'xiao', tone: 3, han: '小', marked: 'xiǎo' },
  { syl: 'jiu', tone: 3, han: '九', marked: 'jiǔ' },
  { syl: 'yan', tone: 3, han: '眼', marked: 'yǎn' },
  { syl: 'zao', tone: 3, han: '早', marked: 'zǎo' },
  { syl: 'lao', tone: 3, han: '老', marked: 'lǎo' },
  // ── 第四声 ──
  { syl: 'ma', tone: 4, han: '骂', marked: 'mà' },
  { syl: 'ba', tone: 4, han: '爸', marked: 'bà' },
  { syl: 'pa', tone: 4, han: '怕', marked: 'pà' },
  { syl: 'lu', tone: 4, han: '路', marked: 'lù' },
  { syl: 'da', tone: 4, han: '大', marked: 'dà' },
  { syl: 'yue', tone: 4, han: '月', marked: 'yuè' },
  { syl: 'shu', tone: 4, han: '树', marked: 'shù' },
  { syl: 'si', tone: 4, han: '四', marked: 'sì' },
  { syl: 'kan', tone: 4, han: '看', marked: 'kàn' },
  { syl: 'hua', tone: 4, han: '画', marked: 'huà' },
  { syl: 'cai', tone: 4, han: '菜', marked: 'cài' },
  { syl: 'dian', tone: 4, han: '电', marked: 'diàn' },
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
