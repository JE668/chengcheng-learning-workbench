'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useRef, useEffect, useState } from 'react';

/**
 * 页面过渡容器
 * 支持页面进入/退出动画，尊重用户「减少动态效果」偏好
 */

// 页面过渡变体
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  enter: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 1.02 },
};

const transition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// 萌可头像列表（用于页面切换时的飞行装饰）
const MOKO_AVATARS = ['/moko/lemei.jpg', '/moko/love.jpg', '/moko/wisdom.jpg', '/moko/brave.jpg'];

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // 萌可飞行状态
  const [flyingMoko, setFlyingMoko] = useState<string | null>(null);
  const [flyingKey, setFlyingKey] = useState(0);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== lastPath.current && !prefersReducedMotion) {
      // 页面切换时触发萌可飞行
      const moko = MOKO_AVATARS[Math.floor(Math.random() * MOKO_AVATARS.length)];
      setFlyingMoko(moko);
      setFlyingKey((k) => k + 1);
      // 1.5 秒后移除
      const timer = setTimeout(() => setFlyingMoko(null), 1500);
      lastPath.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname, prefersReducedMotion]);

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: 'initial',
        animate: 'enter',
        exit: 'exit',
        variants: pageVariants,
        transition,
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="min-h-screen relative"
        {...motionProps}
      >
        {children}

        {/* 萌可飞行装饰（页面切换时） */}
        {flyingMoko && !prefersReducedMotion && (
          <AnimatePresence>
            <motion.img
              key={flyingKey}
              src={flyingMoko}
              alt=""
              className="fixed z-[9999] pointer-events-none w-14 h-14 rounded-full border-4 border-white/80 shadow-xl"
              initial={{ x: '-20vw', y: '30vh', scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: ['−20vw', '50vw', '120vw'],
                y: ['30vh', '20vh', '40vh'],
                scale: [0, 1, 0.8],
                opacity: [0, 1, 0],
                rotate: [0, 720, 720],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ left: 0, top: 0 }}
            />
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
