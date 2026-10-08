// @vitest-environment node
/**
 * castle/* 路由的鉴权与边界测试。
 *
 * 背景：52 条 API 路由里只有 12 条有 handler 测试，castle/* 全部没有。
 * 这些路由直接改孩子的积分/道具/城堡状态，是经济系统最敏感的一层，
 * 权限与入参校验一旦被改坏不会有任何信号。
 *
 * 本文件只做「路由层」的断言（鉴权、限流、入参），经济逻辑本身
 * 由 castle.test.ts / castle-*.test.ts 覆盖，两者互补。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentUser: { id: number; role: string } | null = null;

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => currentUser),
  verifyPassword: vi.fn(() => true),
  resolveChildId: vi.fn(async () => currentUser?.id ?? null),
}));

const buyMock = vi.fn(async () => ({ ok: true, message: 'ok' }));
const setSkinMock = vi.fn(async () => ({ ok: true, message: 'ok' }));
vi.mock('@/lib/castle', () => ({
  buy: (...a: unknown[]) => buyMock(...(a as [])),
  setSkin: (...a: unknown[]) => setSkinMock(...(a as [])),
}));
vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
  return { ...actual, getChildId: vi.fn(async () => 7002) };
});

import { POST as buyPOST } from '@/app/api/castle/buy/route';
import { POST as skinPOST } from '@/app/api/castle/skin/route';

const CHILD = 7001;
const PARENT = 7002;

function req(body: unknown): Request {
  return new Request('http://l/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  currentUser = { id: CHILD, role: 'child' };
  buyMock.mockClear();
  setSkinMock.mockClear();
});

describe('castle/buy · 鉴权与限流', () => {
  it('孩子可购买', async () => {
    const res = await buyPOST(req({ itemKey: 'spray' }));
    expect(res.status).toBe(200);
    expect(buyMock).toHaveBeenCalledWith(CHILD, 'spray');
  });

  it('家长不能购买（只有孩子花自己的阳光）', async () => {
    currentUser = { id: PARENT, role: 'parent' };
    const res = await buyPOST(req({ itemKey: 'spray' }));
    expect(res.status).toBe(403);
    expect(buyMock).not.toHaveBeenCalled();
  });

  it('未登录被拒', async () => {
    currentUser = null;
    const res = await buyPOST(req({ itemKey: 'spray' }));
    expect(res.status).toBe(403);
    expect(buyMock).not.toHaveBeenCalled();
  });

  it('畸形 body 不应 500（safeJson 兜底）', async () => {
    const bad = new Request('http://l/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    });
    const res = await buyPOST(bad);
    expect(res.status).toBe(200); // 落到 buy() 返回业务失败，而不是解析异常
  });

  it('连续调用被限流 429', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 12; i++) {
      codes.push((await buyPOST(req({ itemKey: 'spray' }))).status);
    }
    expect(codes).toContain(429);
  });
});

describe('castle/skin · 鉴权与入参', () => {
  it('孩子可换皮肤', async () => {
    const res = await skinPOST(req({ skin: 'skin_x' }) as never);
    expect(res.status).toBe(200);
    expect(setSkinMock).toHaveBeenCalledWith(CHILD, 'skin_x');
  });

  it('家长走 getChildId 解析出的孩子', async () => {
    currentUser = { id: PARENT, role: 'parent' };
    const res = await skinPOST(req({ skin: 'skin_x' }) as never);
    expect(res.status).toBe(200);
    expect(setSkinMock).toHaveBeenCalledWith(7002, 'skin_x');
  });

  it('未登录被拒', async () => {
    currentUser = null;
    const res = await skinPOST(req({ skin: 'skin_x' }) as never);
    expect(res.status).toBe(401);
  });

  it('缺 skin 被拒，且不进入业务逻辑', async () => {
    const res = await skinPOST(req({}) as never);
    expect(res.status).toBe(400);
    expect(setSkinMock).not.toHaveBeenCalled();
  });
});
