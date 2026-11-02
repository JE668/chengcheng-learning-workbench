'use client';

import { ClayButton } from '@/components/design-system';

/**
 * 打印/保存奖状按钮。
 * className 用于附加布局类（如 no-print 已内置）；variant 透传给 ClayButton 控制配色。
 */
export default function PrintButton({
  className,
  variant = 'gold',
}: {
  className?: string;
  variant?:
    'brand' | 'gold' | 'violet' | 'mint' | 'outline' | 'ghost' | 'destructive' | 'secondary';
}) {
  return (
    <ClayButton variant={variant} className={className} onClick={() => window.print()}>
      🖨️ 打印 / 保存奖状
    </ClayButton>
  );
}
