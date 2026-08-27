'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体 */
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  /** 是否加载中 */
  loading?: boolean;
  /** 是否全宽 */
  block?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 禁用时显示加载态 */
  disabled?: boolean;
}

const baseStyles = `
  inline-flex items-center justify-center font-semibold transition-all duration-200
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
  select-none
`;

const variantStyles = {
  primary: 'bg-primary text-white border border-primary hover:bg-primary-hover focus-visible:ring-primary',
  secondary: 'bg-secondary text-white border border-secondary hover:bg-secondary-hover focus-visible:ring-secondary',
  accent: 'bg-accent text-gray-900 border border-accent hover:bg-accent-hover focus-visible:ring-accent',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary',
  danger: 'bg-danger text-white border border-danger hover:bg-danger/90 focus-visible:ring-danger',
  success: 'bg-success text-white border border-success hover:bg-success/90 focus-visible:ring-success',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  xl: 'h-14 px-8 text-lg gap-3',
  icon: 'h-10 w-10 p-0',
};

const iconSizeStyles = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
  icon: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      block = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const isIconOnly = !children && (leftIcon || rightIcon);

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            block && 'w-full',
            isIconOnly && 'p-0',
            className
          )
        )}
        style={style}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className={clsx('animate-spin', iconSizeStyles[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2a10 10 0 0 1 10 10"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className={clsx('flex-shrink-0', iconSizeStyles[size])} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children && <span className={clsx('truncate', loading && 'opacity-0')}>{children}</span>}
        {!loading && rightIcon && (
          <span className={clsx('flex-shrink-0', iconSizeStyles[size])} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/** 常用组合按钮 */
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="secondary" {...props} />;
export const AccentButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="accent" {...props} />;
export const OutlineButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="outline" {...props} />;
export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="ghost" {...props} />;
export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="danger" {...props} />;
export const SuccessButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="success" {...props} />;