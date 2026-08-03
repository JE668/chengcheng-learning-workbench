'use client';

import { useModuleProgress } from '@/lib/module-progress';

/** 关卡星数展示：0~3 颗星，离线读取 localStorage。用于模块封面卡片与详情页头部。 */
export function ModuleStars({ subject, moduleKey, size = 'sm' }: { subject: string; moduleKey: string; size?: 'sm' | 'lg' }) {
  const { stars } = useModuleProgress(subject, moduleKey);
  const starCls = size === 'lg' ? 'text-2xl' : 'text-base';
  const emptyCls = size === 'lg' ? 'text-gray-200' : 'text-gray-200';
  return (
    <div className="flex items-center gap-0.5" aria-label={`已获得 ${stars} 颗星`} title={`已获得 ${stars} 颗星`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < stars ? `text-yellow-400 ${starCls}` : `${emptyCls} ${starCls}`}>
          ★
        </span>
      ))}
      {stars === 0 && <span className="text-[10px] text-gray-300 ml-1">未完成</span>}
    </div>
  );
}
