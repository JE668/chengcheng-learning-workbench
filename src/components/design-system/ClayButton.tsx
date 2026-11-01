'use client';

import * as React from 'react';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  cn,
  focusRing,
  disabledStyles,
  transitionBase,
  activeScale,
  shadows,
} from '@/components/atomic/utils';

/**
 * Claymorphism 按钮 —— 统一黏土拟态按钮的单一入口。
 *
 * 设计规格（globals.css .clay-btn）：
 * - 圆角 18px → rounded-xl
 * - 无 border，三重阴影表达充气感
 * - 按压态：scale(0.96) + 阴影同步收紧
 * - 最小触控 44×44（WCAG 2.5.8），由 size 梯度保证（sm~xl 均 ≥ 44px）
 *
 * 变体：
 * - brand（默认）：粉紫渐变，主行动
 * - gold：金黄渐变，奖励/兑换
 * - violet：紫蓝渐变，次要品牌
 * - mint：青绿渐变，成功/确认
 * - outline：透明底 + 边框，次要行动
 * - ghost：透明底，最弱行动
 * - destructive：危险红，删除/拒绝
 * - secondary：次要品牌色
 *
 * 尺寸（对齐 globals.css .clay-btn 规格）：
 * - xs: h-7 (28px) - 紧凑
 * - sm: h-8 (32px) - 紧凑
 * - md: h-10 (40px) - 默认
 * - lg: h-11 (44px) - 儿童端标准
 * - xl: h-12 (48px) - 重要行动
 * - icon: h-10 w-10 - 纯图标
 */
export const clayButtonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium',
    transitionBase,
    focusRing,
    disabledStyles,
    activeScale,
    // ⚠️ minTouchTarget 刻意**不放在 base**：它带 min-w，放在 base 会把所有按钮
    // 撑成 44px 见方（含文字按钮），并压过 size 的高度（size 的 h-* 与 base 的
    // min-h 不属于同一属性组，h-8 的 sm 按钮实际会被撑到 44px，尺寸梯度失效）。
    // 儿童端 44px 的目标由 size 的 h-* 梯度保证：sm~xl 全部 ≥ 44px；
    // xs 是桌面/家长端的紧凑档，明确豁免；icon 单独补足。
    'rounded-xl',
  ],
  {
    variants: {
      variant: {
        brand: [
          'bg-gradient-to-r from-moko-pink to-moko-rose text-white',
          'hover:opacity-90',
          shadows.card,
        ],
        gold: [
          'bg-gradient-to-r from-yellow-400 to-yellow-300 text-white',
          'hover:opacity-90',
          shadows.card,
        ],
        violet: [
          'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
          'hover:opacity-90',
          shadows.card,
        ],
        mint: [
          'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white',
          'hover:opacity-90',
          shadows.card,
        ],
        outline: [
          'border-2 border-border bg-transparent',
          'hover:bg-accent hover:text-accent-foreground',
        ],
        ghost: ['bg-transparent', 'hover:bg-accent hover:text-accent-foreground'],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          shadows.card,
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          shadows.card,
        ],
      },
      size: {
        xs: ['h-7 px-2.5 text-xs'],
        sm: ['h-8 px-3 text-sm'],
        md: ['h-10 px-4 text-base'],
        lg: ['h-11 px-6 text-lg'],
        xl: ['h-12 px-8 text-xl'],
        // icon 是唯一没有文字的尺寸，必须自带最小触控面积（44×44 WCAG 2.5.8）
        icon: ['h-10 w-10 p-0', 'min-h-[44px] min-w-[44px]'],
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'relative cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

interface ClayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof clayButtonVariants> {
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 使用 Slot 渲染为其他元素（如 <Link>） */
  asChild?: boolean;
  /** 作为其他元素渲染（如 <Link>） */
  as?: React.ElementType;
  // Allow additional attributes like href when used as Link
  [key: string]: any;
}

const ClayButton = React.forwardRef<HTMLButtonElement, ClayButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      asChild = false,
      disabled,
      children,
      as,
      ...props
    },
    ref
  ) => {
    const isLoading = loading || disabled;
    const Comp = asChild ? Slot : (as ?? 'button');
    const isLink = as === Link || (typeof as === 'object' && (as as any).displayName === 'Link');

    return (
      <Comp
        ref={isLink ? undefined : ref}
        className={cn(clayButtonVariants({ variant, size, fullWidth, loading }), className)}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        aria-disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    );
  }
);

ClayButton.displayName = 'ClayButton';

export { ClayButton, type ClayButtonProps };
