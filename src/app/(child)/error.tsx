'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * (child) 路由段的客户端错误边界。
 * 捕获该段下任意页面/组件的运行时异常，
 * 把 Next 默认的 "Application error: a client-side exception has occurred"
 * 白屏，替换为可恢复的萌可友好页（带「重试」与「回萌可小屋」）。
 */
export default function ChildError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 便于在浏览器控制台定位真实报错
    console.error('[child segment error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-4">🧸</div>
      <h2 className="text-2xl font-black text-moko-violet mb-2">哎呀，萌可迷路了～</h2>
      <p className="text-gray-500 mb-1 max-w-md">这一页出了点小问题，可以重试一下，或回萌可小屋。</p>
      <p className="text-xs text-gray-400 mb-6 max-w-md">（如反复出现，请按 F12 把 Console 里的红色报错发我）</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-3 rounded-2xl bg-moko-violet text-white font-bold shadow hover:opacity-90 active:scale-95 transition"
        >
          ↻ 重试
        </button>
        <Link
          href="/home"
          className="px-5 py-3 rounded-2xl bg-white shadow border-2 border-moko-purple/20 text-moko-violet font-bold hover:bg-moko-purple/5"
        >
          🏠 回萌可小屋
        </Link>
      </div>
    </div>
  );
}
