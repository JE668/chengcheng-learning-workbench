import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineStore } from '@/lib/stores';
import { flushOfflineQueue } from './offline-sync';

describe('offline-sync flushOfflineQueue', () => {
  beforeEach(() => {
    useOfflineStore.setState({ queue: [], lastSync: null });
    global.fetch = vi.fn() as any;
  });

  it('重放成功的 checkin 动作从队列移除并返回值', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [0, 1, 2] } });

    const flushed = await flushOfflineQueue();

    expect(flushed).toBe(1);
    expect(useOfflineStore.getState().queue.length).toBe(0);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/daily-practice',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('网络异常时保留动作并计入重试，不在本轮丢弃', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline')) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [0] } });

    await flushOfflineQueue();

    const q = useOfflineStore.getState().queue;
    expect(q.length).toBe(1);
    expect(q[0].retries).toBe(1);
  });

  it('服务端 4xx 错误视为不可修复，直接丢弃', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 }) as any;
    useOfflineStore.getState().addAction({ type: 'checkin', payload: { answers: [] } });

    await flushOfflineQueue();

    expect(useOfflineStore.getState().queue.length).toBe(0);
  });

  it('超过最大重试次数的动作被丢弃', async () => {
    useOfflineStore.setState({
      queue: [{ id: 'x', type: 'checkin', payload: { answers: [] }, timestamp: 0, retries: 5 }],
    });

    await flushOfflineQueue();

    expect(useOfflineStore.getState().queue.length).toBe(0);
  });
});