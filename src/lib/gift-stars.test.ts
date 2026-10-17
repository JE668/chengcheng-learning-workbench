// @vitest-environment node
/**
 * ⭐ 星星币互赠回归测试：
 * - 兄妹间成功转账（扣我 + 加你，同一事务）
 * - 余额不足 → 拒绝且双方余额不变
 * - 金额越界（0/51/小数）→ 400
 * - 非同家庭孩子 → 403
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { POST } from '@/app/api/gift-stars/route';

// 直接构造带 session 的请求比较繁琐，这里走 handler 层最简 mock：
// gift-stars 的鉴权用 getCurrentUser（读 cookies），vitest 里 mock 掉。
import { vi } from 'vitest';

const P1 = 7401; // 家庭1 家长
const A1 = 7402;
const B1 = 7403;
const C2 = 7404; // 家庭2 的孩子（IDOR 试探对象）

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({ id: A1, username: 'a1', role: 'child', displayName: '大宝' })),
}));

function req(body: unknown) {
  return new Request('http://x/api/gift-stars', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

async function coins(id: number) {
  const r = await getDb().execute({
    sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?',
    args: [id],
  });
  return Number(r.rows[0]?.star_coins ?? 0);
}

async function seed() {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, 'g-p', '', 'parent', '家长1', NULL), (?, 'g-a', '', 'child', '大宝', ?),
                 (?, 'g-b', '', 'child', '二宝', ?), (?, 'g-p2', '', 'parent', '家长2', NULL),
                 (?, 'g-c', '', 'child', '别人家', ?)`,
    args: [P1, A1, P1, B1, P1, 99999, C2, 99999],
  });
  await db.execute({
    sql: `INSERT OR REPLACE INTO castle_state (child_id, star_coins) VALUES (?, 30), (?, 0), (?, 0)`,
    args: [A1, B1, C2],
  });
}

describe('gift stars', () => {
  beforeEach(async () => {
    await ensureSchema();
    await seed();
  });

  it('兄妹间成功转账：扣我加你', async () => {
    const res = await POST(req({ toChildId: B1, amount: 10 }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.ok).toBe(true);
    expect(await coins(A1)).toBe(20);
    expect(await coins(B1)).toBe(10);
  });

  it('余额不足：拒绝且双方不变', async () => {
    const res = await POST(req({ toChildId: B1, amount: 999 }));
    expect(res.status).toBe(400);
    expect(await coins(A1)).toBe(30);
    expect(await coins(B1)).toBe(0);
  });

  it('金额越界拒绝：0 / 51 / 小数', async () => {
    expect((await POST(req({ toChildId: B1, amount: 0 }))).status).toBe(400);
    expect((await POST(req({ toChildId: B1, amount: 51 }))).status).toBe(400);
    expect((await POST(req({ toChildId: B1, amount: 3.5 }))).status).toBe(400);
  });

  it('非同家庭孩子拒绝（IDOR）', async () => {
    const res = await POST(req({ toChildId: C2, amount: 5 }));
    expect(res.status).toBe(403);
    expect(await coins(A1)).toBe(30);
    expect(await coins(C2)).toBe(0);
  });
});
