'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ReactNode, useRef, useEffect, useState } from 'react';

/**
 * 页面过渡容器（**纯 CSS**，不再依赖 framer-motion）
 *
 * 为什么换掉：framer-motion 会被 webpack 提进 vendors 公共块，而根布局依赖该块，
 * 等于**每条路由首屏都要多背约 197KB（约 64KB gzip）**。这里原本只用到了
 * 「进入淡入上移」和「萌可飞过」两个补间，用 CSS keyframes 完全够用，且零 JS 开销。
 *
 * 行为差异（有意取舍）：失去了 AnimatePresence 的**离场**动画 —— 纯 CSS 无法在
 * 路由切换时延迟卸载旧页面。进入动画保留，观感基本一致。
 *
 * 关键帧见 globals.css 的 pageEnter / mokoFly。
 */

// 萌可头像列表（用于页面切换时的飞行装饰）
const MOKO_AVATARS = ['/moko/lemei.jpg', '/moko/love.jpg', '/moko/wisdom.jpg', '/moko/brave.jpg'];

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 萌可飞行状态
  const [flyingMoko, setFlyingMoko] = useState<string | null>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    // 「减少动态效果」在 effect 里判断（而不是渲染期读 window）：
    // 渲染期读会让服务端(false)与客户端结果不同，本身就可能造成 hydration 不一致。
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setFlyingMoko(MOKO_AVATARS[Math.floor(Math.random() * MOKO_AVATARS.length)]);
    const timer = window.setTimeout(() => setFlyingMoko(null), 1300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    // key=pathname 让容器在每次路由变化时重挂载，从而重播 .page-enter 的进入动画
    <div key={pathname} className="page-enter min-h-screen relative">
      {children}

      {/* 萌可飞行装饰（页面切换时）；关键帧见 globals.css 的 mokoFly */}
      {flyingMoko && (
        <Image
          src={flyingMoko}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          className="moko-fly fixed z-[9999] pointer-events-none w-14 h-14 rounded-full border-4 border-white/80 shadow-xl left-0 top-0"
        />
      )}
    </div>
  );
}
