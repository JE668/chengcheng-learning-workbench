// @ts-nocheck
'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, textSizes, fontWeights, radius, transitionBase, activeScale } from './utils';

export const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-medium',
    transitionBase,
    activeScale,
    'rounded-full',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gray-100 text-gray-700',
          'hover:bg-gray-200',
        ],
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
        ],
        success: [
          'bg-success text-white',
          'hover:bg-success/90',
        ],
        warning: [
          'bg-warning text-white',
          'hover:bg-warning/90',
        ],
        danger: [
          'bg-danger text-white',
          'hover:bg-danger/90',
        ],
        info: [
          'bg-info text-white',
          'hover:bg-info/90',
        ],
        outline: [
          'bg-transparent border-2 border-current',
        ],
        ghost: [
          'bg-transparent text-current',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
        ],
        moko: [
          'bg-gradient-to-r from-moko-pink to-moko-rose text-white',
        ],
      },
      size: {
        xs: ['px-1.5 py-0.5 text-xs', fontWeights.medium],
        sm: ['px-2 py-0.5 text-xs', fontWeights.medium],
        md: ['px-2.5 py-1 text-sm', fontWeights.semibold],
        lg: ['px-3 py-1.5 text-base', fontWeights.semibold],
        xl: ['px-4 py-2 text-lg', fontWeights.bold],
      },
      rounded: {
        none: radius.none,
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        '2xl': radius['2xl'],
        full: radius.full,
      },
      dot: {
        true: 'relative pl-5 before:content-[""] before:absolute before:left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-current',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'full',
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** 是否显示圆点指示器 */
  dot?: boolean;
  /** 作为链接渲染 */
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      dot,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? 'a' : 'span';

    return (
      <Comp
        ref={ref}
        className={cn(badgeVariants({ variant, size, rounded, dot }), props.className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };