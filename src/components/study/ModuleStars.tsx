'use client';

import { useModuleProgress } from '@/lib/module-progress';

/** 关卡星数展示：0~3 颗星。用于模块封面卡片与详情页头部。
 * 优先使用传入的 stars prop（由 RSC 父组件直查库获取），兜底回退到客户端 Hook 请求 API。
 *
 * ⚠️ 未拿到数据前不要断言「未完成」。hook 的 data 首帧是 EMPTY（stars=0），
 * 直接渲染会让已有 3 颗星的孩子先看到一眼「☆☆☆ 未完成」再跳成「★★★」。
 * 少画几颗星只是不好看；而「未完成」是一句**肯定的错误结论**，对小朋友更伤。
 * 因此用 `known` 区分「确实是 0 星」与「还不知道」。
 */
export function ModuleStars({
  subject,
  moduleKey,
  size = 'sm',
  stars: starsProp,
}: {
  subject: string;
  moduleKey: string;
  size?: 'sm' | 'lg';
  stars?: number;
}) {
  const { stars: hookStars, loaded } = useModuleProgress(subject, moduleKey);
  const known = starsProp !== undefined || loaded;
  const stars = starsProp ?? hookStars ?? 0;
  const starCls = size === 'lg' ? 'text-2xl' : 'text-base';
  const emptyCls = size === 'lg' ? 'text-gray-200' : 'text-gray-200';
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={known ? `已获得 ${stars} 颗星` : '星数加载中'}
      title={known ? `已获得 ${stars} 颗星` : '星数加载中'}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < stars ? `text-yellow-400 ${starCls}` : `${emptyCls} ${starCls}`}
        >
          ★
        </span>
      ))}
      {known && stars === 0 && <span className="text-[10px] text-gray-300 ml-1">未完成</span>}
    </div>
  );
}
