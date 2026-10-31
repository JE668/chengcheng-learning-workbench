// @vitest-environment node
/**
 * 离线错题不得丢失（回归）。
 *
 * 背景：logMistake 原先是 `try { fetch } catch {}` —— 网络一断，这条错题就永久消失，
 * 而孩子端文案写着「写错的小题会自动进复习本」「复习本会帮你记着」。
 * 孩子的平板 WiFi 本来就不稳（离线队列正是为此存在），于是「断网写错」= 白写。
 *
 * 修复：失败即入离线队列（localStorage），联网后由 flushOfflineQueue 重放；
 * /api/mistakes 以 (child_id, subject, prompt, answer, resolved=0) 去重，重放不会重复堆积。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addAction = vi.fn();
vi.mock('@/lib/stores', () => ({
  useOfflineStore: { getState: () => ({ addAction }) },
}));

import { logMistake } from '@/lib/mistake-log';

const M = {
  subject: '语文',
  kind: '听写',
  prompt: '天',
  answer: '天',
  wrong: '夫',
};

beforeEach(() => {
  addAction.mockClear();
});

describe('logMistake · 离线不丢错题', () => {
  it('成功送达 → 不入队，返回 true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    );
    await expect(logMistake(M)).resolves.toBe(true);
    expect(addAction).not.toHaveBeenCalled();
  });

  it('⚠️ 网络异常 → 必须入队（此前是静默丢弃）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    await expect(logMistake(M)).resolves.toBe(false);
    expect(addAction, '断网时错题被丢弃了').toHaveBeenCalledTimes(1);
    expect(addAction.mock.calls[0][0]).toMatchObject({ type: 'mistake' });
    expect(addAction.mock.calls[0][0].payload).toMatchObject({ prompt: '天', wrong: '夫' });
  });

  it('5xx 服务端瞬时错误 → 入队等待重试', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    );
    await expect(logMistake(M)).resolves.toBe(false);
    expect(addAction).toHaveBeenCalledTimes(1);
  });

  it('永久性 4xx（400/404/409）→ 不入队（重放也不会变好，徒增噪音）', async () => {
    for (const status of [400, 404, 409]) {
      addAction.mockClear();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('', { status }))
      );
      await expect(logMistake(M)).resolves.toBe(false);
      expect(addAction, `status=${status} 不该入队`).not.toHaveBeenCalled();
    }
  });

  // ⚠️ 401/403/429 必须入队重试，不能按「所有 4xx」一刀切丢弃：
  //   · 401 会话过期（cookie 7 天）—— 孩子登录后重放就能成功，此前写错的题被永久丢掉
  //   · 403 反代改写 Host 触发的 CSRF 软闸误判
  //   · 429 限流
  // 口径与 offline-sync.ts 的 DISCARD_STATUSES 一致。
  it('401 会话过期 → 入队（登录后重放能成功，此前被永久丢弃）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 }))
    );
    await expect(logMistake(M)).resolves.toBe(false);
    expect(addAction, '会话过期时错题被永久丢弃了').toHaveBeenCalledTimes(1);
  });

  it('429 限流 → 入队', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 429 }))
    );
    await expect(logMistake(M)).resolves.toBe(false);
    expect(addAction).toHaveBeenCalledTimes(1);
  });

  it('localStorage 不可用时不抛错（不打断答题）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    addAction.mockImplementation(() => {
      throw new Error('quota');
    });
    await expect(logMistake(M)).resolves.toBe(false);
  });
});
