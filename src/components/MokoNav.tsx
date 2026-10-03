'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { MokoNavEntry } from '@/lib/moko-nav-mapping';

/**
 * 萌可陪伴式导航项
 * 用萌可插画替代 emoji，点击有弹跳动画
 */
export function MokoNavBtn({
  entry,
  active,
  onNavigate,
}: {
  entry: MokoNavEntry;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      aria-label={entry.label}
      className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 rounded-2xl transition tap group ${
        active ? 'bg-white/90 text-moko-rose shadow-lg scale-105' : 'text-white/90 hover:bg-white/15'
      }`}
    >
      {/* 萌可头像圆：悬停放大+摇摆原本由 framer-motion 的 whileHover 驱动，
          现改为纯 CSS —— 见 globals.css 的 .group:hover .nav-avatar + navWobble 关键帧。
          注意外层 Link 已经带了 Tailwind 的 group 类。 */}
      <div
        className="nav-avatar relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shadow border-2 mb-0.5"
        style={{
          borderColor: active ? '#fff' : 'rgba(255,255,255,0.3)',
        }}
      >
        <Image
          src={entry.moko.img}
          alt={entry.moko.name}
          fill
          className="object-cover"
          sizes="40px"
          priority
        />
      </div>
      <span className={`text-[10px] leading-tight mt-0.5 font-bold truncate max-w-full ${active ? 'text-moko-rose' : ''}`}>
        {entry.label}
      </span>
      {/* 活跃指示器（.pop-in = 原 initial/animate 的 scale 0→1） */}
      {active && <div className="pop-in absolute -bottom-1 w-1 h-1 rounded-full bg-moko-rose" />}
    </Link>
  );
}

/** 更多按钮（带萌可表情） */
export function MokoMoreBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="更多"
      className="flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 rounded-2xl text-white/90 hover:bg-white/15 tap group"
    >
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center text-lg group-hover:bg-white/30 transition">
        <span className="tracking-tighter text-sm font-black">···</span>
      </div>
      <span className="text-[10px] leading-tight mt-0.5 font-bold">更多</span>
    </button>
  );
}
