// @ts-nocheck
'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, radius, textSizes, fontWeights, transitionBase, shadows } from './utils';

export const tooltipVariants = cva(
  [
    'absolute z-50',
    'px-3 py-1.5',
    'text-sm font-medium',
    'rounded-lg',
    'shadow-lg',
    'animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        danger: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
        light: 'bg-white text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-white',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface TooltipProps {
  /** 触发元素 */
  children: React.ReactElement;
  /** 提示内容 */
  content: React.ReactNode;
  /** 位置 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** 偏移距离 */
  offset?: number;
  /** 变体 */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'light';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 延迟显示 */
  delayDuration?: number;
  /** 延迟隐藏 */
  skipDelayDuration?: number;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      side = 'top',
      offset = 8,
      variant = 'default',
      size = 'md',
      delayDuration = 300,
      skipDelayDuration = 100,
      className,
    },
    ref
  ) => {
    return (
      <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { ref }) : children}
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              ref={ref}
              side={side}
              sideOffset={8}
              align="center"
              collisionPadding={10}
              className={cn(
                'z-50',
                'px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg',
                'animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-2',
                'data-[side=left]:slide-in-from-right-2',
                'data-[side=right]:slide-in-from-left-2',
                'data-[side=top]:slide-in-from-bottom-2',
                'bg-gray-900 text-white',
                'px-3 py-1.5',
                'text-sm font-medium',
                'rounded-lg',
                'shadow-lg',
              )}
            >
              {content}
              <TooltipPrimitive.Arrow className="fill-gray-900" width={8} height={4} />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export type { TooltipProps };