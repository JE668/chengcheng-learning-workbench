// @vitest-environment node
/**
 * 节假日豁免（迁移 v20 + settleCastle 跳过语义）回归测试。
 *
 * 场景 A：豁免日漏卡 → 结算后无捣蛋萌可、萌可心情保持、连胜保留（不清零不加分）、
 *          last_settled_day 游标照常推进（豁免日之后补的漏卡仍会正常结算）。
 * 场景 B：同窗漏卡但非豁免日 → 正常进入惩罚阶梯（第 1 天心情 -1，无捣蛋）。
 *
 * 复用 castle-freeze.test 的基建模式：ensureSchema + 全局 getDb 单例 + 隔离 childId。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { settleCastle } from '@/lib/castle-penalty';
import { dateStr, addDays } from '@/lib/date';

const CHILD = 6202; // 与其他 castle 测试隔离的 childId
const d = (n: number) => addDays(dateStr(), -n);

async function cleanAll() {
  const db = getDb();
  for (const t of ['daily_checkins', 'troublemakers', 'moko_owned', 'inventory', 'growth_events']) {
    await db.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [CHILD] }).catch(() => {});
  }
  await db.execute({ sql: 'DELETE FROM holiday_exemptions', args: [] }).catch(() => {});
}

async function seedMissed(daysAgo: number, streak: number, exemptYesterday: boolean) {
  const db = getDb();
  await cleanAll();
  await db.execute({
    sql: `INSERT OR REPLACE INTO castle_state
          (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day, shield_equipped, last_stolen)
          VALUES (?, 100, 1000, 0, ?, ?, 0, 0)`,
    args: [CHILD, streak, d(daysAgo)],
  });
  await db.execute({
    sql: `INSERT OR REPLACE INTO moko_owned (id, child_id, moko_key, status, stage, mood)
          VALUES (1, ?, 'lemei', 'resident', 'friend', 3)`,
    args: [CHILD],
  });
  if (exemptYesterday) {
    await db.execute({
      sql: 'INSERT INTO holiday_exemptions (day) VALUES (?)',
      args: [d(1)],
    });
  }
}

async function troubleCount() {
  const r = await getDb().execute({
    sql: 'SELECT COUNT(*) n FROM troublemakers WHERE child_id = ?',
    args: [CHILD],
  });
  return Number(r.rows[0]?.n ?? 0);
}

async function mokoMood() {
  const r = await getDb().execute({
    sql: 'SELECT mood FROM moko_owned WHERE child_id = ?',
    args: [CHILD],
  });
  return Number(r.rows[0]?.mood ?? 0);
}

async function state() {
  const r = await getDb().execute({
    sql: 'SELECT streak_days, last_settled_day FROM castle_state WHERE child_id = ?',
    args: [CHILD],
  });
  return {
    streak: Number(r.rows[0]?.streak_days ?? 0),
    lastSettled: String(r.rows[0]?.last_settled_day ?? ''),
  };
}

describe('holiday exemptions · settleCastle', () => {
  beforeEach(async () => {
    await ensureSchema();
    await getDb().execute({
      sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
            VALUES (?, 'holiday-t', '', 'child', '假')`,
      args: [CHILD],
    });
  });

  it('豁免日漏卡：无捣蛋萌可、心情保持、连胜保留、游标推进', async () => {
    await seedMissed(2, 3, true);
    await settleCastle(CHILD, dateStr());

    expect(await troubleCount()).toBe(0);
    expect(await mokoMood()).toBe(3);
    const s = await state();
    expect(s.streak).toBe(3); // 豁免不清零也不加分
    expect(s.lastSettled).toBe(d(1)); // 游标照常推进，豁免日之后仍会正常结算
  });

  it('非豁免日漏卡：正常进入惩罚阶梯（第 1 天心情 -1，连胜清零）', async () => {
    await seedMissed(2, 3, false);
    await settleCastle(CHILD, dateStr());

    expect(await troubleCount()).toBe(0); // 第 1 天是善意提醒，无捣蛋
    expect(await mokoMood()).toBe(2); // 心情 -1
    const s = await state();
    expect(s.streak).toBe(0); // 连断
  });
});
