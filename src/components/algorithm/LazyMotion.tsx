'use client';

import { useEffect, useState } from 'react';

/**
 * 轻量级 motion 替代方案，用于「萌可算法」板块的高频动画，
 * 避免 framer-motion 被打包进多个 chunk。
 * 只保留算法板块实际用到的简单动画，否则用 CSS animation。
 */

// ============================================================================
// 简易 motion 封装 - 用 CSS 实现常用动画
// ============================================================================

interface SimpleMotionProps {
  children: React.ReactNode;
  className?: string;
  initial?: { opacity?: number; y?: number; scale?: number; x?: number };
  animate?: { opacity?: number; y?: number; scale?: number; x?: number };
  transition?: { duration?: number; delay?: number; repeat?: number };
  whileHover?: { scale?: number; rotate?: number };
  whileTap?: { scale?: number; rotate?: number };
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * 轻量 motion.div 替代：用 CSS transform/opacity 实现基础动画
 * 适合算法卡片的「入场淡入」「点击反馈」等简单场景
 */
export function SimpleMotion({
  children,
  className = '',
  initial = {},
  animate = {},
  transition = {},
  whileHover = {},
  whileTap = {},
  style,
  onClick,
}: SimpleMotionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duration = transition.duration ?? 0.3;
  const delay = transition.delay ?? 0;
  const repeat = transition.repeat ?? 0;

  const transform: string[] = [];
  let opacity = 1;
  let scale = 1;
  let translateY = 0;
  let translateX = 0;

  if (initial.opacity !== undefined) opacity = initial.opacity;
  if (initial.scale !== undefined) scale = initial.scale;
  if (initial.y !== undefined) translateY = initial.y;
  if (initial.x !== undefined) translateX = initial.x;

  // 如果已挂载，应用 animate 值
  if (mounted && Object.keys(animate).length > 0) {
    if (animate.opacity !== undefined) opacity = animate.opacity;
    if (animate.scale !== undefined) scale = animate.scale;
    if (animate.y !== undefined) translateY = animate.y;
    if (animate.x !== undefined) translateX = animate.x;
  }

  if (scale !== 1) transform.push(`scale(${scale})`);
  if (translateY !== 0) transform.push(`translateY(${translateY}px)`);
  if (translateX !== 0) transform.push(`translateX(${translateX}px)`);

  const hoverTransform = whileHover.scale !== undefined ? `scale(${whileHover.scale})` : undefined;
  const hoverRotate = whileHover.rotate !== undefined ? `rotate(${whileHover.rotate}deg)` : undefined;

  const tapTransform = whileTap.scale !== undefined ? `scale(${whileTap.scale})` : undefined;
  const tapRotate = whileTap.rotate !== undefined ? `rotate(${whileTap.rotate}deg)` : undefined;

  const hoverCls = hoverTransform || hoverRotate ? 'group hover:scale-[1.05]' : '';
  const tapCls = tapTransform || tapRotate ? 'active:scale-95' : '';

  return (
    <div
      className={`transition-all ${hoverCls} ${tapCls} ${className}`}
      style={{
        opacity,
        transform: transform.length > 0 ? transform.join(' ') : undefined,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        animationIterationCount: repeat === Infinity ? 'infinite' : repeat > 0 ? repeat : 1,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============================================================================
// 预置动画组件（CSS 驱动，零 JS 开销）
// ============================================================================

/** 淡入容器 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        animation: `fadeIn ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  );
}

/** 上下漂浮（萌可角色悬浮动画） */
export function FloatY({
  children,
  className = '',
  duration = 2,
  amplitude = 8,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  amplitude?: number;
}) {
  const animations = `
    @keyframes floatY { 
      0%, 100% { transform: translateY(0); } 
      50% { transform: translateY(-${amplitude}px); } 
    }
  `;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animations }} />
      <div
        className={className}
        style={{ animation: `floatY ${duration}s ease-in-out infinite` }}
      >
        {children}
      </div>
    </>
  );
}

/** 摇晃动画（用于错误提示） */
export function Shake({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const animations = `
    @keyframes shake { 
      0%, 100% { transform: translateX(0); } 
      25% { transform: translateX(-4px); } 
      75% { transform: translateX(4px); } 
    }
  `;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animations }} />
      <div
        className={className}
        style={{ animation: 'shake 0.4s ease-in-out' }}
      >
        {children}
      </div>
    </>
  );
}

/** 旋转（用于图标反馈） */
export function Spin({
  children,
  className = '',
  duration = 1,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div
      className={className}
      style={{ animation: `spin ${duration}s linear infinite` }}
    >
      {children}
    </div>
  );
}
