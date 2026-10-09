// @vitest-environment jsdom
/**
 * ClockModule（认识钟表）：点击选项后，**同一题的选项顺序不得变化**。
 *
 * ## 真实问题
 * MathExtra 的 ClockModule 里，选项是**每次渲染都重新洗牌**的：
 *
 *   const choices = shuffle(CLOCKS.map((c) => c.label)).slice(0, 4);
 *   if (!choices.includes(current.label)) choices[0] = current.label;
 *
 * 于是 choose(label) → setPicked → 重渲染 → choices 重排，
 * **孩子点击的瞬间，四个选项会跳到别的位置**（高亮项也跟着跳）。
 * 这正是项目里 quiz-options-stability.test.tsx 专门守的那类缺陷 ——
 * 但那份测试只覆盖了 ToneModule / PositionModule / SolidShapeModule / EnListenPicModule，
 * 漏掉了 ClockModule。
 *
 * 修法沿用项目既有约定：useMemo 缓存（依赖 current.label）。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

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
vi.mock('@/lib/mistake-logger', () => ({ useMistakeLogger: () => vi.fn() }));

function optionTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.grid button')).map(
    (b) => b.textContent?.trim() ?? ''
  );
}

describe('ClockModule · 选项顺序稳定性', () => {
  beforeEach(() => {
    cleanup();
    speakMock.mockClear();
  });
  afterEach(cleanup);

  it('⚠️ 点击选项后，同一题的选项顺序不得变化', async () => {
    const { ClockModule } = await import('@/components/study/MathExtra');
    const { container } = render(<ClockModule />);

    const before = optionTexts(container);
    expect(before.length).toBe(4);
    expect(before).toContain('1时');

    const buttons = container.querySelectorAll('.grid button');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(optionTexts(container), '点击后选项发生了重排（孩子点的那一项会跳位）').toEqual(
        before
      );
    });
  });

  it('选项必须包含答案「现在是几点」对应的那个钟点', async () => {
    const { ClockModule } = await import('@/components/study/MathExtra');
    const { container } = render(<ClockModule />);
    const texts = optionTexts(container);
    // 组件从 1时 开始，答案必须出现在选项里
    expect(texts).toContain('1时');
    expect(new Set(texts).size).toBe(texts.length);
  });
});
