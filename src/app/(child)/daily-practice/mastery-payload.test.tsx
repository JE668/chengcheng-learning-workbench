import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DailyPracticePage from './page';

vi.mock('@/lib/speak', () => ({
  playTts: vi.fn(async () => {}),
  prefetchTtsBatch: vi.fn(),
  toEdgeRate: vi.fn(() => '+0%'),
}));

vi.mock('@/lib/sfx', () => ({
  sfxComplete: vi.fn(),
  sfxCorrect: vi.fn(),
  sfxWrong: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('每日一练提交 · 首次作答证据', () => {
  it('错后重选仍上报第一次选项与对应耗时', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/castle/state') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ inventory: { timeglass: 0 } }),
        } as Response;
      }
      if (url === '/api/daily-practice' && !init?.method) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            completed: false,
            questions: [
              {
                id: 'ma-1-1',
                kind: 'math',
                subject: '数学',
                prompt: '1 + 1 = ?',
                options: ['2', '3'],
                answer: 0,
                explain: '1 + 1 = 2',
              },
              {
                id: 'ma-1-2',
                kind: 'math',
                subject: '数学',
                prompt: '2 + 2 = ?',
                options: ['4', '5'],
                answer: 0,
                explain: '2 + 2 = 4',
              },
            ],
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          correct: 2,
          total: 2,
          completed: true,
          subjects: [],
        }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<DailyPracticePage />);

    const wrongOne = await screen.findByRole('button', { name: '3' });
    fireEvent.click(wrongOne);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));

    const wrongTwo = await screen.findByRole('button', { name: '5' });
    fireEvent.click(wrongTwo);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: /完成今日一练/ }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url) === '/api/daily-practice' &&
            (init as RequestInit | undefined)?.method === 'POST'
        )
      ).toBe(true);
    });

    const post = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url) === '/api/daily-practice' &&
        (init as RequestInit | undefined)?.method === 'POST'
    );
    const payload = JSON.parse(String((post?.[1] as RequestInit).body));
    expect(payload.answers).toEqual([0, 0]);
    expect(payload.firstAnswers).toEqual([1, 1]);
    expect(payload.responseMs).toHaveLength(2);
    expect(payload.responseMs.every((ms: number) => Number.isInteger(ms) && ms >= 0)).toBe(true);
  });
});
