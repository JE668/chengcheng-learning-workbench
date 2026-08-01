'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * 根级客户端错误边界：捕获未被各段错误边界接住的异常
 * （例如登录页、根布局直接子页面的运行时错误），避免整页白屏。
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-moko-cream">
      <div className="text-6xl mb-4">🧸</div>
      <h2 className="text-2xl font-black text-moko-violet mb-2">哎呀，萌可迷路了～</h2>
      <p className="text-gray-500 mb-1 max-w-md">页面出了点小问题，可以重试一下，或回萌可小屋。</p>
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
