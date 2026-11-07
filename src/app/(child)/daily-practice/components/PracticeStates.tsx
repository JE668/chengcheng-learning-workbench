'use client';

import Link from 'next/link';
import { ClayCard } from '@/components/design-system';
import { EmptyState } from '@/components/EmptyState';

export function PracticeLoading() {
  return (
    <div className="max-w-2xl mx-auto p-10 flex flex-col items-center gap-3 text-moko-violet font-bold">
      <span className="moko-loader">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span>萌可正在准备今天的练习…</span>
    </div>
  );
}

export function PracticeLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <EmptyState emoji="😵" title="题目没能加载出来" desc={message} />
      <div className="text-center mt-6">
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-full bg-moko-pink text-white font-bold clay-btn clay-theme clay-pink transition"
        >
          🔄 重试
        </button>
      </div>
    </div>
  );
}

export function PracticeOfflineQueued() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ClayCard
        theme="gradient-violet-purple"
        className="text-center p-8 bg-gradient-to-br from-moko-violet to-moko-purple text-white"
      >
        <div className="text-6xl mb-3">📡</div>
        <h2 className="text-3xl font-black mb-2">打卡已离线保存</h2>
        <p className="text-lg opacity-90">
          现在是离线状态，你的打卡已安全保存在本机，联网后会自动提交、不影响连续天数～
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href="/home"
            className="px-6 py-3 rounded-full bg-white text-moko-violet font-black"
          >
            返回首页
          </Link>
        </div>
      </ClayCard>
    </div>
  );
}

export function PracticeEmpty() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <EmptyState
        emoji="🌙"
        title="今天暂时没有练习哦～"
        desc="去「萌可剧情」读个故事，或到城堡看看萌可吧！"
      />
    </div>
  );
}
