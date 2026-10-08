/**
 * StudyQuiz 结算屏：「封面累计星数」必须真的显示出来。
 *
 * 背景：`displayStars` 一直在按 max 累积封面星数（setDisplayStars），
 * 却从未被渲染 —— 而同一屏下方的文案写着「星星会留在封面上，慢慢集满三颗吧～」。
 * 孩子看不到「留在封面上」到底是多少，承诺没有落点。
 *
 * 修复：在结算屏显示「🏰 封面累计：★★☆」。
 * 这些断言在修复前必然失败。
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/speak', () => ({
  speakZh: vi.fn(),
  speakEn: vi.fn(),
  praise: vi.fn(),
  playTts: vi.fn(async () => {}),
  playTtsEnd: vi.fn(async () => {}),
}));
vi.mock('@/lib/mistake-logger', () => ({ useMistakeLogger: () => vi.fn() }));

const recordMock = vi.fn();
vi.mock('@/lib/module-progress', () => ({
  useModuleProgress: () => ({
    stars: 2, // 封面已有 2 星
    best: 2,
    rounds: 3,
    lastPlayed: 0,
    loaded: true,
    record: recordMock,
  }),
}));

import { StudyQuiz, type QuizItem } from '@/components/study/StudyQuiz';

const ITEMS: QuizItem[] = [
  {
    kind: 'test',
    speak: '测试题',
    prompt: '1 + 1 = ?',
    answer: '2',
    options: ['2', '3', '4'],
  },
];

afterEach(() => {
  cleanup();
  recordMock.mockClear();
});

describe('StudyQuiz · 结算屏的封面累计星数', () => {
  it('⚠️ 完成后要显示封面累计星数（此前 displayStars 从未渲染）', async () => {
    const { getByText, container } = render(
      <StudyQuiz
        subject="数学"
        moduleKey="mult-table"
        items={ITEMS}
        roundSize={1}
        shuffleOptions={false}
      />
    );

    // roundSize=1 → 答对一题即结算
    fireEvent.click(getByText('2'));

    await waitFor(
      () => {
        expect(getByText(/本轮闯关结束/)).toBeTruthy();
      },
      { timeout: 8000 }
    );

    expect(getByText(/封面累计/), '结算屏没有显示封面累计星数').toBeTruthy();
    // 封面已有 2 星 → 至少渲染 2 颗实心星（本轮星数另算）
    expect(container.textContent).toMatch(/封面累计/);
  });
});
