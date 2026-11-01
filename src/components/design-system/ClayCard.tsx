'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/components/atomic/utils';

/**
 * Claymorphism 卡片 —— 统一黏土拟态外观的单一入口。
 *
 * 设计规格（globals.css .clay-card / .clay-*）：
 * - 圆角 1.75rem (28px) → rounded-4xl
 * - 无 border，三重阴影表达充气感
 * - 主题色由 --clay-h / --clay-d 控制，类名 clay-pink | clay-violet | clay-gold | clay-cyan | clay-blue | clay-dark
 * - 按压态同步收紧阴影 + scale(0.97)
 *
 * 用法：
 *   <ClayCard theme="violet" className="p-8">内容</ClayCard>
 *   <ClayCard theme="gold" hoverable>可悬浮的卡片</ClayCard>
 */
interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 主题色：对应 globals.css 的 .clay-* 类 */
  theme?: 'pink' | 'violet' | 'gold' | 'cyan' | 'blue' | 'dark';
  /** 是否启用悬浮/按压交互（默认 false，纯展示卡片） */
  hoverable?: boolean;
  /** 额外 className，会合并到基础 clay-card 之后 */
  className?: string;
  /** 作为其他元素渲染（如 <Link>、<section>、<article>） */
  as?: React.ElementType;
  // Allow additional attributes like href when used as Link
  [key: string]: any;
}

const THEME_MAP: Record<NonNullable<ClayCardProps['theme']>, string> = {
  pink: 'clay-pink',
  violet: 'clay-violet',
  gold: 'clay-gold',
  cyan: 'clay-cyan',
  blue: 'clay-blue',
  dark: 'clay-dark',
};

const ClayCard = React.forwardRef<HTMLDivElement, ClayCardProps>(
  (
    { theme = 'violet', hoverable = false, className, as: Component = 'div', children, ...props },
    ref
  ) => {
    const base = cn(
      'clay-card',
      theme ? (THEME_MAP as Record<string, string>)[theme] : undefined,
      hoverable &&
        'transition-all duration-300 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] active:scale-[0.98]',
      className
    );

    // When using polymorphic `as` prop, we need to handle ref correctly
    // For Link, we don't pass ref to avoid issues
    const isLink =
      Component === Link ||
      (typeof Component === 'object' && (Component as any).displayName === 'Link');

    return (
      <Component ref={isLink ? undefined : ref} className={base} {...props}>
        {children}
      </Component>
    );
  }
);

ClayCard.displayName = 'ClayCard';

export { ClayCard, type ClayCardProps };
