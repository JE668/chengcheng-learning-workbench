// @vitest-environment node
/**
 * 任务领积分防重放回归测试（路由：src/app/api/tasks/[id]/complete/route.ts）。
 *
 * ## 这个路由在防什么
 * 孩子完成家长布置的任务后领积分。全站最直接的造分口 —— 唯一防线是
 * SQL 里的 `INSERT INTO completions ... WHERE NOT EXISTS (...)` 加上
 * `rowsAffected === 0 → 409`。
 *
 * ## 缺陷风险
 * SQL 漏掉 NOT EXISTS 时，孩子反复点「领取」就能无限刷积分。
 *
 * 注：验证这些断言的有效性时试过把 `rowsAffected === 0` 改成
 * `!rowsAffected` —— 结果测试**仍然全绿**。原因是 rowsAffected 为 0 时，
 * `!0` 同样是 true，两条路径行为完全等价，那样的改动并不构成缺陷。
 * 真正能触发红灯的是漏掉 SQL 里的 NOT EXISTS（实测 3 项失败）。
 *
 * 这些断言在防重放逻辑被破坏时必然失败。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CHILD_ID = 9101;
const PARENT_ID = 9102;

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: CHILD_ID,
    username: 'replay-child',
    role: 'child',
    displayName: '测试娃',
  })),
  verifyPassword: vi.fn(() => true),
  resolveChildId: vi.fn(async () => CHILD_ID),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema, getChildPoints } from '@/lib/db';
import { POST } from '@/app/api/tasks/[id]/complete/route';

/**
 * 动态路由的 params 在 Next 15 是 **Promise**，必须传 Promise.resolve(...)。
 * 直接传普通对象会在 `await params` 处炸掉。
 */
const ctx = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });
const req = () => new Request('http://localhost/api/tasks/1/complete', { method: 'POST' }) as never;

beforeEach(async () => {
  await ensureSchema();
  // ⚠️ 必须先建 users 行：libsql 的原生 sqlite3 后端默认开启外键约束，
  // completions.child_id 指向不存在的行会抛 SQLITE_CONSTRAINT_FOREIGNKEY。
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'replay-child', '', 'child', '测试娃')`,
    args: [CHILD_ID],
  });
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'replay-parent', '', 'parent', '家长')`,
    args: [PARENT_ID],
  });
  await getDb().execute({ sql: 'DELETE FROM completions', args: [] });
  await getDb().execute({ sql: 'DELETE FROM tasks', args: [] });
  await getDb().execute({
    sql: "INSERT INTO tasks (id, title, subject, points, created_by) VALUES (1, '读课文', '语文', 20, ?)",
    args: [PARENT_ID],
  });
});

describe('POST /api/tasks/[id]/complete · 防重放刷积分', () => {
  it('首次领取成功并返回余额', async () => {
    const res = await POST(req(), ctx(1));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.gained).toBe(20);
    expect(data.balance).toBe(20);
  });

  it('重复领取返回 409，且 completions 只有 1 行（防重放核心断言）', async () => {
    await POST(req(), ctx(1));
    const res2 = await POST(req(), ctx(1));

    expect(res2.status).toBe(409);
    expect((await res2.json()).error).toContain('已经领取过');

    // 状态码之外再断言库状态 —— 防止「返回了 409 但其实已经写进去了」
    const rows = await getDb().execute({
      sql: 'SELECT COUNT(*) as c FROM completions WHERE task_id = 1 AND child_id = ?',
      args: [CHILD_ID],
    });
    expect(Number(rows.rows[0].c), '重复领取却写入了多条记录').toBe(1);
  });

  it('重复领取后积分余额不变（不会被刷高）', async () => {
    const first = await POST(req(), ctx(1));
    const before = (await first.json()).balance;
    await POST(req(), ctx(1));
    await POST(req(), ctx(1));
    expect(await getChildPoints(CHILD_ID), '重复领取把积分刷高了').toBe(before);
  });

  it('并发领取同一任务：completions 只 1 行、积分只加一次', async () => {
    // 真并发才抓得住 —— 串行调用时第 2 次会被 NOT EXISTS 直接挡住。
    //
    // 断言口径说明：这里**不断言「有几个请求返回 200」**。实测 libSQL 的
    // 单连接已把语句串行化，三个请求可能全部返回 200 ——但关键不变量
    // （completions 1 行、积分 +20）依然成立。真正要守住的是数据，
    // 不是响应码的个数。
    await Promise.allSettled([POST(req(), ctx(1)), POST(req(), ctx(1)), POST(req(), ctx(1))]);
    const rows = await getDb().execute({
      sql: 'SELECT COUNT(*) as c FROM completions WHERE task_id = 1 AND child_id = ?',
      args: [CHILD_ID],
    });
    expect(Number(rows.rows[0].c), '并发下写入了多条 completion').toBe(1);
    expect(await getChildPoints(CHILD_ID), '并发下积分被重复累加').toBe(20);
  });

  it('不存在的任务返回 404', async () => {
    const res = await POST(req(), ctx(9999));
    expect(res.status).toBe(404);
  });

  it('非法 id（NaN / 0 / 负数）返回 404 且不写库', async () => {
    for (const bad of ['abc', '1e999', 0, -1, 1.5]) {
      const res = await POST(req(), ctx(bad));
      expect(res.status, `id=${bad} 应返回 404`).toBe(404);
    }
    const rows = await getDb().execute({ sql: 'SELECT COUNT(*) as c FROM completions', args: [] });
    expect(Number(rows.rows[0].c)).toBe(0);
  });

  it('孩子以外的账号返回 403', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: PARENT_ID,
      username: 'p',
      role: 'parent',
      displayName: '家长',
    });
    const res = await POST(req(), ctx(1));
    expect(res.status).toBe(403);
  });
});
