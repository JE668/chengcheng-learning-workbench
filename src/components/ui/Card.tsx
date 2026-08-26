'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 视觉变体 */
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'moko';
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** 圆角大小 */
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** 阴影大小 */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'moko' | 'moko-hover';
  /** 边框 */
  bordered?: boolean;
}

const baseStyles = 'transition-all duration-300';

const variantStyles = {
  default: 'bg-white dark:bg-gray-900',
  elevated: 'bg-white dark:bg-gray-900 shadow-card',
  outlined: 'bg-white dark:bg-gray-900 border-2 border-border',
  gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20',
  moko: 'bg-gradient-to-br from-moko-pink/10 to-moko-violet/10 border-2 border-moko-pink/20',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6 lg:p-8',
  xl: 'p-6 sm:p-8 lg:p-10',
};

const radiusStyles = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[2rem]',
  '3xl': 'rounded-[3rem]',
  full: 'rounded-full',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  moko: 'shadow-moko',
  'moko-hover': 'shadow-moko-hover',
};

const hoverStyles = {
  default: 'hover:shadow-lg hover:-translate-y-0.5',
  elevated: 'hover:shadow-xl hover:-translate-y-1',
  outlined: 'hover:border-primary/50 hover:shadow-md',
  gradient: 'hover:from-primary/10 hover:to-secondary/10 hover:shadow-lg',
  moko: 'hover:border-moko-pink/40 hover:shadow-moko-hover hover:-translate-y-0.5',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      hoverable = false,
      padding = 'md',
      radius = 'xl',
      shadow = 'md',
      bordered = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            baseStyles,
            variantStyles[variant],
            paddingStyles[padding],
            radiusStyles[radius],
            shadowStyles[shadow],
            hoverable && hoverStyles[variant],
            bordered && 'border-2 border-border',
            className
          )
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/** Card 组合组件 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge('mb-4 border-b border-border pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={twMerge('text-xl font-black text-text', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={twMerge('text-text-secondary mt-1', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={twMerge('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge('mt-4 border-t border-border pt-4 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';