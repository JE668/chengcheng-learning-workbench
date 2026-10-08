// @vitest-environment node
/**
 * 时光沙漏补打卡的日期校验回归测试。
 * 路由：src/app/api/castle/use-item/route.ts
 *
 * ## 这个路由在防什么
 * 孩子用时光沙漏补某一天的卡。applyTimeGlass 会按传入日期重写
 * streak_days / prosperity / last_settled_day —— **日期就是伪造连击的入口**。
 *
 * 原实现直接 `String(day)` 强转就传给库函数，不校验的话可以：
 *  - 补未来日期 → 连击无限往前推
 *  - 补任意历史日期 → 改写早就结算过的历史，污染连胜统计
 *
 * 现补三道校验：格式 `^\d{4}-\d{2}-\d{2}$`、不能 >= 今天、不能早于 30 天。
 *
 * ⚠️ 这些断言在日期校验被移除时必然失败 —— 修复本身不能没有回归测试，
 * 否则随时可能被再次移除。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CHILD = 7401;

let currentUser: { id: number; username: string; role: 'parent' | 'child'; displayName: string } = {
  id: CHILD,
  username: 'uc',
  role: 'child',
  displayName: '娃',
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

import { getDb } from '@/lib/db';
import { dateStr, addDays } from '@/lib/date';
import { POST } from '@/app/api/castle/use-item/route';
import { seedChild } from '@/lib/test-child-fixtures';

const req = (body: unknown) =>
  new Request('http://localhost/api/castle/use-item', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
/**
 * 每个用例前重建干净的子账号。
 *
 * 清理逻辑见 lib/test-child-fixtures.ts：schema 里有 16 张表带
 * `FOREIGN KEY(child_id) REFERENCES users(id)`，删 users 前必须先清空它们，
 * 手工维护列表极易漏。
 */
async function resetAll() {
  await seedChild(CHILD, 'uc');
  await getDb().execute({
    sql: `INSERT INTO inventory (child_id, item_key, qty) VALUES (?, 'timeglass', 5)`,
    args: [CHILD],
  });
  currentUser = { id: CHILD, username: 'uc', role: 'child', displayName: '娃' };
}

beforeEach(resetAll);

describe('POST /api/castle/use-item · 补打卡日期校验', () => {
  it('未来日期被拒（伪造连击的主要手段）', async () => {
    const future = addDays(dateStr(), 1);
    const res = await POST(req({ itemKey: 'timeglass', day: future }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('只能补今天之前');
  });

  it('今天被拒（补当天没有意义，且会与结算冲突）', async () => {
    const res = await POST(req({ itemKey: 'timeglass', day: dateStr() }));
    expect(res.status).toBe(400);
  });

  it('远超 30 天的历史日期被拒', async () => {
    const old = addDays(dateStr(), -31);
    const res = await POST(req({ itemKey: 'timeglass', day: old }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('30 天');
  });

  it('格式非法的日期被拒（不依赖库的 Date 解析）', async () => {
    for (const bad of ['2024/01/01', '20240101', 'abc', '', '   ', '2024-1-1', '2024-01-32']) {
      const res = await POST(req({ itemKey: 'timeglass', day: bad }));
      expect(res.status, `day=${JSON.stringify(bad)} 应被拒`).toBe(400);
    }
  });

  it('缺 day / 非字符串 day 被拒', async () => {
    for (const bad of [undefined, null, 123, {}, []]) {
      const res = await POST(req({ itemKey: 'timeglass', day: bad }));
      expect(res.status, `day=${JSON.stringify(bad)} 应被拒`).toBe(400);
    }
  });

  it('合法日期通过校验（确认真实路径未被误伤）', async () => {
    // 昨天：格式合法、不在未来、30 天内 —— 应进入 applyTimeGlass
    const yesterday = addDays(dateStr(), -1);
    const res = await POST(req({ itemKey: 'timeglass', day: yesterday }));
    // 不要求 200：可能因为「昨天没漏打卡」而业务失败，但**绝不该是日期校验的 400**
    const data = await res.json().catch(() => ({}));
    if (res.status === 400) {
      expect(String(data.message)).not.toContain('只能补');
    } else {
      expect(res.status).toBe(200);
    }
  });

  it('30 天窗口边界恰好允许（-30 天不被拒）', async () => {
    const edge = addDays(dateStr(), -30);
    const res = await POST(req({ itemKey: 'timeglass', day: edge }));
    if (res.status === 400) {
      expect(String((await res.json()).message)).not.toContain('30 天');
    }
  });

  it('非法日期不会消耗沙漏', async () => {
    await POST(req({ itemKey: 'timeglass', day: addDays(dateStr(), 1) }));
    const q = await getDb().execute({
      sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
      args: [CHILD, 'timeglass'],
    });
    expect(Number(q.rows[0].qty), '日期非法却把沙漏扣掉了').toBe(5);
  });

  it('家长角色调用返回 403', async () => {
    currentUser = { id: 7402, username: 'up', role: 'parent', displayName: '家长' };
    const res = await POST(req({ itemKey: 'timeglass', day: addDays(dateStr(), -1) }));
    expect(res.status).toBe(403);
  });

  it('未登录返回 403', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const res = await POST(req({ itemKey: 'timeglass', day: addDays(dateStr(), -1) }));
    expect(res.status).toBe(403);
  });
});
