'use client';

import type { CSSProperties } from 'react';

/**
 * 例题（ExampleVisuals）与练习演示（StepVisualDemo）共享的可视化原语。
 *
 * 背景：两个文件各自演化出近乎相同的底层件——pop/fadeUp 动画工具、
 * Chip 算式牌、Ghost「?」占位块、豆子/格子样式常量、同一批 keyframes
 * （StepVisualDemo 甚至逐字符重复定义了一遍 exPop）。编排层不动：
 * 例题页是「答对后一次性揭晓」，练习页是「每答对一步推进一步」（reveal
 * 分段，含防答案泄露时序），两者语义刻意不同，不合流。
 */

// ============================================================================
// keyframes（单一事实源；使用方各自注入 <style>，重复注入无害）
// ============================================================================

export const VISUAL_KEYFRAMES = `
  @keyframes exPop { 0% {opacity:0; transform:scale(.2)} 60% {opacity:1; transform:scale(1.12)} 100% {opacity:1; transform:scale(1)} }
  @keyframes exFadeUp { 0% {opacity:0; transform:translateY(8px)} 100% {opacity:1; transform:translateY(0)} }
  @keyframes exDissolve { to { opacity:0; transform: scale(.2) rotate(30deg); } }
  @keyframes exFlipOut { to { transform: rotateY(90deg); opacity:.2 } }
  @keyframes exFlipIn { from { transform: rotateY(-90deg); opacity:.2 } to { transform: rotateY(0); opacity:1 } }
  @keyframes exPulseSoft { 0%,100% { opacity:.45 } 50% { opacity:1 } }
  @keyframes exGlowRing { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0) } 50% { box-shadow: 0 0 0 7px rgba(16,185,129,.22) } }
  @keyframes exShake { 0%,100% { transform:translateX(0) } 15% { transform:translateX(-6px) } 30% { transform:translateX(5px) } 45% { transform:translateX(-4px) } 60% { transform:translateX(3px) } 75% { transform:translateX(-2px) } }
`;

// ── 动画工具 ─────────────────────────────────────────────────

export const pop = (delay = 0): CSSProperties => ({
  animation: 'exPop .55s cubic-bezier(.34,1.56,.64,1) both',
  animationDelay: `${delay}s`,
});

export const fadeUp = (delay = 0): CSSProperties => ({
  animation: 'exFadeUp .4s ease-out both',
  animationDelay: `${delay}s`,
});

/** SVG 路径「画出」动画（配合 pathLength=1） */
export const draw = (unlocked: boolean, delay = 0, dur = 0.8): CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: unlocked ? 0 : 1,
  transition: `stroke-dashoffset ${dur}s ease ${delay}s`,
});

// ── 样式常量 ─────────────────────────────────────────────────

/** 豆子圆点（十格阵 / 点点图通用） */
export const DOT_CLS = 'w-4 h-4 rounded-full';

/** 单个格子容器（十格阵格 / 点点图位） */
export const CELL_CLS =
  'relative w-6 h-6 rounded-md border border-moko-purple/20 bg-white flex items-center justify-center';

// ── 小组件 ─────────────────────────────────────────────────

const CHIP_CLS: Record<ChipTone, string> = {
  violet: 'bg-moko-purple/10 border-moko-purple/30 text-moko-violet',
  green: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  orange: 'bg-orange-50 border-orange-300 text-orange-600',
  blue: 'bg-sky-50 border-sky-300 text-sky-600',
};

export type ChipTone = 'violet' | 'green' | 'orange' | 'blue';

/** 步骤算式 chip：随揭晓节奏逐个弹出 */
export function Chip({
  text,
  delay = 0,
  tone = 'violet',
}: {
  text: string;
  delay?: number;
  tone?: ChipTone;
}) {
  return (
    <span
      className={`inline-block rounded-xl border-2 px-2.5 py-1 text-sm sm:text-base font-black ${CHIP_CLS[tone]}`}
      style={pop(delay)}
    >
      {text}
    </span>
  );
}

/** 虚线「?」占位块（等待揭晓） */
export function Ghost({
  size = 'md',
  style,
}: {
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}) {
  const sizeCls =
    size === 'lg'
      ? 'w-14 h-14 text-2xl rounded-2xl'
      : size === 'sm'
        ? 'w-9 h-9 text-lg rounded-xl'
        : 'w-11 h-11 text-xl rounded-xl';
  return (
    <span
      className={`inline-flex items-center justify-center border-2 border-dashed border-orange-300 bg-orange-50 text-orange-400 font-black select-none ${sizeCls}`}
      style={{ animation: 'exPulseSoft 1.6s ease-in-out infinite', ...style }}
    >
      ?
    </span>
  );
}
