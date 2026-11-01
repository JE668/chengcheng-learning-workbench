'use client';

import { useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';
import { trackActivity } from '@/lib/activity';
import { ClayCard, ClayButton } from '@/components/design-system';

interface Picto {
  char: string;
  emoji: string;
  desc: string;
}

/* 高频象形字：用 emoji 当「画」、汉字当「字」，切换即演示演变（无需古文字图片资源） */
const PICTO: Picto[] = [
  {
    char: '日',
    emoji: '☀️',
    desc: '古人照着太阳的样子，画成一个圆、里面加一点，慢慢变成今天的「日」。',
  },
  { char: '月', emoji: '🌙', desc: '弯弯的月亮，画成一道弯钩，变成「月」。' },
  { char: '山', emoji: '⛰️', desc: '三座山峰连在一起，画成「山」。' },
  { char: '水', emoji: '💧', desc: '弯弯的流水，画成「水」。' },
  { char: '火', emoji: '🔥', desc: '火苗往上跳，画成「火」。' },
  { char: '木', emoji: '🌳', desc: '一棵树，上面是枝叶、下面是根，变成「木」。' },
  { char: '人', emoji: '🧍', desc: '侧面站着的人，画成「人」。' },
  { char: '口', emoji: '👄', desc: '张开的嘴巴，画成一个方框，变成「口」。' },
  { char: '田', emoji: '🌾', desc: '一块块田地，画成「田」。' },
  { char: '目', emoji: '👀', desc: '眼睛的形状，画成「目」。' },
];

export default function PictoPage() {
  const [idx, setIdx] = useState(0);
  const [showChar, setShowChar] = useState(false);
  const p = PICTO[idx];

  const play = () => {
    setShowChar(true);
    speakZh(p.char);
    trackActivity('picto');
  };
  const pick = (i: number) => {
    setIdx(i);
    setShowChar(false);
  };
  const next = () => pick((idx + 1) % PICTO.length);

  return (
    <div className="relative max-w-3xl mx-auto min-h-screen p-4 fade-up">
      <Link href="/study" className="text-sm text-moko-rose font-bold">
        ‹ 返回学习
      </Link>
      <h1 className="page-title mt-2 mb-1">🌟 象形字变变变</h1>
      <p className="text-gray-500 mb-4">
        很多汉字最早就是照着东西的样子画出来的，看看它们怎么从「画」变成「字」！
      </p>

      <ClayCard theme="violet" className="text-center py-6">
        <div className="relative h-44 flex items-center justify-center mb-4">
          <span
            className={`absolute text-8xl transition-all duration-700 ${showChar ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
          >
            {p.emoji}
          </span>
          <span
            className={`absolute text-8xl font-black text-moko-rose transition-all duration-700 ${showChar ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
          >
            {p.char}
          </span>
        </div>
        <p className="text-gray-600 mb-4 px-4">{p.desc}</p>
        <div className="flex justify-center gap-3">
          <ClayButton variant="brand" size="lg" onClick={play}>
            ✨ 看演变 + 听读音
          </ClayButton>
          <ClayButton variant="outline" size="lg" onClick={() => setShowChar(false)}>
            ↺ 回到画画
          </ClayButton>
        </div>
      </ClayCard>

      <h2 className="text-lg font-black text-moko-violet mt-6 mb-2">挑一个字看看：</h2>
      <div className="grid grid-cols-5 gap-2">
        {PICTO.map((x, i) => (
          <ClayButton
            key={x.char}
            variant={i === idx ? 'brand' : 'outline'}
            size="lg"
            onClick={() => pick(i)}
            className="py-3"
          >
            {x.char}
          </ClayButton>
        ))}
      </div>

      <div className="text-center mt-6">
        <ClayButton variant="brand" size="xl" onClick={next}>
          ➡ 下一个字
        </ClayButton>
      </div>
    </div>
  );
}
