// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineStore } from '@/lib/stores';
import { ApiError, apiGet, apiPost, apiRequest } from './api-client';

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client 统一封装', () => {
  beforeEach(() => {
    useOfflineStore.setState({ queue: [], lastSync: null });
    global.fetch = vi.fn() as any;
  });

  it('GET 默认解析 JSON，ok/message/code 归一化', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, message: '成功！', starCoins: 42 })) as any;

    const r = await apiGet<{ starCoins: number }>('/api/castle/state');

    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.data?.starCoins).toBe(42);
    expect(r.message).toBe('成功！');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/castle/state',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('POST 自动带 content-type: application/json 并序列化 body', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true })) as any;

    await apiPost('/api/castle/buy', { body: { itemKey: 'shield' } });

    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('/api/castle/buy');
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ itemKey: 'shield' }));
  });

  it('调用方传入的 headers 覆盖自动 content-type，不会被重复添加', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true })) as any;

    await apiPost('/api/ai/generate', {
      body: { x: 1 },
      headers: { 'content-type': 'text/plain' },
    });

    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.headers['content-type']).toBe('text/plain');
  });

  it('message 归一化优先级：message > error > fallbackError', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: false, error: '捕捉券不够啦～' })) as any;
    expect((await apiPost('/api/story/capture', { body: {} })).message).toBe('捕捉券不够啦～');

    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false })) as any;
    expect((await apiPost('/api/x', { body: {}, fallbackError: '兜底文案' })).message).toBe(
      '兜底文案'
    );
  });

  it('HTTP 非 2xx 不抛错，由 ok=false + code + message 表达（业务路由用非 2xx 表达前置条件不满足）', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ok: false, code: 'no_ticket', error: '捕捉券不够啦' }, 409)
      ) as any;

    const r = await apiPost('/api/story/capture', { body: { chapterId: 'c1' } });

    expect(r.ok).toBe(false);
    expect(r.status).toBe(409);
    expect(r.code).toBe('no_ticket');
    expect(r.message).toBe('捕捉券不够啦');
  });

  it('网络失败且无 offline 时抛 ApiError(network=true)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;

    const p = apiGet('/api/story/progress');
    await expect(p).rejects.toBeInstanceOf(ApiError);
    await p.catch((e: ApiError) => {
      expect(e.network).toBe(true);
      expect(e.status).toBe(0);
    });
    // 没给 offline → 不入队
    expect(useOfflineStore.getState().queue.length).toBe(0);
  });

  it('网络失败且给 offline（可重放类型）时入离线队列，联网后自动重放', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;

    const r = await apiPost('/api/story/capture', {
      body: { chapterId: 'c1' },
      offline: { type: 'story-capture', payload: { chapterId: 'c1' } },
    });

    expect(r.ok).toBe(false);
    expect(r.code).toBe('offline-queued');
    expect(r.message).toContain('离线');
    const q = useOfflineStore.getState().queue;
    expect(q.length).toBe(1);
    expect(q[0].type).toBe('story-capture');
    expect(q[0].payload).toEqual({ chapterId: 'c1' });
  });

  it('网络失败但 offline 类型不可重放（如 typo 类型）→ 抛 ApiError，不入队', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;

    const p = apiPost('/api/unknown', {
      body: { a: 1 },
      offline: { type: 'not-a-real-type', payload: { a: 1 } },
    });

    await expect(p).rejects.toBeInstanceOf(ApiError);
    expect(useOfflineStore.getState().queue.length).toBe(0);
  });

  it('204 / 空 body 不抛解析错（data=null）', async () => {
    // Node 的 Response 构造器拒绝 204 带 body，用 null
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })) as any;

    const r = await apiGet('/api/silent');

    expect(r.ok).toBe(true);
    expect(r.data).toBeNull();
  });

  it('非法 JSON（坏响应）降级为 data=null 而非抛错', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response('<html>gateway error</html>', { status: 502 })) as any;

    const r = await apiGet('/api/broken');

    expect(r.ok).toBe(false);
    expect(r.status).toBe(502);
    expect(r.data).toBeNull();
  });

  it('json:false 时返回原始 Response，不解析 body', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('raw-text', { status: 200, headers: { 'content-type': 'text/plain' } })
      ) as any;

    const r = await apiRequest('/api/raw', { json: false });

    expect(r.data).toBeNull();
    expect(r.response).not.toBeNull();
    expect(await r.response!.text()).toBe('raw-text');
  });
});
