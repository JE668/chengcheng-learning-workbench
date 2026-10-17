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
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [0, 1, 2] } });

    const r = await flushOfflineQueue();

    expect(r).toEqual({ flushed: 1, dropped: 0 });
    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/daily-practice',
      expect.objectContaining({ method: 'POST' })
    );
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

  it('服务端 4xx 错误视为不可修复，直接丢弃并计入 dropped（提示横幅的数据源）', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 }) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [] } });

    const r = await flushOfflineQueue();

    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(r).toEqual({ flushed: 0, dropped: 1 });
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
