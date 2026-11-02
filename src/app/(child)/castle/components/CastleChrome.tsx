'use client';

import { ClayCard } from '@/components/design-system';

/** 城堡页面骨架屏（state 未加载时模拟布局） */
export function CastleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-40 rounded-2xl bg-moko-purple/20 animate-pulse" />
        <div className="h-6 w-32 rounded-2xl bg-moko-purple/15 animate-pulse" />
      </div>
      <div className="mb-4 h-20 rounded-2xl bg-gradient-to-r from-red-50/50 to-orange-50/50 border-2 border-red-100/50 animate-pulse" />
      <ClayCard theme="gold" className="mb-4 animate-pulse">
        <div className="h-4 w-32 rounded-full bg-moko-purple/20 mb-4" />
        <div className="h-16 rounded-2xl bg-moko-gold/10 border-2 border-moko-gold/30 mb-3" />
        <div className="h-10 rounded-2xl" />
      </ClayCard>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 rounded-full bg-moko-purple/15 animate-pulse" />
        ))}
      </div>
      <ClayCard className="animate-pulse">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-28 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-moko-purple/15 mb-2" />
              <div className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </ClayCard>
      <p className="text-center text-moko-violet/40 text-sm mt-4 font-bold flex items-center justify-center gap-2">
        <span className="moko-loader">
          <span></span>
          <span></span>
          <span></span>
        </span>
        萌可城堡加载中…
      </p>
    </div>
  );
}

/** 🔔 惩罚通报：登录后首次加载时展示 */
export function PenaltyAlert({ alert, onClose }: { alert: string; onClose: () => void }) {
  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-4 shadow-lg animate-bounce-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-red-600 text-sm">城堡出事了！</div>
          <div className="text-sm text-red-700 mt-1">{alert}</div>
          <div className="text-xs text-gray-500 mt-2">
            完成「今日一练」或使用道具可恢复城堡安宁 ✨
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-600 text-lg leading-none"
          title="关闭"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
