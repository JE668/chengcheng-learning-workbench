'use client';

import Image from 'next/image';
import { ClayButton } from '@/components/design-system';

/** 🌙 晚安模式遮罩：暗屏 + 当前集信息 + 停止按钮。
 *  全宽 fixed，不依赖页面结构；pointer-events 只在卡片上，点遮罩即停。
 */
export function BedtimeOverlay({
  chapter,
  img,
  onStop,
}: {
  chapter: { emoji: string; title: string; mokoName: string } | null;
  img: string;
  onStop: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-gradient-to-b from-[#1a1a2e]/92 to-[#2d2d44]/96 flex items-center justify-center p-6"
      onClick={onStop}
    >
      <div className="max-w-md w-full text-center space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-6xl">🌙</div>
        <div className="text-white/60 text-sm font-bold tracking-widest">晚安故事</div>
        {chapter && (
          <>
            <div className="text-2xl font-black text-white leading-snug">
              {chapter.emoji} {chapter.title}
            </div>
            <div className="text-white/50 text-sm">{chapter.mokoName} 陪程程入睡</div>
            <div className="mx-auto w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20 opacity-90">
              <Image
                src={img || '/moko/lemei.webp'}
                alt={chapter.mokoName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
        <ClayButton variant="brand" size="lg" onClick={onStop}>
          ⏹ 停止，程程要睡觉啦
        </ClayButton>
        <div className="text-white/30 text-xs">连播中 · 点击屏幕任意处也可以停止</div>
      </div>
    </div>
  );
}
