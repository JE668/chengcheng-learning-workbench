'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, radius, textSizes, fontWeights, transitionBase, shadows } from './utils';

export const dropdownMenuVariants = cva(
  [
    'absolute z-50',
    'min-w-[180px]',
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

export const dropdownItemVariants = cva(
  [
    'flex items-center gap-2',
    'w-full px-3 py-2 text-sm',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'rounded-lg',
    'group',
  ],
  {
    variants: {
      variant: {
        default: 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
        danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
        ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface DropdownMenuProps {
  /** 触发元素 */
  children: React.ReactElement;
  /** 菜单项 */
  items: DropdownMenuItem[];
  /** 位置 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 偏移距离 */
  offset?: number;
  /** 是否为右对齐 */
  dir?: 'ltr' | 'rtl';
}

export interface DropdownMenuItem {
  /** 唯一标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 快捷键提示 */
  shortcut?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否危险操作 */
  variant?: 'default' | 'danger' | 'ghost';
  /** 点击回调 */
  onClick?: () => void;
  /** 子菜单 */
  subItems?: DropdownMenuItem[];
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      children,
      items,
      side = 'bottom',
      align = 'center',
      offset = 8,
      dir = 'ltr',
      className,
    },
    ref
  ) => {
    return (
      <DropdownMenuPrimitive.Root dir={dir}>
        <DropdownMenuPrimitive.Trigger asChild>
          {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { ref }) : children}
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            ref={ref}
            side={side}
            align={align}
            sideOffset={offset}
            collisionPadding={10}
            className={cn(
              'z-50 min-w-[180px]',
              'bg-white dark:bg-gray-800',
              'rounded-xl border border-gray-200 dark:border-gray-700',
              'shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2',
            )}
          >
            <DropdownMenuPrimitive.Group>
              {items.map((item) => (
                <DropdownMenuPrimitive.Item
                  key={item.key}
                  disabled={item.disabled}
                  onSelect={item.onClick}
                  className={cn(
                    'flex items-center gap-2',
                    'w-full px-3 py-2 text-sm',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'rounded-lg',
                    item.variant === 'danger' && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
                    item.variant === 'ghost' && 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                    'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
                    'flex items-center gap-2 px-3 py-2 text-sm',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'rounded-lg',
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                  {item.subItems && <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />}
                </DropdownMenuPrimitive.Item>
              ))}
            </DropdownMenuPrimitive.Group>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

export { DropdownMenu };
export type { DropdownMenuProps, DropdownMenuItem };