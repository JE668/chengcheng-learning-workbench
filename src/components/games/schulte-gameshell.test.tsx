/**
 * GameShell × Schulte 集成：验证「记住的关卡」与「升档后再玩一次」都对棋盘生效。
 *
 * 背景：GameShell 的 level 挂载后才由 effect 设为「记住的关卡」，而关卡组件只在
 * started=true 时才渲染；结束时 setStarted(false) 会把组件卸载，再玩一次才重新挂载。
 * 也就是说 level 变化**不会**发生在组件已挂载期间 —— 这一点必须用真实渲染路径钉住，
 * 否则很容易误判成「孩子升关后进游戏必然卡死」（我第一版就这么判断错了，
 * 实测原始代码在本文件的两个用例下都是通过的）。
 *
 * 两个用例覆盖实际可达的两条路径：
 *   ① 记住的关卡 → 开局棋盘尺寸
 *   ② 本局升档 → 「再玩一次」后的棋盘尺寸（level 真的变了的那条路径）
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (p: Record<string, unknown>) => React.createElement('img', p),
}));
vi.mock('@/lib/sfx', () => ({ sfxComplete: vi.fn(), sfxClick: vi.fn() }));

const recordGameResult = vi.fn(() => 2); // 本局打完升到第 2 关
vi.mock('@/lib/game-difficulty', () => ({
  getGameLevel: vi.fn(() => 1),
  setGameLevel: vi.fn(),
  getGameBest: vi.fn(() => 0),
  recordGameResult: (...a: unknown[]) => recordGameResult(...(a as [])),
}));

import GameShell from '@/components/GameShell';
import Schulte from '@/components/games/Schulte';

const LEVELS = [
  { name: '入门', tag: '3×3' },
  { name: '进阶', tag: '4×4' },
  { name: '高手', tag: '5×5' },
];

function cells(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('button'))
    .map((b) => Number(b.textContent))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function renderShell() {
  return render(
    <GameShell gameId="schulte" title="舒尔特方格" mokoKey="cometping" levels={LEVELS}>
      {({ onFinish, level }) => <Schulte onFinish={onFinish} level={level} />}
    </GameShell>
  );
}

function tapSequence(container: HTMLElement, max: number) {
  for (let i = 1; i <= max; i++) {
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === String(i)
    );
    if (!btn) throw new Error('当前棋盘上没有数字 ' + i);
    fireEvent.click(btn);
  }
}

afterEach(() => {
  cleanup();
  recordGameResult.mockClear();
});

describe('GameShell × Schulte · 关卡变化', () => {
  it('记住的关卡生效：上次第 2 关 → 开局 4×4', async () => {
    const { container, getByText } = renderShell();
    await waitFor(() => expect(getByText(/开始游戏/)).toBeTruthy());
    fireEvent.click(getByText(/开始游戏/));
    await waitFor(() => expect(cells(container).length).toBe(9));
  });

  it('⚠️ 升档后「再玩一次」，新一局必须是新关卡的棋盘', async () => {
    const { container, getByText } = renderShell();
    fireEvent.click(getByText(/开始游戏/));
    await waitFor(() => expect(cells(container).length).toBe(9));

    // 通关本局（3×3 → 点满 1..9），触发 handleFinish → recordGameResult 返回 2
    tapSequence(container, 9);

    await waitFor(() => expect(getByText(/再玩一次/)).toBeTruthy());
    expect(recordGameResult).toHaveBeenCalled();

    fireEvent.click(getByText(/再玩一次/));

    await waitFor(() => {
      const n = cells(container).length;
      expect(n, '升到第 2 关后仍是 ' + n + ' 格的旧棋盘').toBe(16);
    });
  });
});
