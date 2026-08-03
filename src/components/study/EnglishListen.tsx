'use client';

import { useEffect, useState } from 'react';
import { speakEn, praise } from '@/lib/speak';
import { StudyQuiz, type QuizItem } from './StudyQuiz';

/* ============================ 听音选图 ============================ */
const PICS = [
  // 动物
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'fish', emoji: '🐟' },
  { word: 'bird', emoji: '🐦' },
  { word: 'pig', emoji: '🐷' },
  { word: 'cow', emoji: '🐮' },
  { word: 'duck', emoji: '🦆' },
  { word: 'rabbit', emoji: '🐰' },
  { word: 'monkey', emoji: '🐵' },
  { word: 'bear', emoji: '🐻' },
  { word: 'tiger', emoji: '🐯' },
  { word: 'panda', emoji: '🐼' },
  { word: 'elephant', emoji: '🐘' },
  { word: 'frog', emoji: '🐸' },
  { word: 'sheep', emoji: '🐑' },
  // 食物
  { word: 'apple', emoji: '🍎' },
  { word: 'banana', emoji: '🍌' },
  { word: 'orange', emoji: '🍊' },
  { word: 'grape', emoji: '🍇' },
  { word: 'egg', emoji: '🥚' },
  { word: 'milk', emoji: '🥛' },
  { word: 'bread', emoji: '🍞' },
  { word: 'cake', emoji: '🍰' },
  { word: 'ice cream', emoji: '🍦' },
  { word: 'candy', emoji: '🍬' },
  // 自然
  { word: 'sun', emoji: '☀️' },
  { word: 'moon', emoji: '🌙' },
  { word: 'star', emoji: '⭐' },
  { word: 'rain', emoji: '🌧️' },
  { word: 'tree', emoji: '🌳' },
  { word: 'flower', emoji: '🌻' },
  // 交通
  { word: 'car', emoji: '🚗' },
  { word: 'bus', emoji: '🚌' },
  { word: 'bike', emoji: '🚲' },
  { word: 'plane', emoji: '✈️' },
  { word: 'boat', emoji: '⛵' },
  { word: 'train', emoji: '🚂' },
  // 生活用品
  { word: 'book', emoji: '📖' },
  { word: 'ball', emoji: '⚽' },
  { word: 'cup', emoji: '🥤' },
  { word: 'hat', emoji: '🎩' },
  { word: 'shoe', emoji: '👟' },
  { word: 'bag', emoji: '🎒' },
  { word: 'pen', emoji: '🖊️' },
  { word: 'clock', emoji: '🕐' },
  { word: 'key', emoji: '🔑' },
  { word: 'door', emoji: '🚪' },
  { word: 'chair', emoji: '🪑' },
  { word: 'bed', emoji: '🛏️' },
  { word: 'house', emoji: '🏠' },
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
// 每组是「同韵不同首音」的最小对立对（bat/cat/hat），首音才是唯一区分点。
// 第三项显式写出首音，避免 sh/ch/th 这类双字母被误读成单个字母。
const GROUPS: [string, string, string][][] = [
  [['bat', '🦇', 'b'], ['cat', '🐱', 'c'], ['hat', '🎩', 'h']],
  [['pen', '🖊️', 'p'], ['hen', '🐔', 'h'], ['ten', '🔟', 't']],
  [['sun', '☀️', 's'], ['bun', '🥯', 'b'], ['run', '🏃', 'r']],
  [['dog', '🐶', 'd'], ['log', '🪵', 'l'], ['frog', '🐸', 'fr']],
  [['car', '🚗', 'c'], ['star', '⭐', 'st'], ['jar', '🫙', 'j']],
  [['book', '📖', 'b'], ['cook', '👨‍🍳', 'c'], ['hook', '🪝', 'h']],
  [['cake', '🍰', 'c'], ['lake', '🏞️', 'l'], ['snake', '🐍', 'sn']],
  [['bed', '🛏️', 'b'], ['red', '🟥', 'r'], ['bread', '🍞', 'br']],
  [['mouse', '🐭', 'm'], ['house', '🏠', 'h'], ['blouse', '👚', 'bl']],
  [['ball', '⚽', 'b'], ['wall', '🧱', 'w'], ['hall', '🏛️', 'h']],
  [['fish', '🐟', 'f'], ['dish', '🍽️', 'd'], ['wish', '🌠', 'w']],
  [['rain', '🌧️', 'r'], ['train', '🚂', 'tr'], ['chain', '⛓️', 'ch']],
  [['bee', '🐝', 'b'], ['tree', '🌳', 'tr'], ['three', '3️⃣', 'th']],
  [['goat', '🐐', 'g'], ['boat', '⛵', 'b'], ['coat', '🧥', 'c']],
  [['moon', '🌙', 'm'], ['spoon', '🥄', 'sp'], ['balloon', '🎈', 'b']],
  [['king', '🤴', 'k'], ['ring', '💍', 'r'], ['wing', '🪽', 'w']],
  [['box', '📦', 'b'], ['fox', '🦊', 'f'], ['rocks', '🪨', 'r']],
  [['cap', '🧢', 'c'], ['map', '🗺️', 'm'], ['nap', '😴', 'n']],
  [['light', '💡', 'l'], ['kite', '🪁', 'k'], ['night', '🌃', 'n']],
  [['duck', '🦆', 'd'], ['truck', '🚚', 'tr'], ['sock', '🧦', 's']],
];

function buildInitialSound(): QuizItem[] {
  const items: QuizItem[] = [];
  for (const group of GROUPS) {
    for (const [word, emoji, sound] of group) {
      const options = group.map(([, e]) => e).sort(() => 0.5 - Math.random());
      items.push({
        prompt: `🔊 哪个单词以 /${sound}/ 开头？`,
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
  { en: 'Turn around', zh: '转个圈', emoji: '🔄' },
  { en: 'Wave your hand', zh: '挥挥手', emoji: '👋' },
  { en: 'Stamp your feet', zh: '跺跺脚', emoji: '👣' },
  { en: 'Nod your head', zh: '点点头', emoji: '🙂' },
  { en: 'Shake your head', zh: '摇摇头', emoji: '🙅' },
  { en: 'Touch your ears', zh: '摸摸耳朵', emoji: '👂' },
  { en: 'Touch your mouth', zh: '摸摸嘴巴', emoji: '👄' },
  { en: 'Point to the door', zh: '指一指门', emoji: '🚪' },
  { en: 'Point to the window', zh: '指一指窗户', emoji: '🪟' },
  { en: 'Walk like a cat', zh: '学小猫走路', emoji: '🐱' },
  { en: 'Fly like a bird', zh: '学小鸟飞', emoji: '🐦' },
  { en: 'Swim like a fish', zh: '学小鱼游泳', emoji: '🐟' },
  { en: 'Smile', zh: '笑一笑', emoji: '😄' },
  { en: 'Count to five', zh: '数到五', emoji: '5️⃣' },
];

export function EnTprModule() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TPR.length));

  useEffect(() => {
    speakEn(TPR[idx].en, 0.7);
  }, [idx]);

  function next() {
    // 避免连续抽到同一条指令
    setIdx((cur) => {
      let n = cur;
      while (n === cur) n = Math.floor(Math.random() * TPR.length);
      return n;
    });
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
