// @vitest-environment node
/**
 * 奖状申请流转：孩子只能「申请」，家长才能「审批」。
 *
 * 两条路由合起来是一条权限链，任何一环松掉都会变成「孩子自己给自己发奖状」：
 *   · child/cert-request —— 只能提交 pending，绝不能直接写成 approved
 *   · parent/cert-request —— 审批时必须限定在**当前选中的孩子**上
 *
 * 其中 parent 端的 `WHERE id = ? AND child_id = ?` 是典型的 IDOR 闸门：
 * 少了 `AND child_id = ?`，家长 A 就能凭猜测 id 去改家长 B 家孩子的申请状态。
 * 本文件把它钉住，并确认被拒时**申请状态不变**（不能只是「返回 404 但数据已改」）。
 *
 * 另：孩子端重复提交时返回的是 **200 + ok:false**（前端据 ok 判断），
 * 不是错误码 —— 这一点也固定下来，避免有人「顺手改成 409」破坏客户端逻辑。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 6601, role: 'parent' } as null | { id: number; role: string },
  childId: 6602 as number | null,
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));
vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return { ...actual, getChildId: vi.fn(async () => h.childId) };
});

import { GET as childGet, POST as childPost } from '@/app/api/child/cert-request/route';
import { PATCH as parentPatch } from '@/app/api/parent/cert-request/route';
import { getDb, ensureSchema } from '@/lib/db';

const MY_CHILD = 6602;
const OTHER_CHILD = 6605;

function req(body: unknown): NextRequest {
  return new Request('http://l/api/parent/cert-request', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const db = () => getDb();

async function seedFamily(pid: number, cid: number) {
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', 'p')",
    args: [pid, 'ct-p' + pid],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', 'c', ?)",
    args: [cid, 'ct-c' + cid, pid],
  });
}

async function addRequest(cid: number): Promise<number> {
  await db().execute({
    sql: "INSERT INTO cert_requests (child_id, status) VALUES (?, 'pending')",
    args: [cid],
  });
  const r = await db().execute({ sql: 'SELECT last_insert_rowid() AS id', args: [] });
  return Number(r.rows[0].id);
}

async function statusOf(id: number): Promise<{ status: string; decided: unknown }> {
  const r = await db().execute({
    sql: 'SELECT status, decided_at FROM cert_requests WHERE id = ?',
    args: [id],
  });
  return { status: String(r.rows[0]?.status), decided: r.rows[0]?.decided_at ?? null };
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: 6601, role: 'parent' };
  h.childId = MY_CHILD;
  const d = db();
  await seedFamily(6601, MY_CHILD);
  await seedFamily(6604, OTHER_CHILD);
  for (const c of [MY_CHILD, OTHER_CHILD]) {
    await d.execute({ sql: 'DELETE FROM cert_requests WHERE child_id = ?', args: [c] });
  }
});

describe('parent/cert-request · 审批只能作用于当前选中的孩子', () => {
  it('非家长 → 403', async () => {
    h.user = { id: MY_CHILD, role: 'child' };
    expect((await parentPatch(req({ id: 1, status: 'approved' }))).status).toBe(403);
  });

  it('参数非法 → 400', async () => {
    for (const bad of [{}, { id: 1 }, { status: 'approved' }, { id: 1, status: 'maybe' }]) {
      const res = await parentPatch(req(bad));
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
  });

  it('⚠️ 试图审批别人家孩子的申请 → 404，且申请状态不变（IDOR 闸门）', async () => {
    const otherId = await addRequest(OTHER_CHILD);
    const res = await parentPatch(req({ id: otherId, status: 'approved' }));
    console.log('  cross-child -> status=' + res.status);
    expect(res.status).toBe(404);
    const s = await statusOf(otherId);
    expect(s.status, '越权审批竟然改动了数据').toBe('pending');
    expect(s.decided).toBeNull();
  });

  it('审批自己孩子的申请 → 200，状态落库并写入 decided_at', async () => {
    const id = await addRequest(MY_CHILD);
    const res = await parentPatch(req({ id, status: 'approved' }));
    expect(res.status).toBe(200);
    const s = await statusOf(id);
    expect(s.status).toBe('approved');
    expect(s.decided).not.toBeNull();
  });

  it('拒绝同理 → 200，状态为 rejected', async () => {
    const id = await addRequest(MY_CHILD);
    expect((await parentPatch(req({ id, status: 'rejected' }))).status).toBe(200);
    expect((await statusOf(id)).status).toBe('rejected');
  });

  it('不存在的申请 id → 404', async () => {
    expect((await parentPatch(req({ id: 999999, status: 'approved' }))).status).toBe(404);
  });
});

describe('child/cert-request · 只能申请，不能自己批准', () => {
  it('非孩子角色 → 403（GET 与 POST 都要）', async () => {
    h.user = { id: 6601, role: 'parent' };
    expect((await childGet()).status).toBe(403);
    expect((await childPost()).status).toBe(403);
    expect(
      (
        await db().execute({
          sql: 'SELECT COUNT(*) AS n FROM cert_requests WHERE child_id = ?',
          args: [MY_CHILD],
        })
      ).rows[0].n
    ).toBe(0);
  });

  it('POST 只会写入 pending（绝不可能是 approved）', async () => {
    h.user = { id: MY_CHILD, role: 'child' };
    const res = await childPost();
    expect(res.status).toBe(200);
    const r = await db().execute({
      sql: 'SELECT status FROM cert_requests WHERE child_id = ?',
      args: [MY_CHILD],
    });
    expect(String(r.rows[0].status)).toBe('pending');
  });

  it('⚠️ 已有 pending 时重复提交 → 200 + ok:false，且不产生第二行', async () => {
    h.user = { id: MY_CHILD, role: 'child' };
    expect((await childPost()).status).toBe(200);
    const second = await childPost();
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.ok).toBe(false);
    expect(body.status).toBe('pending');
    const r = await db().execute({
      sql: 'SELECT COUNT(*) AS n FROM cert_requests WHERE child_id = ?',
      args: [MY_CHILD],
    });
    expect(Number(r.rows[0].n), '重复提交产生了多行').toBe(1);
  });

  it('GET 返回当前状态', async () => {
    h.user = { id: MY_CHILD, role: 'child' };
    await childPost();
    const res = await childGet();
    expect((await res.json()).status).toBe('pending');
  });
});
