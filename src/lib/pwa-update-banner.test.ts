// @vitest-environment node
/**
 * PwaRegister 的更新提示条（回归）。
 *
 * 背景：组件此前实现了完整的 SW 更新检测，却在 `controllerchange` 里直接
 * `location.reload()`，而提示是同时发出的 —— 页面会在用户看清之前被刷掉。
 * 改成「顶部提示条 + 用户点『立即更新』才刷新」后，必须保证：
 *  1. 刷新只发生在用户点击时，不能再有隐式的自动 reload；
 *  2. 提示条要真的渲染出可点的按钮（否则等于没接）。
 *
 * 组件是 'use client' 且依赖 SW/navigator，纯渲染测试成本高；
 * 这里用源码断言把「不该出现的东西」钉死，代价低且能挡住回归。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(process.cwd(), 'src/components/PwaRegister.tsx'), 'utf8');

describe('PwaRegister · 更新提示条', () => {
  it('不得再有无条件的自动刷新（那会让提示条来不及显示）', () => {
    // 允许 applyUpdate 里由用户点击触发的 reload，但不允许在 SW 事件回调里直接刷新
    expect(SRC, '检测到 controllerchange 后仍直接 reload，用户看不到提示条就被刷掉').not.toMatch(
      /addEventListener\('controllerchange'[\s\S]{0,200}location\.reload/
    );
  });

  it('提示条由 updateReady 状态驱动，且提供「立即更新」按钮', () => {
    expect(SRC).toMatch(/updateReady/);
    expect(SRC).toMatch(/立即更新/);
    expect(SRC).toMatch(/onClick=\{applyUpdate\}/);
  });

  it('提供关闭入口（稍后再说），避免用户被永久打扰', () => {
    expect(SRC).toMatch(/setUpdateReady\(false\)/);
  });

  it('提示条固定在顶部且层级高于常规内容', () => {
    expect(SRC).toMatch(/fixed top-0 inset-x-0/);
    expect(SRC).toMatch(/z-\[70\]/);
  });
});
