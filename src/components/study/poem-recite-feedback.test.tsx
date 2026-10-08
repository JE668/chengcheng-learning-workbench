/**
 * 古诗背诵：0 分也要有反馈，并且要显示「识别到了什么」。
 *
 * 背景（两处都是真实缺口）：
 *  ① 结算块原先判 `reciteScore > 0` —— 孩子认认真真背完却得 0 分时，
 *     屏幕上**什么都没有**：不知道系统听没听到、也不知道为什么没星星。
 *  ② `reciteText` 存了识别结果却从未渲染，于是分数不可解释。
 *     识别不准时，家长也无从判断是孩子背错还是识别错了。
 *
 * 这些断言在修复前必然失败。
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/speak', () => ({ speakZh: vi.fn(), speakEn: vi.fn() }));
vi.mock('@/lib/mistake-logger', () => ({ useMistakeLogger: () => vi.fn() }));
vi.mock('@/lib/module-progress', () => ({
  useModuleProgress: () => ({
    stars: 0,
    loaded: true,
    best: 0,
    rounds: 0,
    lastPlayed: 0,
    record: vi.fn(),
  }),
}));

// 录音可用，识别返回一段「几乎没命中」的文本 → 命中率 < 0.4 → 0 分
vi.mock('./useRecorder', () => ({
  useRecorder: () => ({
    recording: false,
    audioUrl: null,
    micError: '',
    start: async () => true,
    stop: () => {},
  }),
  recognizeSpeech: async () => '完全不相干的咕噜咕噜',
}));

import { PoemModule } from '@/components/study/ChineseModules';

afterEach(cleanup);

describe('古诗背诵 · 0 分反馈', () => {
  it('⚠️ 得 0 分时必须有反馈，不能一片空白', async () => {
    const { getByText, queryAllByText } = render(<PoemModule />);
    fireEvent.click(getByText(/我来背诵/));

    await waitFor(() => {
      // 修复前：0 分时整个结算块不渲染（只有「▶ 回放我的背诵」那种无关元素）
      expect(queryAllByText(/没太听清|再读一遍|再试/).length, '0 分时没有任何反馈').toBeGreaterThan(
        0
      );
    });
  });

  it('⚠️ 显示「我听到的是」，让分数可解释', async () => {
    const { getByText } = render(<PoemModule />);
    fireEvent.click(getByText(/我来背诵/));

    await waitFor(() => {
      expect(getByText(/我听到的是/)).toBeTruthy();
      expect(getByText(/完全不相干的咕噜咕噜/)).toBeTruthy();
    });
  });
});
