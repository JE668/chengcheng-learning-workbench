// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineStore } from '@/lib/stores';
import { flushOfflineQueue } from './offline-sync';

describe('offline-sync flushOfflineQueue', () => {
  beforeEach(() => {
    useOfflineStore.setState({ queue: [], lastSync: null });
    global.fetch = vi.fn() as any;
  });

  it('重放成功的 checkin 动作从队列移除并返回 { flushed, dropped }', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
    useOfflineStore.getState().addAction({
      type: 'checkin',
      payload: {
        answers: [0, 1, 2],
        firstAnswers: [1, 1, 0],
        responseMs: [1200, 3400, 5600],
      },
    });

    const r = await flushOfflineQueue();

    expect(r).toEqual({ flushed: 1, dropped: 0 });
    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/daily-practice',
      expect.objectContaining({ method: 'POST' })
    );
    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      answers: [0, 1, 2],
      firstAnswers: [1, 1, 0],
      responseMs: [1200, 3400, 5600],
    });
  });

  it('⚠️ mistake 动作会被重放到 /api/mistakes（此前队列里根本没人重放它）', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
    useOfflineStore.getState().addAction({
      type: 'mistake',
      payload: { subject: '语文', kind: '听写', prompt: '天', answer: '天', wrong: '夫' },
    });

    const r = await flushOfflineQueue();

    expect(r.flushed).toBe(1);
    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/mistakes',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('网络异常时保留动作并计入重试，不在本轮丢弃', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline')) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [0] } });

    const r = await flushOfflineQueue();

    const q = useOfflineStore.getState().queue;
    expect(q.length).toBe(1);
    expect(q[0].retries).toBe(1);
    // 本轮没有真正丢弃（会重试），不该触发丢弃提示
    expect(r.dropped).toBe(0);
  });

  it('服务端永久性 4xx（400/404/409）视为不可修复，直接丢弃并计入 dropped（提示横幅的数据源）', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 }) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [] } });

    const r = await flushOfflineQueue();

    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(r).toEqual({ flushed: 0, dropped: 1 });
  });

  // ⚠️ 401/403/429 **不能**按「所有 4xx」一起丢弃 —— 它们重放大概率会成功：
  //   · 401 会话过期（登录后可重放）
  //   · 403 反代改写 Host 触发的 CSRF 软闸误判
  //   · 429 限流：/api/castle/buy 是 10 秒 5 次，联网瞬间整队一起重放极易撞上
  // 旧实现用 `status >= 400 && status < 500` 一刀切，会把孩子的兑换直接吞掉。
  it('429 限流计入重试而非丢弃（整队重放极易撞上 buy 的 IP 限流）', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as any;
    useOfflineStore.getState().addAction({ type: 'buy', payload: { itemKey: 'spray' } });

    const r = await flushOfflineQueue();

    const q = useOfflineStore.getState().queue;
    expect(q.length).toBe(1);
    expect(q[0].retries).toBe(1);
    expect(r).toEqual({ flushed: 0, dropped: 0 });
  });

  it('401 未登录计入重试（孩子登录后就能重放成功）', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 }) as any;
    useOfflineStore.getState().addAction({
      type: 'mistake-review',
      payload: { id: 7, correct: true },
    });

    const r = await flushOfflineQueue();

    expect(useOfflineStore.getState().queue[0].retries).toBe(1);
    expect(r.dropped).toBe(0);
  });

  it('story-capture 收到 409 already（原请求其实已落库）按成功处理，不误报「没同步上」', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ ok: false, code: 'already', error: 'Already captured!' }),
    }) as any;
    useOfflineStore.getState().addAction({
      type: 'story-capture',
      payload: { chapterId: 'ch-03' },
    });

    const r = await flushOfflineQueue();

    // 孩子明明捉到了萌可，若计入 dropped 会弹出「有 1 条没同步上」的误导横幅
    expect(r).toEqual({ flushed: 1, dropped: 0 });
    expect(useOfflineStore.getState().queue.length).toBe(0);
  });

  it('story-capture 的其他 409（缺前置/缺捕捉券）仍是永久失败 → 丢弃', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ ok: false, code: 'no_ticket' }),
    }) as any;
    useOfflineStore.getState().addAction({
      type: 'story-capture',
      payload: { chapterId: 'ch-05' },
    });

    const r = await flushOfflineQueue();

    expect(r).toEqual({ flushed: 0, dropped: 1 });
  });

  it('wish 重放透传 clientRef —— 服务端靠它按 (child_id, client_ref) 去重', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
    useOfflineStore.getState().addAction({
      type: 'wish',
      payload: { text: '去公园玩一小时', clientRef: 'w-1730000000000-ab12cd34' },
    });

    await flushOfflineQueue();

    const [, init] = (global.fetch as any).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      text: '去公园玩一小时',
      clientRef: 'w-1730000000000-ab12cd34',
    });
  });

  it('新增动作类型都有真实的重放目标：harvest / mistake-review / confirm', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
    const store = useOfflineStore.getState();
    store.addAction({ type: 'harvest', payload: {} });
    store.addAction({ type: 'mistake-review', payload: { id: 3, correct: false } });
    store.addAction({ type: 'confirm', payload: { day: '2026-10-30', subject: '数学' } });

    const r = await flushOfflineQueue();

    expect(r.flushed).toBe(3);
    const urls = (global.fetch as any).mock.calls.map((c: any[]) => c[0]);
    expect(urls).toEqual(['/api/castle/harvest', '/api/mistakes/review', '/api/castle/confirm']);
    expect(useOfflineStore.getState().queue.length).toBe(0);
  });

  it('超过最大重试次数的动作被丢弃并计入 dropped', async () => {
    useOfflineStore.setState({
      queue: [{ id: 'x', type: 'checkin', payload: { answers: [] }, timestamp: 0, retries: 5 }],
    });

    const r = await flushOfflineQueue();

    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(r.dropped).toBe(1);
  });
});

describe('offline-sync mistake-review errorType', () => {
  beforeEach(() => {
    useOfflineStore.setState({ queue: [], lastSync: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
  });

  it('错题复习重放必须透传结构化错误原因，避免离线补记丢失错误画像', async () => {
    useOfflineStore.getState().addAction({
      type: 'mistake-review',
      payload: { id: 11, correct: false, errorType: 'reading' },
    });

    const r = await flushOfflineQueue();

    expect(r).toEqual({ flushed: 1, dropped: 0 });
    const init = (global.fetch as any).mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({
      id: 11,
      correct: false,
      errorType: 'reading',
    });
  });
});
