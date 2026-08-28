// @ts-nocheck
'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, radius, textSizes, fontWeights, transitionBase } from './utils';

export const tabsVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium',
    transitionBase,
    'relative',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gray-100 dark:bg-gray-800',
          'p-1 rounded-xl',
        ],
        underline: [
          'bg-transparent',
          'p-0',
        ],
        pills: [
          'bg-gray-100 dark:bg-gray-800',
          'p-1 rounded-xl',
        ],
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      variant: 'default',
      orientation: 'horizontal',
    },
  }
);

export const tabsTriggerVariants = cva(
  [
    'flex items-center justify-center gap-2',
    'font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-gray-600 dark:text-gray-300',
          'data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm',
        ],
        underline: [
          'text-gray-600 dark:text-gray-400',
          'data-[state=active]:text-primary',
        ],
        pills: [
          'text-gray-600 dark:text-gray-300',
          'data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-md',
        md: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'md',
    },
  }
);

export const tabsContentVariants = cva(
  [
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'animate-in fade-in-0 duration-200 ease-out',
  ],
  {
    variants: {
      variant: {
        default: 'mt-4',
        underline: 'mt-2 border-t border-gray-200 dark:border-gray-700 pt-4',
        pills: 'mt-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TabsProps {
  /** 当前激活的标签 */
  value: string;
  /** 变更回调 */
  onValueChange: (value: string) => void;
  /** 标签列表 */
  tabs: { value: string; label: string; disabled?: boolean; icon?: React.ReactNode }[];
  /** 变体 */
  variant?: 'default' | 'underline' | 'pills';
  /** 方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 圆角 */
  rounded?: 'none' | 'sm' | 'md' | 'full';
  /** 触发器变体 */
  triggerVariant?: 'default' | 'pills';
  /** 类名 */
  className?: string;
  /** 子元素（可覆盖默认渲染） */
  children?: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value,
      onValueChange,
      tabs,
      variant = 'default',
      orientation = 'horizontal',
      size = 'md',
      rounded = 'md',
      triggerVariant = 'default',
      className,
      children,
    },
    ref
  ) => {
    if (children) {
      return (
        <TabsPrimitive.Root
          ref={ref}
          value={value}
          onValueChange={onValueChange}
          orientation={orientation}
          className={cn(className)}
        >
          {children}
        </TabsPrimitive.Root>
      );
    }

    return (
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        orientation={orientation}
        className={cn(tabsVariants({ variant, orientation }), className)}
      >
        <TabsPrimitive.List
          aria-label="标签页"
          className={cn(
            'flex gap-1',
            orientation === 'vertical' && 'flex-col',
            variant === 'underline' && 'border-b border-gray-200 dark:border-gray-700',
          )}
        >
          {tabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                'flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-in-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'relative overflow-hidden',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="flex items-center gap-1.5">{tab.icon}</span>}
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        {tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.value}
            value={tab.value}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 animate-in fade-in-0 duration-200 ease-out"
          >
            {children || <div data-tab={tab.value} />}
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>
    );
  }
);

Tabs.displayName = 'Tabs';

export { Tabs };
export type { TabsProps };