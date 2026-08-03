'use client';

import { useEffect, useState } from 'react';
import { speakEn, praise } from '@/lib/speak';
import { StudyQuiz, type QuizItem } from './StudyQuiz';

/* ============================ 听音选图 ============================ */
const PICS = [
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'fish', emoji: '🐟' },
  { word: 'apple', emoji: '🍎' },
  { word: 'sun', emoji: '☀️' },
  { word: 'book', emoji: '📖' },
  { word: 'ball', emoji: '⚽' },
  { word: 'car', emoji: '🚗' },
  { word: 'bird', emoji: '🐦' },
  { word: 'star', emoji: '⭐' },
  { word: 'egg', emoji: '🥚' },
  { word: 'cup', emoji: '🥤' },
];

function buildListenPic(): QuizItem[] {
  return PICS.map((p) => {
    const others = PICS.filter((x) => x.emoji !== p.emoji);
    const distract: string[] = [];
    while (distract.length < 3) {
      const d = others[Math.floor(Math.random() * others.length)].emoji;
      if (!distract.includes(d)) distract.push(d);
    }
    const options = [p.emoji, ...distract].sort(() => 0.5 - Math.random());
    return {
      prompt: '🔊 听到什么，选对应的图片',
      speakEn: p.word,
      options,
      answer: p.emoji,
      kind: '听音选图',
    };
  });
}

export function EnListenPicModule() {
  const items = buildListenPic();
  return (
    <StudyQuiz
      items={items}
      subject="英语"
      color="bg-moko-yellow"
      textColor="text-moko-yellow"
      autoSpeak="en"
      moduleKey="en-listen-pic"
      roundSize={8}
    />
  );
}

/* ============================ 首音辨析 ============================ */
const GROUPS: [string, string][][] = [
  [['bat', '🦇'], ['cat', '🐱'], ['hat', '🎩']],
  [['pen', '🖊️'], ['pig', '🐷'], ['pin', '📌']],
  [['sun', '☀️'], ['sock', '🧦'], ['bus', '🚌']],
  [['dog', '🐶'], ['door', '🚪'], ['duck', '🦆']],
  [['key', '🔑'], ['cake', '🍰'], ['car', '🚗']],
  [['bee', '🐝'], ['book', '📖'], ['bowl', '🥣']],
];

function buildInitialSound(): QuizItem[] {
  const items: QuizItem[] = [];
  for (const group of GROUPS) {
    for (const [word, emoji] of group) {
      const options = group.map(([, e]) => e).sort(() => 0.5 - Math.random());
      items.push({
        prompt: `🔊 哪个单词以 /${word[0]}/ 开头？`,
        speakEn: word,
        options,
        answer: emoji,
        kind: '首音辨析',
      });
    }
  }
  return items;
}

export function EnInitialSoundModule() {
  const items = buildInitialSound();
  return (
    <StudyQuiz
      items={items}
      subject="英语"
      color="bg-moko-yellow"
      textColor="text-moko-yellow"
      autoSpeak="en"
      moduleKey="en-initial"
      roundSize={8}
    />
  );
}

/* ============================ TPR 动作指令 ============================ */
const TPR = [
  { en: 'Stand up', zh: '站起来', emoji: '🧍' },
  { en: 'Sit down', zh: '坐下', emoji: '🪑' },
  { en: 'Open your book', zh: '打开书', emoji: '📖' },
  { en: 'Close your eyes', zh: '闭上眼睛', emoji: '😌' },
  { en: 'Raise your hand', zh: '举起手', emoji: '✋' },
  { en: 'Touch your nose', zh: '摸摸鼻子', emoji: '👃' },
  { en: 'Clap your hands', zh: '拍拍手', emoji: '👏' },
  { en: 'Jump', zh: '跳一跳', emoji: '🦘' },
];

export function EnTprModule() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TPR.length));

  useEffect(() => {
    speakEn(TPR[idx].en, 0.7);
  }, [idx]);

  function next() {
    setIdx(Math.floor(Math.random() * TPR.length));
  }

  function doneAction() {
    praise();
    setTimeout(next, 900);
  }

  const cur = TPR[idx];
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-6 bg-white shadow-xl text-center">
        <div className="text-6xl mb-3">{cur.emoji}</div>
        <div className="text-2xl font-black text-moko-yellow mb-1">{cur.en}</div>
        <div className="text-gray-500 mb-4">中文：{cur.zh}（听完英文，照着做一做吧！）</div>
        <button
          onClick={() => speakEn(cur.en, 0.7)}
          className="px-6 py-2 rounded-full bg-moko-yellow text-white font-bold mr-2 active:scale-95 transition"
        >
          🔊 再听一次
        </button>
        <button
          onClick={doneAction}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-moko-rose to-moko-pink text-white font-bold active:scale-95 transition"
        >
          我做对啦！✅
        </button>
      </div>
      <p className="text-center text-sm text-gray-400">TPR 全身反应法：听英语做动作，记得更牢～</p>
    </div>
  );
}
