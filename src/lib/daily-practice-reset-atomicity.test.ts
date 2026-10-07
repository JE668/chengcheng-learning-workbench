// @vitest-environment node
/**
 * 时光沙漏重置的原子性回归测试（路由：src/app/api/daily-practice/reset/route.ts）。
 *
 * ## 缺陷（实测证实）
 * ① **道具白扣**：原实现先扣沙漏，再调 generateQuestions()，最后 UPDATE。
 *    实测把 generateQuestions mock 成抛错，起始 **1 个沙漏直接变 0**，
 *    而重置并未成功 —— 孩子的道具白没了。
 * ② **qty 被扣成负数**：扣减语句 `qty = qty - 1` 缺少 `AND qty > 0`。
 *    前面的「检查 qty>0」与实际扣减之间存在时间窗，并发请求（连点两次、
 *    多标签页）会双双通过检查后各扣一次。实测：起始 1，连扣 3 次得 **-2**。
 *    负数 qty 会让后续所有 `qty > 0` 判断失效，等于凭空刷道具。
 *
 * 修复：先生成题目（最可能失败且无副作用），再用 BEGIN IMMEDIATE 事务
 * 包住「扣减 + 重置」，并给扣减加 `AND qty > 0` 作为并发下的最后闸门。
 *
 * 这些断言在修复前必然失败。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = {
  id: 7701,
  username: 'reset-child',
  role: 'child' as const,
  displayName: '测试娃',
};
let generateImpl: () => unknown[] = () => [{ q: 1 }];

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => mockUser),
  resolveChildId: vi.fn(async () => mockUser.id),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

// generateQuestions 单独 mock：既能正常返回，也能被切换成抛错以模拟失败路径
vi.mock('@/lib/daily-practice', () => ({
  generateQuestions: vi.fn(async () => generateImpl()),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { POST } from '@/app/api/daily-practice/reset/route';

const CHILD = 7701;

async function seed(qty: number, completed: number) {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'reset-child', '', 'child', '测试娃')`,
    args: [CHILD],
  });
  await getDb().execute({ sql: 'DELETE FROM inventory WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({
    sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, ?)',
    args: [CHILD, 'timeglass', qty],
  });
  await getDb().execute({ sql: 'DELETE FROM daily_practice WHERE child_id = ?', args: [CHILD] });
  const today = new Date().toISOString().slice(0, 10);
  await getDb().execute({
    sql: `INSERT INTO daily_practice (child_id, day, completed, correct, total, questions)
          VALUES (?, ?, ?, 3, 3, '[{"q":1}]')`,
    args: [CHILD, today, completed],
  });
}

async function timeglassQty(): Promise<number> {
  const r = await getDb().execute({
    sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
    args: [CHILD, 'timeglass'],
  });
  return Number(r.rows[0]?.qty ?? 0);
}

beforeEach(() => {
  generateImpl = () => [{ q: 1 }];
});

describe('POST /api/daily-practice/reset · 道具扣减原子性', () => {
  it('正常路径：扣 1 个沙漏并重置成功', async () => {
    await seed(2, 1);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await timeglassQty()).toBe(1);
  });

  it('道具不会被扣成负数（并发同时到达，只应成功 1 次）', async () => {
    await seed(1, 1);
    // 真并发：前端的「检查 qty>0」与真正的扣减之间存在时间窗，
    // 同一秒连点两次（或多标签页）会双双通过检查后各扣一次。
    // 串行调用抓不到这个 bug —— 第 2 次会被前置检查拦下；
    // 必须并发才复现。
    const results = await Promise.allSettled([POST(), POST(), POST()]);
    const okCount = results.filter((r) => r.status === 'fulfilled').length;
    const qty = await timeglassQty();
    expect(qty, `qty 被扣成 ${qty}，负数会让后续 qty>0 判断全部失效`).toBeGreaterThanOrEqual(0);
    expect(okCount, '只有 1 个沙漏，却有多个请求报告成功').toBeLessThanOrEqual(1);
  });

  it('生成题目失败时沙漏不被扣掉（修复前会白扣）', async () => {
    await seed(1, 1);
    generateImpl = () => {
      throw new Error('出题失败');
    };
    await POST().catch(() => {});
    expect(await timeglassQty(), '重置失败了，沙漏却被扣掉了（道具白扣）').toBe(1);
  });

  it('沙漏不足时返回 400 且不改动数据', async () => {
    await seed(0, 1);
    const res = await POST();
    expect(res.status).toBe(400);
    expect(await timeglassQty()).toBe(0);
  });

  it('今天没完成一练时返回 400 且不扣道具', async () => {
    await seed(2, 0);
    const res = await POST();
    expect(res.status).toBe(400);
    expect(await timeglassQty(), '未完成一练不该扣道具').toBe(2);
  });

  it('非孩子角色返回 403', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      username: 'p',
      role: 'parent',
      displayName: '家长',
    });
    await seed(2, 1);
    const res = await POST();
    expect(res.status).toBe(403);
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never);
  });
});
