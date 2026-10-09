// @vitest-environment node
/**
 * tts / tts/health / castle/harvest 的门禁。
 *
 * ## tts（公开无鉴权端点）
 * 两个写进注释的约束：限流（429）、**单次合成文本长度上限**
 * （「避免超长文本放大 Python 侧耗时与缓存占用」）。
 *
 * ## tts/health（也是公开无鉴权）
 * 注释点明这里有个**现成的 DoS 面**：「每个请求都 execSync 会在单进程 NAS 上
 * 阻塞事件循环」，所以 python 版本探测带 60 秒 TTL 缓存。
 *
 * ⚠️ 关于这个缓存怎么测：pythonCache 是**模块级**状态，静态 import 时跨用例
 * 互相污染（我第一版就踩了：第二个用例永远命中第一个用例留下的缓存）。
 * 所以这里只断言**与缓存冷热无关**的性质 ——
 * 「第二次请求不得再 spawn」无论缓存是否已热都成立；
 * 不去断言 execSync 的绝对次数（那会变成顺序依赖的脆弱用例）。
 *
 * ## castle/harvest
 * 只有孩子能收：非孩子 403。收成逻辑由 lib/castle.test.ts 覆盖。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 6602, role: 'child' } as null | { id: number; role: string },
  limit: { ok: true, retryAfter: 0 } as { ok: boolean; retryAfter: number },
  execCalls: 0,
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => h.limit),
  getClientIp: vi.fn(() => '1.2.3.4'),
}));
vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => {
    h.execCalls++;
    return 'Python 3.11.0\n';
  }),
  spawn: vi.fn(),
}));

import { POST as ttsPost } from '@/app/api/tts/route';
import { GET as healthGet } from '@/app/api/tts/health/route';
import { POST as harvestPost } from '@/app/api/castle/harvest/route';

function req(url: string, body: unknown): NextRequest {
  return new Request('http://l' + url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  h.user = { id: 6602, role: 'child' };
  h.limit = { ok: true, retryAfter: 0 };
});

describe('tts - 限流与文本规模上限', () => {
  it('限流 -> 429', async () => {
    h.limit = { ok: false, retryAfter: 9 };
    const res = await ttsPost(req('/api/tts', { text: '你好' }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain('9');
  });

  it('缺少 text -> 400', async () => {
    for (const b of [{}, { text: '' }, { text: 123 }]) {
      expect((await ttsPost(req('/api/tts', b))).status, JSON.stringify(b)).toBe(400);
    }
  });

  it('文本过长 -> 400（公开端点的规模上限）', async () => {
    const res = await ttsPost(req('/api/tts', { text: '字'.repeat(5000) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('过长');
  });
});

describe('tts/health - 探测必须带缓存（否则是现成的 DoS 面）', () => {
  it('限流 -> 429，且完全不 spawn 子进程', async () => {
    h.limit = { ok: false, retryAfter: 5 };
    h.execCalls = 0;
    const res = await healthGet(req('/api/tts/health', {}) as never);
    expect(res.status).toBe(429);
    expect(h.execCalls, '被限流却仍然跑了 execSync').toBe(0);
  });

  it('第二次请求不得再 spawn（缓存生效，与缓存冷热无关）', async () => {
    h.execCalls = 0;
    const a = await healthGet(req('/api/tts/health', {}) as never);
    const afterFirst = h.execCalls;
    const b = await healthGet(req('/api/tts/health', {}) as never);
    expect(b.status).toBe(a.status);
    expect(h.execCalls, '第二次请求又 spawn 了一次 —— 缓存没生效').toBe(afterFirst);
  });
});

describe('castle/harvest - 只有孩子能收', () => {
  it('未登录 -> 403；家长 -> 403', async () => {
    h.user = null;
    expect((await harvestPost(req('/api/castle/harvest', {}))).status).toBe(403);
    h.user = { id: 6601, role: 'parent' };
    expect((await harvestPost(req('/api/castle/harvest', {}))).status).toBe(403);
  });
});
