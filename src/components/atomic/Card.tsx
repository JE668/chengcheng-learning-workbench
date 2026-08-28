'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, shadows, radius } from './utils';

export const cardVariants = cva(
  [
    'bg-white',
    'border-2 border-white/50',
    'overflow-hidden',
    shadows.card,
  ],
  {
    variants: {
      variant: {
        default: [],
        elevated: [shadows.float],
        outlined: ['border-2 border-gray-200', 'shadow-none'],
        ghost: ['bg-transparent', 'border-none', 'shadow-none'],
        moko: [
          'bg-gradient-to-br from-pink-50 to-rose-50',
          'border-moko-pink/30',
        ],
        brand: [
          'bg-gradient-to-br from-purple-50 to-violet-50',
          'border-purple-200',
        ],
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      radius: {
        none: radius.none,
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        '2xl': radius['2xl'],
        '3xl': radius['3xl'],
        full: radius.full,
      },
      hover: {
        true: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      radius: 'xl',
      hover: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** 卡片头部 */
  header?: React.ReactNode;
  /** 卡片内容 */
  children: React.ReactNode;
  /** 卡片底部 */
  footer?: React.ReactNode;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击处理 */
  onClick?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      radius,
      hover,
      header,
      children,
      footer,
      clickable,
      onClick,
      ...props
    },
    ref
  ) => {
    const isClickable = clickable && onClick;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, radius, hover: isClickable ? true : hover }),
          isClickable && 'cursor-pointer',
          isClickable && 'active:scale-[0.99]',
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        {...props}
      >
        {header && (
          <div className="mb-4 border-b border-gray-100 pb-3">
            {header}
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

/** 卡片头部组件 */
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 flex flex-col space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

/** 卡片标题 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-black text-gray-900', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/** 卡片描述 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

/** 卡片内容 */
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/** 卡片底部 */
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card };
export type { CardProps };