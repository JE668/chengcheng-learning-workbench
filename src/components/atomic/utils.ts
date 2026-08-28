import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 通用类名合并工具
 * 结合 clsx + tailwind-merge，处理条件类名和 Tailwind 冲突
 */
export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

/**
 * Focus 可见样式 - 统一无障碍焦点环
 */
export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';

/**
 * 禁用状态样式
 */
export const disabledStyles = 'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * 过渡动画基础类
 */
export const transitionBase = 'transition-colors duration-200 ease-in-out';
export const transitionTransform = 'transition-transform duration-200 ease-out';
export const transitionAll = 'transition-all duration-200 ease-in-out';

/**
 * 交互缩放反馈
 */
export const activeScale = 'active:scale-[0.98]';

/**
 * 最小触控目标 (44x44px)
 */
export const minTouchTarget = 'min-h-[44px] min-w-[44px]';

/**
 * 阴影预设
 */
export const shadows = {
  card: 'shadow-[0_4px_12px_-2px_rgb(0_0_0/0.08)]',
  cardHover: 'shadow-[0_8px_24px_-4px_rgb(0_0_0/0.12)]',
  float: 'shadow-[0_12px_24px_-4px_rgb(0_0_0/0.12)]',
  modal: 'shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)]',
  glow: 'shadow-[0_0_20px_-4px_currentColor]',
  inner: 'shadow-inner',
} as const;

/**
 * 圆角预设
 */
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

/**
 * 字体大小预设
 */
export const textSizes = {
  xs: 'text-xs leading-4',
  sm: 'text-sm leading-5',
  base: 'text-base leading-6',
  lg: 'text-lg leading-6',
  xl: 'text-xl leading-6',
  '2xl': 'text-2xl leading-7',
  '3xl': 'text-3xl leading-8',
  '4xl': 'text-4xl leading-9',
} as const;

/**
 * 字重预设
 */
export const fontWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
} as const;

/**
 * 响应式文本大小
 */
export const responsiveText = {
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-3xl sm:text-4xl',
  '4xl': 'text-4xl sm:text-5xl',
} as const;