'use client';

import { useModuleProgress } from '@/lib/module-progress';

/** 关卡星数展示：0~3 颗星。用于模块封面卡片与详情页头部。
 * 优先使用传入的 stars prop（由 RSC 父组件直查库获取），兜底回退到客户端 Hook 请求 API。 */
export function ModuleStars({
  subject,
  moduleKey,
  size = 'sm',
  stars: starsProp,
}: { subject: string; moduleKey: string; size?: 'sm' | 'lg'; stars?: number }) {
  const { stars: hookStars } = useModuleProgress(subject, moduleKey);
  const stars = starsProp ?? hookStars ?? 0;
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