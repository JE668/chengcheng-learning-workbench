// @vitest-environment node
/**
 * auth/login 的安全性质。
 *
 * 这条路由的注释里记着两类**已经修掉的**漏洞，这里把它们钉住：
 *   ① 用户名枚举 —— 原实现 `!row || verifyPassword(...)` 会**短路**掉哈希计算，
 *      于是「用户不存在」明显快于「密码错误」，可用来批量试出哪些用户名有效。
 *      修法是用户不存在时也拿一个假哈希跑一遍 bcrypt。
 *   ② 定向爆破 —— 有 IP 限流但没有账号级锁定，换 IP 就能接着试同一个账号。
 *      修法是 loginLockout(username) + recordLoginFailure/clearLoginFailure。
 *
 * 断言的重点：
 *   · 「用户不存在」与「密码错误」必须返回**完全相同**的状态码与响应体
 *     （一旦有人为了「友好提示」把它改成「该用户不存在」，枚举又回来了）。
 *   · 被拒时绝不 setSessionCookie。
 *   · 成功时按角色给不同落点（家长 /dashboard、孩子 /home）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  row: null as null | { id: number; password_hash: string; role: string },
  passwordOk: true,
  ipLimit: { ok: true, retryAfter: 0 },
  lock: { ok: true, retryAfter: 0 },
}));

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    execute: vi.fn(async () => ({ rows: h.row ? [h.row] : [] })),
  }),
}));
vi.mock('@/lib/auth', () => ({
  setSessionCookie: vi.fn(async () => {}),
  verifyPassword: vi.fn(() => h.passwordOk),
}));
vi.mock('@/lib/schema-init', () => ({ ensureDbReady: vi.fn(async () => {}) }));
vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn(() => '1.2.3.4'),
  rateLimit: vi.fn(() => h.ipLimit),
  loginLockout: vi.fn(() => h.lock),
  recordLoginFailure: vi.fn(),
  clearLoginFailure: vi.fn(),
}));

import type { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import { recordLoginFailure, clearLoginFailure } from '@/lib/rate-limit';

// 返回值必须是 NextRequest（路由签名如此）——写 Request 会被 tsc 拦下，
// 而 vitest 不做类型检查，所以这类错只有 tsc 能发现。
function req(body: string): NextRequest {
  return new Request('http://l/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }) as unknown as NextRequest;
}
const send = (obj: unknown) => POST(req(JSON.stringify(obj)));

beforeEach(() => {
  h.row = { id: 5001, password_hash: 'hash', role: 'parent' };
  h.passwordOk = true;
  h.ipLimit = { ok: true, retryAfter: 0 };
  h.lock = { ok: true, retryAfter: 0 };
  vi.clearAllMocks();
});

describe('auth/login · 限流与锁定', () => {
  it('IP 超限 → 429，带上重试秒数，且不发 session', async () => {
    h.ipLimit = { ok: false, retryAfter: 42 };
    const res = await send({ username: 'parent', password: 'x' });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain('42');
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it('账号被锁定 → 429，且不发 session', async () => {
    h.lock = { ok: false, retryAfter: 99 };
    const res = await send({ username: 'parent', password: 'x' });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain('99');
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});

describe('auth/login · 入参', () => {
  it('畸形 JSON → 400', async () => {
    const res = await POST(req('not-json{'));
    expect(res.status).toBe(400);
  });

  it('缺字段 / 空值 → 400', async () => {
    for (const b of [{}, { username: 'a' }, { password: 'b' }, { username: '  ', password: 'b' }]) {
      const res = await send(b);
      expect(res.status, JSON.stringify(b)).toBe(400);
    }
  });

  it('用户名两端空白会被 trim 后再查库', async () => {
    const res = await send({ username: '  parent  ', password: 'x' });
    expect(res.status).toBe(200);
  });
});

describe('auth/login · 不泄露账号是否存在', () => {
  it('⚠️「用户不存在」与「密码错误」的状态码和响应体必须完全一致', async () => {
    h.row = null;
    const noUser = await send({ username: 'nobody', password: 'x' });
    const noUserBody = await noUser.json();

    h.row = { id: 5001, password_hash: 'hash', role: 'parent' };
    h.passwordOk = false;
    const badPw = await send({ username: 'parent', password: 'x' });
    const badPwBody = await badPw.json();

    expect(noUser.status).toBe(401);
    expect(badPw.status).toBe(401);
    expect(noUserBody, '两个分支的响应体不同 → 可用于枚举用户名').toEqual(badPwBody);
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it('⚠️ 用户不存在时**仍要跑一次密码校验**（否则响应快慢可区分，等于枚举）', async () => {
    // 这条才是真正钉住修复的断言：原实现是 `!row || verifyPassword(...)`，
    // `!row` 为真就短路，bcrypt 根本不执行 →「不存在」显著快于「密码错误」。
    // 只比对响应体是不够的 —— 短路版本返回的也是同一个 401。
    h.row = null;
    await send({ username: 'ghost', password: 'x' });
    expect(verifyPassword, '用户不存在时跳过了密码校验（可被计时枚举）').toHaveBeenCalledTimes(1);
    // 且喂进去的应当是那个合法假哈希，而不是空串（空串会让 bcrypt 立刻返回）
    const hashArg = vi.mocked(verifyPassword).mock.calls[0][1];
    expect(String(hashArg)).toMatch(/^\$2[aby]\$/);
  });

  it('两种失败都会 recordLoginFailure（供账号锁定累计）', async () => {
    h.row = null;
    await send({ username: 'nobody', password: 'x' });
    expect(recordLoginFailure).toHaveBeenCalledWith('nobody');

    h.row = { id: 5001, password_hash: 'hash', role: 'parent' };
    h.passwordOk = false;
    await send({ username: 'parent', password: 'x' });
    expect(recordLoginFailure).toHaveBeenCalledWith('parent');
  });
});

describe('auth/login · 成功路径', () => {
  it('家长成功 → 200，落点 /dashboard，发 session 并清除失败计数', async () => {
    const res = await send({ username: 'parent', password: 'ok' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.redirect).toBe('/dashboard');
    expect(setSessionCookie).toHaveBeenCalledWith(5001);
    expect(clearLoginFailure).toHaveBeenCalledWith('parent');
  });

  it('孩子成功 → 落点 /home', async () => {
    h.row = { id: 5002, password_hash: 'hash', role: 'child' };
    const res = await send({ username: 'cara', password: 'ok' });
    const body = await res.json();
    expect(body.redirect).toBe('/home');
    expect(setSessionCookie).toHaveBeenCalledWith(5002);
  });
});
