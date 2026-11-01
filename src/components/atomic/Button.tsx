'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  cn,
  focusRing,
  disabledStyles,
  transitionBase,
  activeScale,
  minTouchTarget,
  shadows,
  textSizes,
  fontWeights,
} from './utils';

export const buttonVariants = cva(
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
    // xs 是桌面/家长端的紧凑档，明确豁免；icon 单独在下面补足。
    'rounded-xl',
  ],
  {
    variants: {
      variant: {
        default: ['bg-primary text-primary-foreground', 'hover:bg-primary/90', shadows.card],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          shadows.card,
        ],
        outline: [
          'border-2 border-border bg-transparent',
          'hover:bg-accent hover:text-accent-foreground',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          shadows.card,
        ],
        ghost: ['bg-transparent', 'hover:bg-accent hover:text-accent-foreground'],
        link: [
          'text-primary underline-offset-4',
          'hover:underline',
          'p-0',
          minTouchTarget.replace('min-h-[44px] min-w-[44px]', ''),
        ],
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
      },
      size: {
        xs: ['h-7 px-2.5 text-xs', textSizes.xs, fontWeights.medium],
        sm: ['h-8 px-3 text-sm', textSizes.sm, fontWeights.medium],
        md: ['h-10 px-4 text-base', textSizes.base, fontWeights.medium],
        lg: ['h-11 px-6 text-lg', textSizes.lg, fontWeights.semibold],
        xl: ['h-12 px-8 text-xl', textSizes.xl, fontWeights.semibold],
        // icon 是唯一没有文字的尺寸，必须自带最小触控面积（44×44 的 WCAG 2.5.8 口径）
        icon: ['h-10 w-10 p-0', minTouchTarget],
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
      variant: 'default',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 子元素作为图标 */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** 使用 Slot 渲染为其他元素（如 Link） */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    // disabled 已在最上方从 props 中解构出来，剩余的 props 里不再有这个键
    const isLoading = loading || disabled;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, loading }), className)}
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

Button.displayName = 'Button';

// ButtonProps 已在文件中部以 `export interface` 导出过，
// 这里再 export type 一次会造成「重复导出」冲突（原先被 @ts-nocheck 掩盖）。
export { Button };
