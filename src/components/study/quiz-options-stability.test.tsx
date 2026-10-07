/**
 * 「选项顺序在同题内保持稳定」的回归测试。
 *
 * ## 缺陷模式（本项目最集中的一类）
 * 把 `shuffle(...)` / `sort(() => Math.random())` 直接写在**渲染函数体内**，
 * 于是任何 state 更新都会重新洗牌 —— 孩子点击选项的瞬间，高亮项会
 * 跳位到另一个选项上（`setPicked(w)` → 重渲染 → 重新洗牌）。
 * 同时 SSR 首帧与客户端首帧顺序不同，还会触发 hydration 不匹配。
 *
 * 修复方式是按项目既有约定：首帧确定性 + `useMemo` 缓存
 * （与 ChineseModules 的 `shuffle: false` + 挂载后随机同一思路）。
 *
 * 这些断言在修复前必然失败。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const speakMock = vi.fn();
vi.mock('@/lib/speak', () => ({
  speakZh: (...a: unknown[]) => speakMock(...a),
  speakEn: (...a: unknown[]) => speakMock(...a),
  praise: vi.fn(),
  playTts: vi.fn(async () => {}),
  playTtsEnd: vi.fn(async () => {}),
}));
vi.mock('@/lib/module-progress', () => ({
  useModuleProgress: () => ({
    record: vi.fn(),
    data: { stars: 0, best: 0, rounds: 0, lastPlayed: 0 },
    loaded: true,
  }),
}));
vi.mock('@/lib/mistake-logger', () => ({
  useMistakeLogger: () => vi.fn(),
}));

/** 取当前 DOM 里所有选项按钮的文字，顺序即渲染顺序。 */
function optionTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.grid button')).map(
    (b) => b.textContent?.trim() ?? ''
  );
}

describe('选项顺序稳定性 · 点击后不跳位', () => {
  beforeEach(() => {
    cleanup();
    speakMock.mockClear();
  });
  afterEach(cleanup);

  it('ToneModule：点击选项后，同一题的选项顺序不变', async () => {
    const { ToneModule } = await import('@/components/study/ToneQuiz');
    const { container } = render(<ToneModule />);

    const before = optionTexts(container);
    expect(before.length).toBeGreaterThan(1);

    // 点击第一个选项 → setSelected 触发重渲染
    const buttons = container.querySelectorAll('.grid button');
    fireEvent.click(buttons[0]);

    // 关键断言：重渲染后选项顺序**必须完全一致**
    await waitFor(() => {
      expect(optionTexts(container), '点击后选项发生了重排').toEqual(before);
    });
  });

  it('PositionModule：点击选项后选项顺序不变', async () => {
    const { PositionModule } = await import('@/components/study/MathExtra');
    const { container } = render(<PositionModule />);

    const before = optionTexts(container);
    expect(before.length).toBeGreaterThan(1);

    const buttons = container.querySelectorAll('button');
    // 跳过「听一听」等非选项按钮，找到第一个网格选项
    const optButtons = Array.from(buttons).filter((b) =>
      before.includes(b.textContent?.trim() ?? '')
    );
    fireEvent.click(optButtons[0]);

    await waitFor(() => {
      expect(optionTexts(container), '点击后选项发生了重排').toEqual(before);
    });
  });

  it('SolidShapeModule：点击选项后选项顺序不变', async () => {
    const { SolidShapeModule } = await import('@/components/study/MathExtra');
    const { container } = render(<SolidShapeModule />);

    const before = optionTexts(container);
    expect(before.length).toBeGreaterThan(1);

    const optButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
      before.includes(b.textContent?.trim() ?? '')
    );
    fireEvent.click(optButtons[0]);

    await waitFor(() => {
      expect(optionTexts(container), '点击后选项发生了重排').toEqual(before);
    });
  });

  it('StudyQuiz 题库项引用稳定：连续两次渲染产出的题库内容一致', async () => {
    const { EnListenPicModule } = await import('@/components/study/EnglishListen');
    // 挂载一次拿到题库内容；重新挂载应得到同一批内容（build 用 useMemo 后
    // 组件生命周期内不再变化；这里验证的是「重渲染不会换一批题」）
    const { container, rerender } = render(<EnListenPicModule />);
    const snapshot = container.innerHTML;
    rerender(<EnListenPicModule />);
    expect(container.innerHTML, '重渲染更换了整批题目').toBe(snapshot);
  });
});
