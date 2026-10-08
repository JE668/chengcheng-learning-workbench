// @vitest-environment node
/**
 * parent/reset（还原出厂设置）的边界与作用域回归测试。
 *
 * 这条路由是**破坏性**的：它会 DELETE 掉家长名下所有孩子的学习数据。
 * 所以真正要钉死的不是「能清空」，而是三条安全性质：
 *   1. 未授权不得执行（未登录 / 孩子角色）
 *   2. 密码错误时**一个字节都不许删**（原先无事务、逐条吞异常，半清状态也出现过）
 *   3. 作用域严格限于「我的孩子」—— 绝不能碰到别的家长的孩子
 *
 * 第 3 条尤其重要：它与 children/[id]/select 是同一类越权面（多娃/多家长共用一套库）。
 * 这里用「两个家长各一个孩子」来验证隔离。
 *
 * 另：本文件只管行为；CHILD_TABLES 是否漏表由 reset-child-tables-guard.test.ts 守。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// getCurrentUser / verifyPassword 需要按用例切换，故用 hoisted 变量。
// （vi.mock 的工厂会被提升到 import 之前，直接闭包外层变量会报错。）
const h = vi.hoisted(() => ({
  user: null as null | { id: number; role: 'parent' | 'child' },
  pwOk: true,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  verifyPassword: vi.fn(() => h.pwOk),
}));

import { POST } from '@/app/api/parent/reset/route';
import { getDb, ensureSchema } from '@/lib/db';

function req(body: unknown): NextRequest {
  return new Request('http://l/api/parent/reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function seedFamily(pid: number, cid: number) {
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', '家长')",
    args: [pid, 'p' + pid],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', '娃', ?)",
    args: [cid, 'c' + cid, pid],
  });
}

/** 给孩子塞两份「可清空」的数据，返回清理前各表的行数 */
async function seedChildData(cid: number) {
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO daily_checkins (child_id, day, subject, status) VALUES (?, '2026-01-01', '语文', 'pending')",
    args: [cid],
  });
  await db.execute({
    sql: 'INSERT INTO push_subscriptions (child_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
    args: [cid, 'https://push.example/' + cid, 'k', 'a'],
  });
}

async function counts(cid: number) {
  const db = getDb();
  const c = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ?',
    args: [cid],
  });
  const p = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM push_subscriptions WHERE child_id = ?',
    args: [cid],
  });
  return { checkins: Number(c.rows[0].n), push: Number(p.rows[0].n) };
}

describe('parent/reset · 破坏性操作的三条安全性质', () => {
  beforeEach(async () => {
    await ensureSchema();
    h.pwOk = true;
    h.user = null;
  });

  it('未登录 → 401，且不删任何数据', async () => {
    const { cid } = { cid: 9101 };
    await seedFamily(9100, cid);
    await seedChildData(cid);
    h.user = null;
    const res = await POST(req({ password: 'whatever' }));
    expect(res.status).toBe(401);
    expect(await counts(cid)).toEqual({ checkins: 1, push: 1 });
  });

  it('孩子角色 → 401（不得自我重置）', async () => {
    const cid = 9103;
    await seedFamily(9102, cid);
    await seedChildData(cid);
    h.user = { id: cid, role: 'child' };
    const res = await POST(req({ password: 'whatever' }));
    expect(res.status).toBe(401);
    expect(await counts(cid)).toEqual({ checkins: 1, push: 1 });
  });

  it('⚠️ 密码错误 → 401，且一个字节都不许删', async () => {
    const cid = 9105;
    await seedFamily(9104, cid);
    await seedChildData(cid);
    h.user = { id: 9104, role: 'parent' };
    h.pwOk = false; // verifyPassword 返回 false
    const res = await POST(req({ password: 'wrong' }));
    expect(res.status).toBe(401);
    expect(await counts(cid)).toEqual({ checkins: 1, push: 1 });
  });

  it('⚠️ 作用域隔离：只清我的孩子，绝不动别的家长的孩子', async () => {
    const myChild = 9107;
    const otherChild = 9109;
    await seedFamily(9106, myChild);
    await seedFamily(9108, otherChild);
    await seedChildData(myChild);
    await seedChildData(otherChild);

    h.user = { id: 9106, role: 'parent' };
    const res = await POST(req({ password: 'ok' }));
    const body = await res.json();
    console.log('  reset -> status=' + res.status + ' ' + JSON.stringify(body));

    expect(res.status).toBe(200);
    // 我的：清空（含新补进清单的 push_subscriptions）
    expect(await counts(myChild)).toEqual({ checkins: 0, push: 0 });
    // 别人的：原封不动 —— 这是本条的重点
    expect(await counts(otherChild)).toEqual({ checkins: 1, push: 1 });
  });

  it('无 password 字段 → 400，且不删数据', async () => {
    const cid = 9111;
    await seedFamily(9110, cid);
    await seedChildData(cid);
    h.user = { id: 9110, role: 'parent' };
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect(await counts(cid)).toEqual({ checkins: 1, push: 1 });
  });
});
