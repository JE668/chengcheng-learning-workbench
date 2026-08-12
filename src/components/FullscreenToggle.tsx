'use client';

import { useEffect, useState } from 'react';

/**
 * 全屏 / 横屏切换按钮。
 * - 安卓 Chrome（小米平板等）：requestFullscreen 进入沉浸模式，隐藏状态栏与导航栏；
 *   进入后尝试锁定横屏（screen.orientation.lock），让平板横着用、不留状态栏。
 * - iOS / 桌面：Fullscreen API 不可用或有限，按钮自动降级（点了无明显副作用）。
 */
export default function FullscreenToggle() {
  const [isFs, setIsFs] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    if (typeof document.documentElement.requestFullscreen !== 'function') setSupported(false);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggle() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        // 全屏下才允许锁定横屏（安卓 Chrome 行为）；失败不影响全屏本身
        // screen.orientation.lock 非标准 TS DOM 类型，运行时在支持的浏览器上存在
        try {
          await (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape');
        } catch {
          /* 不支持或已拒绝：忽略，保持全屏即可 */
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* 浏览器不支持全屏：静默降级 */
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      aria-label={isFs ? '退出全屏' : '进入全屏'}
      title={isFs ? '退出全屏' : '全屏（隐藏状态栏 · 横屏）'}
      className="fixed bottom-4 right-4 z-[60] w-12 h-12 rounded-full bg-white/85 shadow-lg backdrop-blur flex items-center justify-center text-2xl active:scale-95 transition tap"
    >
      {isFs ? '⤢' : '⛶'}
    </button>
  );
}
