'use client';

import Link from 'next/link';

/** 故事页头部：返回入口 + 标题 + 说明 + 捕捉券余额 + 捕捉进度条 */
export function StoryHeader({
  capturedCount,
  total,
  tickets,
}: {
  capturedCount: number;
  total: number;
  tickets: number;
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/games" className="text-moko-violet font-bold hover:underline">
          ‹ 游戏乐园
        </Link>
      </div>
      <h1 className="page-title mb-2">📜 萌可剧情</h1>
      <p className="text-gray-600 mb-2">
        跟着乐美公主的领航故事，一集一集认识并捕捉萌可。已捕捉
        <span className="font-black text-moko-rose"> {capturedCount} </span>/ {total} 只。
      </p>
      <p className="text-xs text-gray-500 mb-2">
        流程：听故事 → 答对小问题 → 捕捉萌可（第 2 集起还要用 1 张捕捉券）
      </p>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-moko-gold/15 text-moko-gold font-black px-3 py-1 text-sm">
          🎟️ 捕捉券 ×{tickets}
        </span>
        {tickets === 0 && (
          <span className="text-xs text-gray-500">
            做「萌可闯关」练习可攒捕捉券，用来解锁下一集
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all"
          style={{ width: `${(capturedCount / total) * 100}%` }}
        />
      </div>
    </>
  );
}
