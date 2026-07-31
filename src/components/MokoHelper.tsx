'use client';

import { useState, useEffect } from 'react';

/** 每个学科对应的萌可吉祥物（真实图片 + 鼓励语 + 口头禅） */
const MOKO: Record<string, { name: string; img: string; ring: string; bubble: string; sign: string }> = {
  语文: { name: '爱心萌可', img: '/moko/heartping.jpg', ring: 'ring-moko-rose/40', bubble: 'bg-moko-pink/10 border-moko-pink/30', sign: '啾～' },
  数学: { name: '正正萌可', img: '/moko/courageping.jpg', ring: 'ring-moko-blue/40', bubble: 'bg-moko-blue/10 border-moko-blue/30', sign: '哈哈！' },
  英语: { name: '唱唱萌可', img: '/moko/singping.jpg', ring: 'ring-moko-yellow/40', bubble: 'bg-moko-yellow/10 border-moko-yellow/30', sign: '啦啦啦～' },
};

const DEFAULT_TIPS: Record<string, string[]> = {
  语文: [
    '今天也要认认真真写好每一笔哦，爱心光波给你打气！',
    '读古诗的时候，跟着点读慢慢念，韵味就出来啦～',
    '遇到不认识的字，先猜一猜，再点「读一读」核对吧！',
  ],
  数学: [
    '把数字想成萌可小精灵，算起来就有趣多啦！',
    '分与合就像把萌可糖果分给好朋友，试试看？',
    '算错也没关系，再来一次就赢！',
  ],
  英语: [
    '大胆开口一起读，发音会越来越棒！',
    '点读绘本时，先听一遍，再自己小声跟读～',
    'RAZ 每天读几页，英语小耳朵就灵敏啦！',
  ],
};

export function MokoHelper({ subject, tips }: { subject: string; tips?: string[] }) {
  const m = MOKO[subject] ?? MOKO['语文'];
  const list = tips && tips.length ? tips : DEFAULT_TIPS[subject] ?? DEFAULT_TIPS['语文'];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 bg-white shadow-lg border-2 border-white/60 mb-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={m.img}
        alt={m.name}
        className={`w-14 h-14 rounded-full object-cover ring-4 ${m.ring} shadow flex-shrink-0`}
      />
      <div className={`flex-1 rounded-2xl px-3 py-2 border-2 ${m.bubble}`}>
        <div className="text-xs font-black text-gray-500 mb-0.5">{m.name} 说：</div>
        <div className="text-sm text-gray-700 font-medium leading-snug">
          {list[i]} <span className="font-black text-moko-violet">{m.sign}</span>
        </div>
      </div>
      <button
        onClick={() => setI((p) => (p + 1) % list.length)}
        className="text-xs px-3 py-2 rounded-full bg-gray-100 text-gray-600 font-bold active:scale-95 transition flex-shrink-0"
      >
        换一句
      </button>
    </div>
  );
}
