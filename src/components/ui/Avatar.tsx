'use client';

import React, { HTMLAttributes, forwardRef, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** 图片地址 */
  src?: string;
  /** 备选文本/首字母 */
  alt?: string;
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 形状 */
  shape?: 'circle' | 'square' | 'rounded';
  /** 状态指示器 */
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  /** 状态位置 */
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** 加载失败时的回退 */
  fallback?: React.ReactNode;
  /** 是否显示加载态 */
  loading?: boolean;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-xl',
};

const shapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-xl',
};

const statusSizeStyles = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

const statusPositionStyles = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

const statusColorStyles = {
  online: 'bg-success',
  offline: 'bg-gray-400',
  busy: 'bg-danger',
  away: 'bg-warning',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      size = 'md',
      shape = 'circle',
      status = null,
      statusPosition = 'bottom-right',
      fallback,
      loading = false,
      className,
      ...props
    },
    ref
  ) => {
    const initials = useMemo(() => {
      if (!alt) return '?';
      const parts = alt.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [alt]);

    const [imageError, setImageError] = useState(false);

    const showFallback = !src || imageError || loading;

    const statusDot = status ? (
      <span
        className={twMerge(
          clsx(
            'absolute rounded-full border-2 border-surface',
            statusSizeStyles[size],
            statusColorStyles[status],
            statusPositionStyles[statusPosition]
          )
        )}
        aria-label={`状态: ${status}`}
      />
    ) : null;

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'relative inline-flex shrink-0 overflow-hidden bg-surface flex-items-center justify-center',
            sizeStyles[size],
            shapeStyles[shape],
            className
          )
        )}
        {...props}
      >
        {!showFallback && src && (
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading={loading ? 'eager' : 'lazy'}
          />
        )}
        {showFallback && (
          <div
            className={twMerge(
              clsx(
                'w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10',
                'font-black text-primary'
              )
            )}
            aria-label={alt}
          >
            {fallback ?? initials}
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50">
            <svg className="animate-spin w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        {statusDot}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/** Avatar 组 - 重叠头像堆叠 */
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** 最大显示数量 */
  max?: number;
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 重叠距离 */
  overlap?: number;
  /** 子头像 */
  children: React.ReactNode;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, size = 'md', overlap = 8, className, ...props }, ref) => {
    const kids = React.Children.toArray(children).slice(0, max);
    const count = React.Children.count(children);
    const extra = count > max ? count - max : 0;

    return (
      <div
        ref={ref}
        className={twMerge('flex items-center', className)}
        {...props}
      >
        <div className="flex -space-x-2" role="group" aria-label={`头像组，共 ${count} 个`}>
          {kids.map((child, index) => (
            <div
              key={index}
              className="relative z-[auto]"
              style={{ zIndex: kids.length - index }}
            >
              {React.isValidElement(child) ? React.cloneElement(child, { size }) : child}
            </div>
          ))}
          {extra > 0 && (
            <div
              className={twMerge(
                clsx(
                  'flex items-center justify-center font-semibold text-text-secondary border-2 border-surface',
                  sizeStyles[size],
                  shapeStyles.circle
                )
              )}
              style={{ zIndex: 0 }}
              aria-label={`还有 ${extra} 个`}
            >
              +{extra}
            </div>
          )}
        </div>
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';