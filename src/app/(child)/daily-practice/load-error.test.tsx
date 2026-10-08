/**
 * 每日一练：接口失败不得伪装成「今天没有练习」。
 *
 * ## 缺陷模式（真实产品问题 + 掩盖测试真因）
 * 页面原本是 `try { fetch; setData } finally { setLoading(false) }` ——
 * **没有 catch**，也不校验响应。于是：
 *   · 请求抛错 / 返回 {error} / JSON 解析失败 → data 仍为 null
 *   · 渲染时 `q` 为 undefined → 落到「今天暂时没有练习哦～」空状态
 * 孩子以为今天不用练，家长也看不出异常；e2e 只报「找不到攻略按钮」，看不出真因。
 * CI 上实测就是这样：三次重试全挂（状态持久，重试不自愈）。
 *
 * 这些断言在修复前必然失败（会渲染成「今天暂时没有练习哦～」）。
 */
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.mock('@/lib/speak', () => ({ playTts: vi.fn(async () => {}) }));
vi.mock('@/lib/sfx', () => ({ sfxComplete: vi.fn(), sfxWrong: vi.fn() }));
// 不 mock @/lib/stores：页面只用 useOfflineStore.getState()，用真实 store 更省事
// （jsdom 有 localStorage，zustand persist 能正常工作）。

import DailyPracticePage from '@/app/(child)/daily-practice/page';

// jsdom 没有 IntersectionObserver，而 next 的 use-intersection 会 `new` 它
// （渲染到 Link/图片时触发）。注意必须放在 beforeEach 里安装 ——
// 否则 beforeEach 的 unstubAllGlobals() 会把它一起清掉。
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function mockFetch(impl: () => Promise<unknown>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('IntersectionObserver', IO);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const NO_PRACTICE = '今天暂时没有练习哦';

describe('每日一练 · 加载失败要与「没有练习」区分开', () => {
  it('⚠️ 网络异常 → 显示加载失败 + 重试，而不是「今天没有练习」', async () => {
    mockFetch(async () => {
      throw new Error('offline');
    });
    const { queryByText, getByText } = render(<DailyPracticePage />);
    await waitFor(() => expect(getByText(/题目没能加载出来/)).toBeTruthy());
    expect(queryByText(NO_PRACTICE), '接口出错被伪装成「今天没有练习」').toBeNull();
    expect(getByText(/重试/)).toBeTruthy();
  });

  it('⚠️ 接口返回错误体（如未登录）→ 显示失败原因，而不是空状态', async () => {
    mockFetch(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: '未登录' }),
    }));
    const { queryByText, getByText } = render(<DailyPracticePage />);
    await waitFor(() => expect(getByText(/题目没能加载出来/)).toBeTruthy());
    expect(getByText(/未登录/)).toBeTruthy();
    expect(queryByText(NO_PRACTICE)).toBeNull();
  });

  it('响应缺 questions 字段（形状不对）→ 也走失败态', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ completed: false }) }));
    const { queryByText, getByText } = render(<DailyPracticePage />);
    await waitFor(() => expect(getByText(/题目没能加载出来/)).toBeTruthy());
    expect(queryByText(NO_PRACTICE)).toBeNull();
  });

  it('正常返回题目 → 渲染答题界面（有攻略入口），不显示失败态', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        completed: false,
        questions: [
          {
            id: 'q1',
            kind: 'math',
            prompt: '1+1=?',
            answer: 2,
            options: [1, 2, 3],
          },
        ],
      }),
    }));
    const { queryByText } = render(<DailyPracticePage />);
    await waitFor(() => expect(queryByText(/题目没能加载出来/)).toBeNull());
    expect(queryByText(NO_PRACTICE), '有题目却显示空状态').toBeNull();
  });
});
