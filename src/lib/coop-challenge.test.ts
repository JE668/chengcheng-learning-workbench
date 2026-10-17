// @vitest-environment node
/**
 * 🤝 组队挑战结算回归测试（迁移 v22）：
 * - 匹配模块完成 → 进度记录；全员完成 → 各 +5 星星币，恰好一次（rewarded 抢锁防双发）
 * - 不匹配模块 / 已结算后迟到完成 → 不触发
 * - 单娃家庭不结算（组队无意义）
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { recordCoopProgress, COOP_REWARD_STARS } from './coop-challenge';
import { dateStr } from './date';

const PARENT = 7301;
const A = 7302;
const B = 7303;

async function seedFamily() {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, 'coop-p', '', 'parent', '家长', NULL)`,
    args: [PARENT],
  });
  for (const [id, name] of [
    [A, '大宝'],
    [B, '二宝'],
  ] as const) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
            VALUES (?, ?, '', 'child', ?, ?)`,
      args: [id, `coop-${id}`, name, PARENT],
    });
    await db.execute({
      sql: `INSERT OR REPLACE INTO castle_state (child_id, star_coins) VALUES (?, 100)`,
      args: [id],
    });
  }
  // 今日挑战：凑十法
  await db.execute({
    sql: `INSERT OR REPLACE INTO coop_challenges (day, module_key, module_label, created_by)
          VALUES (?, 'make-ten', '凑十法', ?)`,
    args: [dateStr(), PARENT],
  });
  await db.execute({ sql: 'DELETE FROM coop_challenge_progress', args: [] });}

async function coins(childId: number) {
  const r = await getDb().execute({
    sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?',
    args: [childId],
  });
  return Number(r.rows[0]?.star_coins ?? 0);
}

describe('coop challenge settlement', () => {
  beforeEach(async () => {
    await ensureSchema();
    await seedFamily();
  });

  it('不匹配的模块不记进度', async () => {
    await recordCoopProgress(A, 'poems');
    const done = await getDb().execute({ sql: 'SELECT COUNT(*) n FROM coop_challenge_progress', args: [] });
    expect(Number(done.rows[0]?.n)).toBe(0);
  });

  it('单人完成不发奖；全员完成各 +5 且只发一次', async () => {
    await recordCoopProgress(A, 'make-ten');
    expect(await coins(A)).toBe(100); // 二宝没完成，不结算

    await recordCoopProgress(B, 'make-ten'); // 全员达成
    expect(await coins(A)).toBe(100 + COOP_REWARD_STARS);
    expect(await coins(B)).toBe(100 + COOP_REWARD_STARS);

    // 迟到的重复完成（同一人再报）不重发
    await recordCoopProgress(B, 'make-ten');
    expect(await coins(A)).toBe(100 + COOP_REWARD_STARS);
    expect(await coins(B)).toBe(100 + COOP_REWARD_STARS);
  });

  it('并发抢锁：两个完成同时到达，奖励只发一轮', async () => {
    // A 先完成（未触发），再并发 B 和（已完成的）A 一起报
    await recordCoopProgress(A, 'make-ten');
    await Promise.all([recordCoopProgress(B, 'make-ten'), recordCoopProgress(B, 'make-ten')]);
    expect(await coins(A)).toBe(100 + COOP_REWARD_STARS);
    expect(await coins(B)).toBe(100 + COOP_REWARD_STARS);
  });
});
