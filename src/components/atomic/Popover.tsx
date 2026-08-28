// @ts-nocheck
'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, radius, shadows, transitionBase } from './utils';

export const popoverVariants = cva(
  [
    'absolute z-50',
    'bg-white dark:bg-gray-800',
    'rounded-xl border border-gray-200 dark:border-gray-700',
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
      side: {
        top: '',
        right: '',
        bottom: '',
        left: '',
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
);

interface PopoverProps {
  /** 触发元素 */
  children: React.ReactElement;
  /** 内容 */
  content: React.ReactNode;
  /** 位置 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 偏移距离 */
  offset?: number;
  /** 宽度类名 */
  widthClass?: string;
  /** 是否显示箭头 */
  showArrow?: boolean;
}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      children,
      content,
      side = 'bottom',
      align = 'center',
      offset = 8,
      widthClass,
      showArrow = true,
      className,
    },
    ref
  ) => {
    return (
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { ref }) : children}
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={ref}
            side={side}
            align={align}
            sideOffset={offset}
            collisionPadding={10}
            className={cn(
              'z-50',
              'bg-white dark:bg-gray-800',
              'rounded-xl border border-gray-200 dark:border-gray-700',
              'shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2',
              widthClass,
            )}
          >
            {content}
            {showArrow && (
              <PopoverPrimitive.Arrow className="fill-white dark:fill-gray-800" width={8} height={4} />
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);

Popover.displayName = 'Popover';

export { Popover };
export type { PopoverProps };