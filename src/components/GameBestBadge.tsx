'use client';

// 显式导入 React：Next 会自动注入 JSX 运行时，但 vitest/esbuild 直跑时不会，
// 缺了它单测里会抛 "React is not defined"（与 atomic/a11y.test.tsx 的约定一致）。
import React, { useEffect, useState } from 'react';
import { getGameBest } from '@/lib/game-difficulty';

/**
 * 游戏卡片右上角的「🏆 历史最佳」角标。
 *
 * ## 为什么必须是客户端组件
 *
 * 最佳成绩存在 **localStorage**（见 lib/game-difficulty.ts：难度与最佳分属
 * 「纯偏好」，刻意不进服务端）。而 `/games` 页面是**服务端组件** ——
 * 原实现在那里直接调用 `getGameBest()`，而该函数开头就是
 * `if (typeof window === 'undefined') return 0`，
 * 于是服务端渲染时恒得 0 → `badge` 恒为 `undefined`
 * → **角标永远不会显示**（页面里那段 `gameBests` Map 甚至从未被读取，是死代码）。
 *
 * ## 修法
 * SSR 首帧没有 localStorage，只能先不渲染；等水合完成后再用 effect 读一次。
 * 这样服务端与客户端首帧一致（无 hydration mismatch），随后立刻补上角标。
 *
 * 注意 effect 不写依赖数组是有意的：localStorage 不是响应式数据源，
 * 放进去只会在每次渲染时重复读取；此组件挂载后只读一次即可。
 */
export default function GameBestBadge({ gameId }: { gameId: string }) {
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    setBest(getGameBest(gameId));
  }, [gameId]);

  // 水合完成前不渲染任何内容，保证 SSR/CSR 首帧一致；
  // 没有历史成绩时整体不渲染（容器由本组件自己输出，
  // 否则外层 MokoCard 会因 badge 非 null 而留下一个空药丸）。
  if (best === null || best <= 0) return null;
  return (
    <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full bg-white/90 text-moko-violet text-xs font-black shadow">
      🏆 {best}
    </div>
  );
}
