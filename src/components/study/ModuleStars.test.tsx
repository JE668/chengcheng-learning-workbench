/**
 * ModuleStars：未拿到真实星数前，不得断言「未完成」。
 *
 * 背景：hook 的 data 首帧是 EMPTY（stars=0），而 ModuleStars 兜底走 hook 时
 * 直接把 0 渲染出去 —— 已有 3 颗星的孩子会先看到一眼「☆☆☆ 未完成」，
 * 等 fetch 回来才跳成「★★★」。少画几颗星只是不好看；「未完成」是一句
 * **肯定的错误结论**，对小朋友更伤。
 *
 * 修复：hook 暴露 loaded，ModuleStars 用它区分「确实是 0 星」与「还不知道」。
 * 这些断言在修复前必然失败。
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

const hookState = { stars: 0, loaded: false };
vi.mock('@/lib/module-progress', () => ({
  useModuleProgress: () => ({
    stars: hookState.stars,
    loaded: hookState.loaded,
    best: 0,
    rounds: 0,
    lastPlayed: 0,
    record: vi.fn(),
  }),
}));

import { ModuleStars } from '@/components/study/ModuleStars';

afterEach(cleanup);

describe('ModuleStars · 加载中不得断言「未完成」', () => {
  it('⚠️ 加载中（loaded=false，未传 stars）→ 不显示「未完成」', () => {
    hookState.loaded = false;
    hookState.stars = 0;
    const { queryByText } = render(<ModuleStars subject="chinese" moduleKey="poems" />);
    expect(queryByText('未完成'), '数据没到就下结论「未完成」').toBeNull();
  });

  it('加载完成且确实是 0 星 → 才显示「未完成」', () => {
    hookState.loaded = true;
    hookState.stars = 0;
    const { getByText } = render(<ModuleStars subject="chinese" moduleKey="poems" />);
    expect(getByText('未完成')).toBeTruthy();
  });

  it('传入 stars prop（RSC 直查库）→ 立即视为已知，0 星也显示「未完成」', () => {
    hookState.loaded = false;
    const { getByText, queryByText } = render(
      <ModuleStars subject="chinese" moduleKey="poems" stars={0} />
    );
    expect(getByText('未完成')).toBeTruthy();
    expect(queryByText('星数加载中')).toBeNull();
  });

  it('加载中 accessible name 不谎报星数', () => {
    hookState.loaded = false;
    hookState.stars = 0;
    const { container } = render(<ModuleStars subject="chinese" moduleKey="poems" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('星数加载中');
  });

  it('拿到 3 星后显示 3 颗且不再有「未完成」', () => {
    hookState.loaded = true;
    hookState.stars = 3;
    const { container, queryByText } = render(<ModuleStars subject="chinese" moduleKey="poems" />);
    expect(container.querySelectorAll('.text-yellow-400').length).toBe(3);
    expect(queryByText('未完成')).toBeNull();
  });
});
