'use client';

import { FadeIn, FloatY } from '@/components/algorithm/LazyMotion';

interface MantraCardProps {
  emoji: string;
  mantra: string;
  mokoName: string;
  mokoImg: string;
  showLabel?: boolean;
}

/**
 * 口诀卡片 - 展示计算方法的核心口诀，配合萌可角色
 * 在算法练习和学习页中使用
 */
export function MantraCard({ emoji, mantra, mokoName, mokoImg, showLabel = true }: MantraCardProps) {
  return (
    <FadeIn delay={0.1} duration={0.3}>
      <div className="bg-gradient-to-br from-moko-purple/10 to-moko-violet/10 rounded-3xl p-5 border-2 border-moko-purple/20 shadow-lg">
        <div className="flex items-start gap-4">
          {/* 萌可角色（悬浮动画） */}
          <div className="flex-shrink-0">
            <FloatY duration={4} amplitude={3}>
              <img
                src={mokoImg}
                alt={mokoName}
                className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            </FloatY>
          </div>

          {/* 口诀内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{emoji}</span>
              <h3 className="text-lg font-black text-moko-violet">速算口诀</h3>
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-line">{mantra}</p>
            <p className="text-xs text-moko-purple/60 font-bold mt-2">—— {mokoName}</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
