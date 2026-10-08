// @vitest-environment node
/**
 * children/[id]/select 的越权回归测试。
 *
 * 这条路由把「家长当前查看的孩子」写进 users.selected_child_id。
 * 攻击面：把 id 换成别的家长的孩子 —— 一旦通过，家长就能切到别人家孩子的视角，
 * 后续所有以 selected_child_id 为准的页面都会泄露/篡改对方数据（IDOR）。
 * 路由里已有归属校验（getChildrenOfParent + some），这里把它钉住。
 *
 * 同时验证「被拒时不得留下副作用」：403 之后 selected_child_id 必须保持原值。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: null as null | { id: number; role: 'parent' | 'child' },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
}));

import { POST } from '@/app/api/children/[id]/select/route';
import { getDb, ensureSchema } from '@/lib/db';

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}
function req(): Request {
  return new Request('http://l/api/children/1/select', { method: 'POST' });
}

async function seedFamily(pid: number, cid: number) {
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', '家长')",
    args: [pid, 'sp' + pid],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', '娃', ?)",
    args: [cid, 'sc' + cid, pid],
  });
}

async function selectedOf(pid: number): Promise<number | null> {
  const db = getDb();
  const r = await db.execute({
    sql: 'SELECT selected_child_id FROM users WHERE id = ?',
    args: [pid],
  });
  const v = r.rows[0]?.selected_child_id;
  return v === null || v === undefined ? null : Number(v);
}

describe('children/[id]/select · 不得越权切到别人的孩子', () => {
  beforeEach(async () => {
    await ensureSchema();
    h.user = null;
  });

  it('可以选中自己的孩子，并持久化 selected_child_id', async () => {
    await seedFamily(9200, 9201);
    h.user = { id: 9200, role: 'parent' };
    const res = await POST(req() as never, ctx('9201') as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.selectedId).toBe(9201);
    expect(await selectedOf(9200)).toBe(9201);
  });

  it('⚠️ 选中别人家的孩子 → 403，且不写入 selected_child_id', async () => {
    await seedFamily(9202, 9203); // 我
    await seedFamily(9204, 9205); // 别人
    h.user = { id: 9202, role: 'parent' };
    const res = await POST(req() as never, ctx('9205') as never);
    expect(res.status).toBe(403);
    expect(await selectedOf(9202), '被拒后仍写入了越权的孩子 id').toBeNull();
  });

  it('孩子角色 → 403', async () => {
    await seedFamily(9206, 9207);
    h.user = { id: 9207, role: 'child' };
    const res = await POST(req() as never, ctx('9207') as never);
    expect(res.status).toBe(403);
  });

  it('未登录 → 403', async () => {
    await seedFamily(9208, 9209);
    h.user = null;
    const res = await POST(req() as never, ctx('9209') as never);
    expect(res.status).toBe(403);
  });

  it('id 不是整数 → 400', async () => {
    await seedFamily(9210, 9211);
    h.user = { id: 9210, role: 'parent' };
    const res = await POST(req() as never, ctx('abc') as never);
    expect(res.status).toBe(400);
  });
});
