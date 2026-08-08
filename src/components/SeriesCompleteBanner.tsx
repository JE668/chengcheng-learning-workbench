'use client';

import { useState } from 'react';

/**
 * 系列集齐庆祝横幅 —— 当小朋友把图鉴里「整个系列」的萌可都捕捉齐时，
 * 在城堡图鉴里点亮一条金色庆祝卡：列出这一系列的全部萌可，配一句庆祝文案。
 * 只做展示性庆祝 + 交互展开/收起，情绪价值高、零后端改动。
 */
export interface SeriesMember {
  img?: string;
  emoji: string;
  name: string;
}

interface Props {
  label: string; // 系列名（如「皇室萌可」）
  emoji: string; // 系列 emoji
  members: SeriesMember[]; // 该系列已收集萌可（全齐时全部 owned，可全列）
}

/** 每系列一句庆祝文案（按 code 风格，未知系列有兜底） */
const CHEERS: Record<string, string> = {
  royal: '皇家萌可都来城堡啦，仪仗队为你列队！',
  mo: '魔方萌可整整齐齐排好队，魔法城堡更热闹！',
  key: '知识钥匙集齐啦，想开哪扇门都开得了！',
  jewel: '宝石矿洞被你掏空啦，闪闪发光一片！',
  sweetie: '甜心系列的香味充满城堡，香甜四溢！',
  star: '流星一家都许过愿啦，愿望都会成真！',
  princess: '公主们盛装出席，城堡变成了舞会！',
  prince: '王子们举剑致意，勇敢的守卫就位！',
  villain: '连调皮鬼们都乖乖回家了，好厉害！',
  legend: '传奇降世，这些都是传说里的萌可！',
  guide: '引导天使们齐在，乐美也会夸你棒！',
};

const DEFAULT_CHEER = '你集齐了这一整个系列，城堡里热闹极了！';

export function SeriesCompleteBanner({ label, emoji, members, catKey }: Props & { catKey?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-3xl p-4 border-2 border-moko-gold/60 bg-gradient-to-br from-moko-gold/15 via-amber-50 to-moko-yellow/15 shadow-lg moko-capture-glow`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="text-3xl">{emoji}</span>
        <span className="flex-1">
          <span className="block font-black text-moko-violet text-lg">
            👑 {label}集齐啦！
          </span>
          <span className="block text-xs text-gray-600 mt-0.5">{CHEERS[catKey ?? ''] ?? DEFAULT_CHEER}</span>
        </span>
        <span className="text-moko-gold text-xl font-black">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {members.map((m) => (
            <div
              key={m.name}
              className="flex flex-col items-center w-16 bg-white/70 rounded-2xl p-2 shadow-sm"
            >
              {m.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.img} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 flex items-center justify-center text-2xl">{m.emoji}</span>
              )}
              <span className="text-[10px] text-moko-violet font-bold mt-1 text-center leading-tight">{m.name}</span>
            </div>
          ))}
          <span className="text-2xl px-2">🎊</span>
        </div>
      )}
    </div>
  );
}