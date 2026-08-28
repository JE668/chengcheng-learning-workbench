// @ts-nocheck
'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, radius, shadows, transitionBase, activeScale, minTouchTarget } from './utils';

export const avatarVariants = cva(
  [
    'inline-flex items-center justify-center',
    'overflow-hidden',
    'bg-gray-100',
    'text-gray-600',
    'font-semibold',
    'select-none',
    transitionBase,
  ],
  {
    variants: {
      variant: {
        default: [],
        circle: ['rounded-full'],
        square: ['rounded-lg'],
        rounded: ['rounded-xl'],
      },
      size: {
        xs: ['h-6 w-6 text-xs'],
        sm: ['h-8 w-8 text-sm'],
        md: ['h-10 w-10 text-base'],
        lg: ['h-12 w-12 text-lg'],
        xl: ['h-16 w-16 text-xl'],
        '2xl': ['h-24 w-24 text-2xl'],
        '3xl': ['h-32 w-32 text-3xl'],
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-none',
        rounded: 'rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'circle',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** 图片源 */
  src?: string;
  /** 替代文本 */
  alt?: string;
  /** 备用文本（无图片时显示首字母） */
  fallback?: string;
  /** 状态指示器 */
  status?: 'online' | 'offline' | 'busy' | 'away';
  /** 状态指示器位置 */
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      src,
      alt,
      fallback,
      status,
      statusPosition = 'bottom-right',
      className: classNameProp,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    const showFallback = !src || imageError;
    const displayName = fallback || alt || '?';
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-yellow-500',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
      '3xl': 'w-6 h-6',
    };

    const statusPositions = {
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0',
          props.className
        )}
        {...props}
      >
        <div
          ref={ref}
          className={cn(
            'relative inline-flex shrink-0 overflow-hidden bg-gray-100',
            shape === 'circle' && 'rounded-full',
            shape === 'square' && 'rounded-none',
            shape === 'rounded' && 'rounded-xl',
            size === 'xs' && 'h-6 w-6',
            size === 'sm' && 'h-8 w-8',
            size === 'md' && 'h-10 w-10',
            size === 'lg' && 'h-12 w-12',
            size === 'xl' && 'h-16 w-16',
            size === '2xl' && 'h-24 w-24',
            size === '3xl' && 'h-32 w-32',
            classNameProp
          )}
          {...props}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt || displayName}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={cn(
                'h-full w-full flex items-center justify-center',
                'bg-gradient-to-br from-gray-200 to-gray-300',
                size === 'xs' && 'text-xs',
                size === 'sm' && 'text-sm',
                size === 'md' && 'text-base',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-xl',
                size === '2xl' && 'text-2xl',
                size === '3xl' && 'text-3xl',
                'font-semibold text-gray-600 select-none'
              )}
            >
              {initials}
            </div>
          )}
          {status && (
            <span
              className={cn(
                'absolute rounded-full border-2 border-white dark:border-gray-900',
                statusColors[status],
                statusSizes[size],
                statusPositions[statusPosition]
              )}
              aria-label={`${status} 状态`}
            />
          )}
        </div>
      </div>
    );
  }
);

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

Avatar.displayName = 'Avatar';

/** 头像组 - 多个头像堆叠 */
export const AvatarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { max?: number; size?: keyof typeof avatarVariants.defaultVariants.size }>(
  ({ className, max = 5, size = 'md', children, ...props }, ref) => {
    const kids = React.Children.toArray(children);
    const visible = kids.slice(0, max);
    const remaining = kids.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visible.map((child, index) =>
          React.cloneElement(child as React.ReactElement<any>, {
            key: child.key || index,
            size,
            className: cn('ring-2 ring-white dark:ring-gray-900', child.props.className),
            style: { zIndex: max - index },
          })
        )}
        {remaining > 0 && (
          <div
            className={cn(
              'flex items-center justify-center font-medium text-gray-600 bg-gray-100 border-2 border-white dark:border-gray-900',
              size === 'xs' && 'h-6 w-6 text-xs',
              size === 'sm' && 'h-8 w-8 text-sm',
              size === 'md' && 'h-10 w-10 text-base',
              size === 'lg' && 'h-12 w-12 text-lg',
              size === 'xl' && 'h-16 w-16 text-xl',
              size === '2xl' && 'h-24 w-24 text-2xl',
              size === '3xl' && 'h-32 w-32 text-3xl',
              'rounded-full'
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';