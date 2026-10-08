/**
 * 舒尔特方格：组件契约 —— 给定 level 就必须给出对应尺寸的棋盘。
 *
 * ## 被测的缺陷模式
 * `grid` 用 `useState(() => makeGrid(size))` 惰性初始化 —— 那个初始化函数
 * **只在挂载时跑一次**。若组件在挂载后被换成另一个 level：
 *
 *   初次 level=1 → size=3 → grid 有 9 个数
 *   → level 变 2 → size=4 → 布局 4 列、完成条件变成 16
 *   → grid 仍只有 9 个数 → 点到 9 之后 next=10，界面上**没有 10**
 *   → `d.length === size * size`（16）永不成立 → 卡死，计时器一直跑
 *
 * ## ⚠️ 这条路径在当前应用里**不可达**
 * GameShell 只在 started=true 时才渲染关卡组件，而 level 在那之前就已被设为
 * 「记住的关卡」；本局结束时 setStarted(false) 会先把组件卸载，「再玩一次」才重新挂载。
 * 已用 schulte-gameshell.test.tsx 沿两条真实路径验证：**原始代码同样通过**。
 *
 * 所以这些断言是在锁「组件自身对 props 的契约」（兜住以后有人换个方式复用它），
 * 而不是在复现线上故障。它们确实会在把重开逻辑去掉后失败。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';

import Schulte from '@/components/games/Schulte';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** 取出棋盘上所有数字按钮 */
function cells(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('button'))
    .map((b) => Number(b.textContent))
    .filter((n) => Number.isFinite(n) && n > 0);
}

describe('Schulte · 关卡切换不得卡死', () => {
  it('level=1 时是 3x3（9 格，最大数 9）', () => {
    const { container } = render(<Schulte level={1} onFinish={() => {}} />);
    const nums = cells(container);
    expect(nums.length).toBe(9);
    expect(Math.max(...nums)).toBe(9);
  });

  it('⚠️ level 由 1 变 2 后，棋盘必须是 4x4（16 格，含 16）', () => {
    const { container, rerender } = render(<Schulte level={1} onFinish={() => {}} />);
    expect(cells(container).length).toBe(9);

    rerender(<Schulte level={2} onFinish={() => {}} />);

    const nums = cells(container);
    expect(nums.length, '关卡变了但棋盘没重开，孩子点到 10 就无格可点').toBe(16);
    expect(Math.max(...nums), '缺少最大数，完成条件永远不成立').toBe(16);
  });

  it('⚠️ 挂载后再调高 level（组件契约：不得留下旧尺寸的棋盘）', () => {
    const onFinish = vi.fn();
    const { container, rerender } = render(<Schulte level={1} onFinish={onFinish} />);
    // GameShell 的 useEffect: setLevel(getGameLevel(gameId))
    rerender(<Schulte level={3} onFinish={onFinish} />);

    const nums = cells(container);
    expect(nums.length).toBe(25);
    expect(Math.max(...nums)).toBe(25);
    // 能按顺序点到最后一个数并正常结算
    for (let i = 1; i <= 25; i++) {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent === String(i)
      );
      expect(btn, `找不到数字 ${i}`).toBeTruthy();
      fireEvent.click(btn!);
    }
    expect(onFinish, '点满全部格子后没有结算 —— 说明卡死了').toHaveBeenCalledTimes(1);
  });

  it('换一批会重置进度并保留 16 格', () => {
    const { container } = render(<Schulte level={2} onFinish={() => {}} />);
    const reshuffle = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('换一批')
    );
    expect(reshuffle).toBeTruthy();
    fireEvent.click(reshuffle!);
    expect(cells(container).length).toBe(16);
  });
});
