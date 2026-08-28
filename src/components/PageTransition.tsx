'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

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

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? false : 'enter'}
        exit={prefersReducedMotion ? false : 'exit'}
        variants={pageVariants}
        transition={transition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}