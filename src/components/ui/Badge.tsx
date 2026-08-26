'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 语义色调 */
  tone?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** 变体 */
  variant?: 'solid' | 'soft' | 'outline' | 'dot';
  /** 是否可点击 */
  clickable?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 是否可关闭 */
  dismissible?: boolean;
  onDismiss?: () => void;
}

const baseStyles = `
  inline-flex items-center font-semibold transition-all duration-200
  select-none whitespace-nowrap
`;

const toneStyles = {
  default: {
    solid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
    soft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
    outline: 'border-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    dot: 'text-gray-700 dark:text-gray-300',
  },
  primary: {
    solid: 'bg-primary text-white',
    soft: 'bg-primary/10 text-primary',
    outline: 'border-2 border-primary text-primary',
    dot: 'text-primary',
  },
  secondary: {
    solid: 'bg-secondary text-white',
    soft: 'bg-secondary/10 text-secondary',
    outline: 'border-2 border-secondary text-secondary',
    dot: 'text-secondary',
  },
  accent: {
    solid: 'bg-accent text-gray-900',
    soft: 'bg-accent/10 text-accent',
    outline: 'border-2 border-accent text-accent',
    dot: 'text-accent',
  },
  success: {
    solid: 'bg-success text-white',
    soft: 'bg-success/10 text-success',
    outline: 'border-2 border-success text-success',
    dot: 'text-success',
  },
  warning: {
    solid: 'bg-warning text-white',
    soft: 'bg-warning/10 text-warning',
    outline: 'border-2 border-warning text-warning',
    dot: 'text-warning',
  },
  danger: {
    solid: 'bg-danger text-white',
    soft: 'bg-danger/10 text-danger',
    outline: 'border-2 border-danger text-danger',
    dot: 'text-danger',
  },
  info: {
    solid: 'bg-info text-white',
    soft: 'bg-info/10 text-info',
    outline: 'border-2 border-info text-info',
    dot: 'text-info',
  },
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizeStyles = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const dotSizeStyles = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      tone = 'default',
      size = 'md',
      variant = 'solid',
      clickable = false,
      leftIcon,
      rightIcon,
      dismissible = false,
      onDismiss,
      className,
      ...props
    },
    ref
  ) => {
    const styles = toneStyles[tone][variant];

    if (variant === 'dot') {
      return (
        <span
          ref={ref}
          className={twMerge(
            clsx(
              'inline-flex items-center gap-1.5',
              styles,
              sizeStyles[size],
              clickable && 'cursor-pointer hover:opacity-80',
              className
            )
          )}
          {...props}
        >
          <span
            className={twMerge(
              clsx(
                'rounded-full bg-current',
                dotSizeStyles[size]
              )
            )}
            aria-hidden="true"
          />
          {children}
          {dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className={clsx('ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10', iconSizeStyles[size])}
              aria-label="关闭"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          )}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            baseStyles,
            styles,
            sizeStyles[size],
            clickable && 'cursor-pointer hover:opacity-80 active:scale-[0.98]',
            dismissible && 'pr-1',
            className
          )
        )}
        {...props}
      >
        {leftIcon && <span className={iconSizeStyles[size]} aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && <span className={iconSizeStyles[size]} aria-hidden="true">{rightIcon}</span>}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={clsx('ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10', iconSizeStyles[size])}
            aria-label="关闭"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/** 常用组合 Badge */
export const PrimaryBadge = (props: Omit<BadgeProps, 'tone'>) => <Badge tone="primary" {...props} />;
export const SuccessBadge = (props: Omit<BadgeProps, 'tone'>) => <Badge tone="success" {...props} />;
export const WarningBadge = (props: Omit<BadgeProps, 'tone'>) => <Badge tone="warning" {...props} />;
export const DangerBadge = (props: Omit<BadgeProps, 'tone'>) => <Badge tone="danger" {...props} />;
export const InfoBadge = (props: Omit<BadgeProps, 'tone'>) => <Badge tone="info" {...props} />;