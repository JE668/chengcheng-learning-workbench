// @vitest-environment node
/**
 * auth/logout 与 castle/request-timeglass。
 *
 * ## auth/logout 真正要钉的是「服务端也失效」
 * 只清 Cookie 是不够的 —— 被复制走的 token 仍然可用。clearSessionCookie 里除了
 * 把 Cookie 设为 maxAge:0，还会 deleteSession(token) 删掉 sessions 表那一行。
 * 本文件直接断言：调用后该 token 在库里查不到了。这是登出安全性的核心。
 *
 * ## castle/request-timeglass
 * 孩子发起补打卡申请，走 wishes 表（text 加 ⏳ 前缀），家长审批。
 * 两点值得钉：
 *  1. day 只做**格式**校验（^YYYY-MM-DD$），格式不对就当没传 —— 范围校验留给
 *     审批时的 validateBackfillDay（申请只是文本，不该在这里拒）。
 *  2. **同一天不重复申请**：同 child + 同 text + pending 已存在时直接返回，
 *     不再插一行（否则家长会看到一串重复申请）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 8802, role: 'child' } as null | { id: number; role: string },
  childId: 8802 as number | null,
  jar: { value: undefined as string | undefined, setCalls: [] as unknown[] },
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    getCurrentUser: vi.fn(async () => h.user),
    resolveChildId: vi.fn(async () => h.childId),
  };
});

// clearSessionCookie 用 next/headers 的 cookies()；node 测试环境没有请求作用域，
// 这里给一个最小替身，好让**真实的** clearSessionCookie / deleteSession 跑起来。
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'session' && h.jar.value ? { value: h.jar.value } : undefined),
    set: (...args: unknown[]) => {
      h.jar.setCalls.push(args);
    },
  }),
}));

import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as tgGet, POST as tgPost } from '@/app/api/castle/request-timeglass/route';
import { getDb, ensureSchema } from '@/lib/db';

const TOKEN = 'logout-test-token-abc';
const ME = 8802;
const OTHER = 8805;

function req(body: unknown, origin = 'https://study.example.com'): NextRequest {
  return new Request('http://l/api/castle/request-timeglass', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const db = () => getDb();

async function sessionExists(token: string): Promise<boolean> {
  const r = await db().execute({ sql: 'SELECT 1 FROM sessions WHERE token = ?', args: [token] });
  return r.rows.length > 0;
}

async function pendingTimeglass(cid: number) {
  const r = await db().execute({
    sql: "SELECT text FROM wishes WHERE child_id = ? AND text LIKE '⏳%' AND status = 'pending'",
    args: [cid],
  });
  return r.rows.map((x) => String(x.text));
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  h.childId = ME;
  h.jar.value = undefined;
  h.jar.setCalls = [];
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (8801,'tg-p','x','parent','p')",
    args: [],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',8801)",
    args: [ME, 'tg-c' + ME],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',8801)",
    args: [OTHER, 'tg-c' + OTHER],
  });
  for (const c of [ME, OTHER]) {
    await db().execute({ sql: 'DELETE FROM wishes WHERE child_id = ?', args: [c] });
  }
  await db().execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [TOKEN] });
});

describe('auth/logout · 服务端也要失效，不只是清 Cookie', () => {
  it('⚠️ 登出后该 token 在 sessions 表里必须查不到', async () => {
    await db().execute({
      sql: 'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
      args: [TOKEN, ME],
    });
    expect(await sessionExists(TOKEN)).toBe(true);

    h.jar.value = TOKEN;
    await logout(req({}, 'https://study.example.com'));

    expect(await sessionExists(TOKEN), '只清了 Cookie，token 在服务端仍然有效').toBe(false);
  });

  it('清除 Cookie（maxAge:0）并跳回 /login', async () => {
    h.jar.value = TOKEN;
    const res = await logout(req({}, 'https://study.example.com'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://study.example.com/login');
    // 至少有一次 set 把 cookie 置空
    expect(h.jar.setCalls.length).toBeGreaterThan(0);
  });

  it('没有 token 时也不报错（幂等登出）', async () => {
    h.jar.value = undefined;
    const res = await logout(req({}, 'https://study.example.com'));
    expect(res.status).toBe(307);
  });
});

describe('castle/request-timeglass · 申请与去重', () => {
  it('非孩子 POST → 403；非家长 GET → 403', async () => {
    h.user = { id: 8801, role: 'parent' };
    expect((await tgPost(req({}))).status).toBe(403);
    h.user = { id: ME, role: 'child' };
    expect((await tgGet()).status).toBe(403);
  });

  it('带合法日期 → 申请文本里是正确的中文日期', async () => {
    const res = await tgPost(req({ day: '2026-09-26' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain('09月26日');
    expect(await pendingTimeglass(ME)).toEqual(['⏳ 申请时光沙漏（补 09月26日）']);
  });

  it('日期格式不对 → 当作没传（不做范围校验，留给审批时）', async () => {
    for (const bad of ['abc', '2026-9-1', '2026/09/26', '20260926', '09月26日']) {
      await db().execute({ sql: 'DELETE FROM wishes WHERE child_id = ?', args: [ME] });
      const res = await tgPost(req({ day: bad }));
      const body = await res.json();
      expect(res.status, bad).toBe(200);
      expect(body.message, bad + ' → 不该被当成日期').not.toMatch(/\d{2}月\d{2}日/);
      expect(await pendingTimeglass(ME), bad).toEqual(['⏳ 申请时光沙漏']);
    }
  });

  it('⚠️ 同一天重复申请不产生第二行（pending 去重）', async () => {
    await tgPost(req({ day: '2026-09-26' }));
    const second = await tgPost(req({ day: '2026-09-26' }));
    const body = await second.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain('已经申请过了');
    expect(await pendingTimeglass(ME), '重复申请插了多行').toEqual([
      '⏳ 申请时光沙漏（补 09月26日）',
    ]);
  });

  it('不同日期可以各自申请一次', async () => {
    await tgPost(req({ day: '2026-09-25' }));
    await tgPost(req({ day: '2026-09-26' }));
    expect((await pendingTimeglass(ME)).length).toBe(2);
  });

  it('家长 GET 只看当前选中孩子、只看到 ⏳ 且 pending 的', async () => {
    await tgPost(req({ day: '2026-09-26' }));
    // 普通愿望不该出现
    await db().execute({
      sql: "INSERT INTO wishes (child_id, text, status) VALUES (?, '我想吃冰淇淋', 'pending')",
      args: [ME],
    });
    // 别人家孩子的沙漏申请不该出现
    await db().execute({
      sql: "INSERT INTO wishes (child_id, text, status) VALUES (?, '⏳ 申请时光沙漏（补 01月01日）', 'pending')",
      args: [OTHER],
    });
    // 已审批的也不该出现
    await db().execute({
      sql: "INSERT INTO wishes (child_id, text, status) VALUES (?, '⏳ 申请时光沙漏（补 09月01日）', 'fulfilled')",
      args: [ME],
    });

    h.user = { id: 8801, role: 'parent' };
    h.childId = ME;
    const body = await (await tgGet()).json();
    const texts = body.requests.map((r: { text: string }) => r.text);
    expect(texts).toEqual(['⏳ 申请时光沙漏（补 09月26日）']);
  });
});
