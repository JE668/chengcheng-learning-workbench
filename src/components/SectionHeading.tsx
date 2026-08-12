import type { ReactNode } from 'react';

/** 统一的二级区块标题：图标 + 标题 + 右侧提示/操作，全站风格一致。 */
export function SectionHeading({
  icon,
  title,
  hint,
  action,
  className = '',
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 mb-3 ${className}`}>
      <h2 className="section-title flex items-center gap-2">
        {icon && <span aria-hidden>{icon}</span>}
        <span>{title}</span>
      </h2>
      <div className="flex items-center gap-2">
        {hint && <span className="subtle hidden sm:block">{hint}</span>}
        {action}
      </div>
    </div>
  );
}
