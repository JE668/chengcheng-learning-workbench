// @vitest-environment node
/**
 * 家长发放资源（造币口）的边界回归测试。
 * 路由：src/app/api/castle/grant/route.ts
 *
 * ## 这个路由在防什么
 * 家长可以给孩子发阳光 / 星星币 / 捕捉券，是全站「发资源」的唯一入口。
 * 两道防线：
 *   ① resource 白名单（sunlight / starCoins / tickets）——否则可写入任意列；
 *   ② amount 必须落在 1~100 ——否则一次就能发 1e9，属于无上限造币。
 *
 * 任一防线被放宽（白名单用 includes 换成透传、区间上限调高），测试立刻红。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PARENT = 7301;
const CHILD = 7311;

let currentUser: { id: number; username: string; role: 'parent' | 'child'; displayName: string } = {
  id: PARENT,
  username: 'gp',
  role: 'parent',
  displayName: '家长',
};

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    getCurrentUser: vi.fn(async () => currentUser),
    resolveChildId: vi.fn(async () => CHILD),
    requireParent: vi.fn(() => null),
    requireChild: vi.fn((u: unknown) => u),
  };
});

import { getDb, ensureSchema } from '@/lib/db';
import { POST } from '@/app/api/castle/grant/route';

const req = (body: unknown) =>
  new Request('http://localhost/api/castle/grant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;

/**
 * 读取当前余额，用于断言「非法请求没有真的发放」。
 *
 * ⚠️ 三种资源存在**两张表**：阳光/星星币在 castle_state，捕捉券在
 * capture_tickets（total - used 才是可用数）。断言必须覆盖两张表，
 * 否则「只改了另一张表」这类回归会漏过去。
 */
async function state(): Promise<{ sunlight: number; starCoins: number; tickets: number }> {
  await getDb().execute({
    sql: 'INSERT OR IGNORE INTO castle_state (child_id, sunlight, star_coins, prosperity) VALUES (?, 0, 0, 0)',
    args: [CHILD],
  });
  await getDb().execute({
    sql: 'INSERT OR IGNORE INTO capture_tickets (child_id, total, used) VALUES (?, 0, 0)',
    args: [CHILD],
  });
  const cs = await getDb().execute({
    sql: 'SELECT sunlight, star_coins FROM castle_state WHERE child_id = ?',
    args: [CHILD],
  });
  const ct = await getDb().execute({
    sql: 'SELECT total, used FROM capture_tickets WHERE child_id = ?',
    args: [CHILD],
  });
  return {
    sunlight: Number(cs.rows[0]?.sunlight ?? 0),
    starCoins: Number(cs.rows[0]?.star_coins ?? 0),
    tickets: Number(ct.rows[0]?.total ?? 0) - Number(ct.rows[0]?.used ?? 0),
  };
}

/**
 * 清理该孩子名下的所有数据。
 *
 * ⚠️ 必须**先删子表、再删 users**：libsql 默认开启外键约束
 * （SQLITE_CONSTRAINT_FOREIGNKEY），users 行被 castle_state /
 * capture_tickets / moko_owned / growth_events 引用时直接删会报错。
 * 这四张表都是 schema 里带 `FOREIGN KEY(child_id) REFERENCES users(id)` 的。
 */
async function resetResources() {
  for (const t of ['castle_state', 'capture_tickets', 'moko_owned', 'growth_events']) {
    await getDb().execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [CHILD] });
  }
}

beforeEach(async () => {
  await ensureSchema();
  // ⚠️ 清理顺序必须是「先子表、后 users」：libsql 默认开启外键约束
  // （SQLITE_CONSTRAINT_FOREIGNKEY），users 行被 castle_state /
  // capture_tickets 引用时直接删除会报错。
  await resetResources();
  await getDb().execute({ sql: 'DELETE FROM users WHERE id >= ?', args: [7300] });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, 'gp', '', 'parent', '家长')`,
    args: [PARENT],
  });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, 'gc', '', 'child', '娃', ?)`,
    args: [CHILD, PARENT],
  });
  await resetResources();
  currentUser = { id: PARENT, username: 'gp', role: 'parent', displayName: '家长' };
});

describe('POST /api/castle/grant · 资源发放边界', () => {
  it('正常发放：阳光 +5', async () => {
    await state();
    const res = await POST(req({ resource: 'sunlight', amount: 5 }));
    expect(res.status).toBe(200);
    expect((await state()).sunlight).toBe(5);
  });

  it('超大数额被拒（1e9 造币）且不写库', async () => {
    await state();
    const before = await state();
    const res = await POST(req({ resource: 'sunlight', amount: 1e9 }));
    expect(res.status).toBe(400);
    expect((await state()).sunlight, '超大数额竟然生效了').toBe(before.sunlight);
  });

  it('非法数额（0 / 负数 / NaN / 字符串）被拒且不写库', async () => {
    await state();
    for (const bad of [0, -1, -1e9, 'abc', null, Number.NaN]) {
      const res = await POST(req({ resource: 'sunlight', amount: bad }));
      expect(res.status, `amount=${String(bad)} 应被拒`).toBe(400);
    }
    expect((await state()).sunlight).toBe(0);
  });

  it('非白名单资源被拒且不写库', async () => {
    await state();
    for (const bad of ['gold', 'points', '', '__proto__', 'sunlight ', null]) {
      const res = await POST(req({ resource: bad, amount: 10 }));
      expect(res.status, `resource=${String(bad)} 应被拒`).toBe(400);
    }
    expect((await state()).sunlight).toBe(0);
  });

  it('缺 amount 被拒（避免 undefined 变成 NaN 后漏过校验）', async () => {
    await state();
    const res = await POST(req({ resource: 'sunlight' }));
    expect(res.status).toBe(400);
    expect((await state()).sunlight).toBe(0);
  });

  it('边界值 1 与 100 允许通过', async () => {
    await state();
    expect((await POST(req({ resource: 'sunlight', amount: 1 }))).status).toBe(200);
    expect((await POST(req({ resource: 'starCoins', amount: 100 }))).status).toBe(200);
    const s = await state();
    expect(s.sunlight).toBe(1);
    expect(s.starCoins).toBe(100);
  });

  it('孩子角色调用返回 403 且不发放', async () => {
    await state();
    currentUser = { id: CHILD, username: 'gc', role: 'child', displayName: '娃' };
    const res = await POST(req({ resource: 'sunlight', amount: 100 }));
    expect(res.status).toBe(403);
    expect((await state()).sunlight, '孩子给自己发了资源').toBe(0);
  });

  it('未登录返回 403', async () => {
    await state();
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const res = await POST(req({ resource: 'sunlight', amount: 100 }));
    expect(res.status).toBe(403);
    expect((await state()).sunlight).toBe(0);
  });
});
