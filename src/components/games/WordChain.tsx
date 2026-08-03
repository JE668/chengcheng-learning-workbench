'use client';

import { useEffect, useState } from 'react';
import { speakZh } from '@/lib/speak';

// 词语接龙：尾字 → 新词首字。词库保证存在可接龙的词。
const WORDS = [
  '天空', '空气', '气球', '球队', '队员', '员工', '工人', '人口', '口才', '才华',
  '华丽', '丽人', '人民', '民主', '主人', '人生', '生活', '活动', '动力', '力量',
  '力气', '学生', '学校', '校园', '园林', '朋友', '友情', '情感', '感动', '火车',
  '车站', '站点', '点心', '心情', '晴朗', '月亮', '光明', '水果', '果汁', '汁液',
  '液体', '花朵', '花园', '丁香', '香味', '味道', '道路', '路口', '口红', '红色',
  '色彩', '彩虹', '桥梁', '梁柱', '柱子', '子女', '女生', '生命',
];

const byFirst: Record<string, string[]> = {};
for (const w of WORDS) {
  const c = w[0];
  (byFirst[c] ||= []).push(w);
}

function lastChar(w: string) {
  return w[w.length - 1];
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

function makeQuestion() {
  const candidates = WORDS.filter((w) => (byFirst[lastChar(w)] || []).filter((x) => x !== w).length > 0);
  const prompt = candidates[Math.floor(Math.random() * candidates.length)];
  const lc = lastChar(prompt);
  const corrects = byFirst[lc].filter((x) => x !== prompt);
  const correct = corrects[Math.floor(Math.random() * corrects.length)];
  const distractPool = WORDS.filter((w) => w !== correct && w[0] !== lc);
  const distractors = shuffle(distractPool).slice(0, 3);
  return { prompt, correct, choices: shuffle([correct, ...distractors]) };
}

export default function WordChain({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 70, 60][lv - 1];
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [q, setQ] = useState(makeQuestion);
  const [feedback, setFeedback] = useState<{ ok: boolean; correct?: string } | null>(null);

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
    speakZh(q.prompt, 0.8);
  }, [q]);

  function next() {
    setFeedback(null);
    setQ(makeQuestion());
  }

  function choose(w: string) {
    if (done || feedback) return;
    const ok = w === q.correct;
    if (ok) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
      setFeedback({ ok: true });
    } else {
      setStreak(0);
      setFeedback({ ok: false, correct: q.correct });
    }
    setTimeout(next, 950);
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-lg text-gray-600 mb-2">
        词语接龙：下一个词要以「<span className="font-extrabold text-moko-blue">{lastChar(q.prompt)}</span>」开头
      </p>
      <div className="text-4xl md:text-5xl font-black text-moko-violet mb-2 py-3">{q.prompt}</div>
      <button onClick={() => speakZh(q.prompt, 0.8)} className="mb-5 text-2xl" aria-label="朗读">🔊</button>
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((w) => (
          <button
            key={w}
            onClick={() => choose(w)}
            disabled={!!feedback}
            className={`py-5 rounded-2xl text-2xl font-black shadow transition ${
              feedback && w === q.correct
                ? 'bg-moko-mint text-white'
                : feedback && feedback.ok === false && w !== q.correct
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-moko-purple to-moko-violet text-white hover:scale-105'
            }`}
          >
            {w}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`text-lg font-bold mt-3 ${feedback.ok ? 'text-green-600' : 'text-red-500'}`}>
          {feedback.ok ? '✅ 接对啦！' : `正确接龙：${q.correct}`}
        </p>
      )}
    </div>
  );
}
