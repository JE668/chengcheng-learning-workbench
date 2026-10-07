/**
 * 游戏最佳成绩角标的回归测试（对应全量审查发现的 games 徽章永久失效）。
 *
 * 缺陷：`/games` 是**服务端组件**，却直接调用 `getGameBest()` 读 localStorage，
 * 而该函数开头 `if (typeof window === 'undefined') return 0`
 * → SSR 恒得 0 → `badge` 恒为 undefined → 角标永远不显示。
 * （页面里的 gameBests Map 从未被读取，是死代码。）
 *
 * 修复：把读取逻辑移到客户端组件 GameBestBadge，水合后再渲染。
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import GameBestBadge from '@/components/GameBestBadge';
import MokoCard from '@/components/MokoCard';
import { getGameBest } from '@/lib/game-difficulty';

const BEST_KEY_PREFIX = 'cc:gameDiff:v1:';

describe('getGameBest · localStorage 读取语义', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('无记录时返回 0', () => {
    expect(getGameBest('no-such-game')).toBe(0);
  });

  it('有记录时返回数值', () => {
    localStorage.setItem(BEST_KEY_PREFIX + 'math-challenge:best', '350');
    expect(getGameBest('math-challenge')).toBe(350);
  });

  it('损坏数据不抛异常，回落 0', () => {
    localStorage.setItem(BEST_KEY_PREFIX + 'broken:best', 'not-a-number');
    expect(getGameBest('broken')).toBe(0);
  });
});

describe('GameBestBadge · 水合后才渲染角标', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('无历史成绩时不渲染任何角标（不留空药丸）', async () => {
    const { container } = render(<GameBestBadge gameId="fresh-game" />);
    await waitFor(() => {
      // 组件应渲染为空（null），容器内不应有任何元素
      expect(container.innerHTML).toBe('');
    });
  });

  it('有历史成绩时显示 🏆 与分数', async () => {
    localStorage.setItem(BEST_KEY_PREFIX + 'word-match:best', '280');
    const { container } = render(<GameBestBadge gameId="word-match" />);
    await waitFor(() => {
      expect(container.textContent).toContain('🏆');
      expect(container.textContent).toContain('280');
    });
  });

  it('成绩为 0 时不显示（0 不是有效最佳分）', async () => {
    localStorage.setItem(BEST_KEY_PREFIX + 'zero-game:best', '0');
    const { container } = render(<GameBestBadge gameId="zero-game" />);
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });
});

describe('MokoCard · badge 透传', () => {
  beforeEach(() => cleanup());

  it('接受 ReactNode 类型的 badge 并原样渲染', () => {
    render(
      <MokoCard
        title="测试卡片"
        img="/moko/lemei.jpg"
        color="bg-red-500"
        badge={<span data-testid="custom-badge">自定义</span>}
      />
    );
    expect(screen.getByTestId('custom-badge').textContent).toBe('自定义');
  });

  it('不传 badge 时不渲染角标容器', () => {
    const { container } = render(
      <MokoCard title="无角标" img="/moko/lemei.jpg" color="bg-red-500" />
    );
    expect(container.querySelector('[data-testid="custom-badge"]')).toBeNull();
  });
});
