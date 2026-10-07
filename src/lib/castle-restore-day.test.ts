/**
 * 时光沙漏补打卡（restoreDay）的结算游标回归测试。
 *
 * ## 缺陷（B7，已实测确认）
 * restoreDay 末尾执行 `UPDATE castle_state SET last_settled_day = day`，
 * 把「已结算到哪一天」这个**只应由 settleCastle 单向推进的游标**回退到被补的那一天。
 *
 * 实测后果：
 *   连漏 5 天 → settleCastle 结算到昨天（last_settled=昨天，惩罚已施加）
 *   → 家长用时光沙漏补**最老**的一天
 *   → last_settled 被回退到那一天（实测 10-06 → 10-02）
 *   → 中间这几天**永远不会被 settleCastle 再次结算**，惩罚被静默吞掉。
 *
 * ## 同时否证的报告项（B8，agent 报告称"连胜会少算"）
 * 经实测：补卡后 streak_days 计算是**正确**的。
 *   场景「d4,d3,d2 全勤 + d1 漏卡，补 d1」→ streak=4（正确）
 *   场景「先 settleCastle 结算到昨天，再补 d1」→ streak=4（正确）
 * 因为回溯只统计 `day` 之前的连续全勤，与 last_settled_day 无关。
 * 故 B8 不成立，本测试把它也固化下来防止将来改坏。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 8201,
    username: 'rd',
    role: 'child',
    displayName: '娃',
  })),
  resolveChildId: vi.fn(async () => 8201),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { restoreDay } from '@/lib/castle';
import { settleCastle } from '@/lib/castle-penalty';
import { dateStr, addDays } from '@/lib/date';

const CHILD = 8201;
const d = (n: number) => addDays(dateStr(), -n);

async function confirmAll(day: string) {
  for (const s of ['语文', '数学', '英语']) {
    await getDb().execute({
      sql: `INSERT OR IGNORE INTO daily_checkins (child_id, day, subject, status, confirmed_at)
            VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP)`,
      args: [CHILD, day, s],
    });
  }
}

async function seedCastle(lastSettledDay: string, streak: number, star = 1000) {
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'rd', '', 'child', '娃')`,
    args: [CHILD],
  });
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO castle_state
          (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day, shield_equipped, last_stolen)
          VALUES (?, 0, ?, 0, ?, ?, 0, 0)`,
    args: [CHILD, star, streak, lastSettledDay],
  });
  await getDb().execute({ sql: 'DELETE FROM daily_checkins WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({ sql: 'DELETE FROM moko_owned WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({ sql: 'DELETE FROM troublemakers WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({ sql: 'DELETE FROM inventory WHERE child_id = ?', args: [CHILD] });
}

async function readSettled() {
  const r = (
    await getDb().execute({
      sql: 'SELECT last_settled_day, streak_days FROM castle_state WHERE child_id = ?',
      args: [CHILD],
    })
  ).rows[0];
  return { lastSettled: String(r?.last_settled_day ?? ''), streak: Number(r?.streak_days ?? 0) };
}

beforeEach(async () => {
  await ensureSchema();
});

describe('restoreDay · 结算游标不可回退（B7 回归）', () => {
  it('补「最老」的一天后，last_settled_day 不得回退（否则中间几天永不结算）', async () => {
    await seedCastle(d(6), 0);
    // 6 天前是哨兵，此后 5 天全部漏卡 → settleCastle 会结算到昨天
    await settleCastle(CHILD, dateStr());
    const afterSettle = await readSettled();
    expect(afterSettle.lastSettled, '结算后应推进到昨天').toBe(d(1));

    // 家长用时光沙漏补最老的那一天
    await restoreDay(CHILD, d(5));

    const after = await readSettled();
    expect(
      after.lastSettled,
      `last_settled_day 被回退到 ${after.lastSettled}，中间 4 天将永不结算`
    ).toBe(afterSettle.lastSettled);
    expect(after.lastSettled).not.toBe(d(5));
  });

  it('连漏 5 天后补最老一天：中间天数的惩罚仍会被结算（不被静默吞掉）', async () => {
    await seedCastle(d(6), 0);
    await settleCastle(CHILD, dateStr());
    const penBefore = (
      await getDb().execute({
        sql: "SELECT COUNT(*) AS n FROM growth_events WHERE child_id = ? AND type = 'penalty'",
        args: [CHILD],
      })
    ).rows[0];

    await restoreDay(CHILD, d(5));

    // 补卡后再结算一次，验证游标仍在有效位置（而不是停在 d5 之后永不推进）
    await settleCastle(CHILD, dateStr());
    const after = await readSettled();
    expect(after.lastSettled, '补卡后仍应能继续结算到昨天').toBe(d(1));
    expect(Number(penBefore?.n ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it('last_settled_day 为空时才用被补的那天兜底', async () => {
    // 全新库场景：从未结算过
    await getDb().execute({
      sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
            VALUES (?, 'rd', '', 'child', '娃')`,
      args: [CHILD],
    });
    await getDb().execute({
      sql: `INSERT OR REPLACE INTO castle_state
            (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day, shield_equipped, last_stolen)
            VALUES (?, 0, 100, 0, 0, NULL, 0, 0)`,
      args: [CHILD],
    });
    await getDb().execute({ sql: 'DELETE FROM daily_checkins WHERE child_id = ?', args: [CHILD] });
    await getDb().execute({ sql: 'DELETE FROM moko_owned WHERE child_id = ?', args: [CHILD] });
    await getDb().execute({ sql: 'DELETE FROM troublemakers WHERE child_id = ?', args: [CHILD] });

    await restoreDay(CHILD, d(2));

    const after = await readSettled();
    expect(after.lastSettled, '未结算过时用被补那天兜底').toBe(d(2));
  });
});

describe('restoreDay · 连胜回溯正确性（否证 B8，固化既有行为）', () => {
  it('d4/d3/d2 全勤 + d1 漏卡 → 补 d1 后 streak 应为 4', async () => {
    await seedCastle(d(1), 1);
    await confirmAll(d(4));
    await confirmAll(d(3));
    await confirmAll(d(2));

    await restoreDay(CHILD, d(1));

    const after = await readSettled();
    expect(after.streak, `streak=${after.streak}，应为 4（四天连续全勤）`).toBe(4);
  });

  it('先结算到昨天，再补漏卡日 → streak 仍正确', async () => {
    await seedCastle(d(5), 0);
    await confirmAll(d(4));
    await confirmAll(d(3));
    await confirmAll(d(2));
    // 先正常结算（d1 漏卡会被罚，连胜归零）
    await settleCastle(CHILD, dateStr());

    await restoreDay(CHILD, d(1));

    const after = await readSettled();
    expect(after.streak, `streak=${after.streak}，应为 4`).toBe(4);
  });
});
