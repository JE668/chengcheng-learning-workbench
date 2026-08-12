import type { ReactNode } from 'react';

/** 友好的空状态：悬浮萌可表情 + 标题 + 说明 + 可选操作，替代裸文字提示。 */
export function EmptyState({
  emoji = '✨',
  title,
  desc,
  action,
}: {
  emoji?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="es-emoji float-moko" aria-hidden>
        {emoji}
      </div>
      <div className="es-title">{title}</div>
      {desc && <div className="es-desc">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
