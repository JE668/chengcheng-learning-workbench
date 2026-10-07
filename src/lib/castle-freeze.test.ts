/**
 * 护盾 / 冰冻徽章的**文案契约**回归测试。
 *
 * 文案（src/app/(child)/castle/page.tsx:362-365）是产品意图的权威来源：
 *   - 护盾：「已自动装备，能帮乐美挡住一次捣蛋萌可」
 *   - 冰冻：「下次漏卡时自动消耗，保护连胜不中断」
 *
 * ## 审查结论（重要，避免后人重复踩坑）
 * 我曾按 agent 报告改过冰冻徽章的「consecutiveMissed 不重置 / streak 被清零」，
 * 但经**实测比对**（多种窗口长度下回退 vs 修复逐项对比惩罚序列与星星币余额），
 * 修复前后结果**完全一致**，因为：
 *
 *   1. 冰冻总是在结算遇到的**第一个漏卡日**被消耗（循环按时间正序遍历，
 *      走到该日时 streak 尚未被清零），所以「前面几天已把 streak 清零」
 *      这个前提在真实流程中不成立；
 *   2. 消耗后 `consecutiveMissed` 本就是 0（刚由 `consecutiveMissed++` 升到 1，
 *      但那一行被 frozen 分支跳过），所以「重置为 0」是无操作。
 *
 * 因此判定：**冰冻徽章实现与文案一致，无需修改**，那次改动已回滚。
 * 本测试固化的就是当前的正确行为，防止将来被「好心」改坏。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 6101,
    username: 'fz',
    role: 'child',
    displayName: '娃',
  })),
  resolveChildId: vi.fn(async () => 6101),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { settleCastle } from '@/lib/castle-penalty';
import { dateStr, addDays } from '@/lib/date';

const CHILD = 6101;
const d = (n: number) => addDays(dateStr(), -n);

async function setup() {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'fz', '', 'child', '娃')`,
    args: [CHILD],
  });
}

/** 造场景：lastSettledDaysAgo 天前是结算哨兵，此后全部漏卡（无一条确认记录）。 */
async function seedMissedStreak(lastSettledDaysAgo: number, freezeCount: number) {
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO castle_state
          (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day, shield_equipped, last_stolen)
          VALUES (?, 100, 1000, 0, 10, ?, 0, 0)`,
    args: [CHILD, d(lastSettledDaysAgo)],
  });
  await getDb().execute({ sql: 'DELETE FROM inventory WHERE child_id = ?', args: [CHILD] });
  if (freezeCount > 0) {
    await getDb().execute({
      sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, ?)',
      args: [CHILD, 'freeze', freezeCount],
    });
  }
  await getDb().execute({ sql: 'DELETE FROM daily_checkins WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({ sql: 'DELETE FROM troublemakers WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({ sql: 'DELETE FROM moko_owned WHERE child_id = ?', args: [CHILD] });
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO moko_owned (id, child_id, moko_key, status, stage, mood)
          VALUES (1, ?, 'lemei', 'resident', 'friend', 3)`,
    args: [CHILD],
  });
}

async function readState() {
  const r = (
    await getDb().execute({
      sql: 'SELECT streak_days, star_coins, shield_equipped FROM castle_state WHERE child_id = ?',
      args: [CHILD],
    })
  ).rows[0];
  const f = (
    await getDb().execute({
      sql: "SELECT COALESCE(SUM(qty),0) AS qty FROM inventory WHERE child_id = ? AND item_key = 'freeze'",
      args: [CHILD],
    })
  ).rows[0];
  const t = (
    await getDb().execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND resolved = 0',
      args: [CHILD],
    })
  ).rows[0];
  return {
    streak: Number(r?.streak_days ?? 0),
    star: Number(r?.star_coins ?? 0),
    shield: Number(r?.shield_equipped ?? 0),
    freeze: Number(f?.qty ?? 0),
    trouble: Number(t?.n ?? 0),
  };
}

describe('冰冻徽章 · 「保护连胜不中断」文案契约（验证既有正确行为）', () => {
  beforeEach(setup);

  it('冰冻在第一个漏卡日被消耗，并保住当天的连胜', async () => {
    // 1 天漏卡 + 1 个冰冻 → 该日被完全保护
    await seedMissedStreak(2, 1);
    await settleCastle(CHILD, dateStr());

    const s = await readState();
    expect(s.freeze, '冰冻徽章应被消耗').toBe(0);
    // 这一天被保护 → 连胜延续（原 10 天 + 1），不触发任何惩罚
    expect(s.trouble, '被保护的日子不该生成捣蛋萌可').toBe(0);
    expect(s.star, '被保护的日子不该扣星星币').toBe(1000);
    expect(s.streak, '连胜应延续而非归零').toBeGreaterThan(0);
  });

  it('多个冰冻可保护连续多天漏卡', async () => {
    // 3 天漏卡 + 3 个冰冻 → 三天全部被保护
    await seedMissedStreak(4, 3);
    await settleCastle(CHILD, dateStr());

    const s = await readState();
    expect(s.freeze, '三个冰冻都应被消耗').toBe(0);
    expect(s.trouble, '全部被保护，不该有捣蛋萌可').toBe(0);
    expect(s.star, '全部被保护，不该扣币').toBe(1000);
  });

  it('无冰冻时漏卡照常惩罚（确保规则未被放松）', async () => {
    await seedMissedStreak(2, 0);
    await settleCastle(CHILD, dateStr());

    const s = await readState();
    expect(s.freeze).toBe(0);
    expect(s.streak, '无保护道具时漏卡必须断连').toBe(0);
  });

  it('冰冻只保护 1 天：多天漏卡时剩余天数仍受罚（1 个冰冻 ≠ 无限护盾）', async () => {
    // 3 天漏卡 + 仅 1 个冰冻 → 只有首日被保护，后 2 天仍按阶梯惩罚
    await seedMissedStreak(4, 1);
    await settleCastle(CHILD, dateStr());

    const s = await readState();
    expect(s.freeze, '冰冻应被消耗').toBe(0);
    // 后 2 天漏卡：第 2 天生成 1 只捣蛋萌可，第 3 天再生成（上限 3）
    expect(s.trouble, `剩余捣蛋萌可 ${s.trouble} 只`).toBeGreaterThan(0);
  });
});

describe('护盾 · 「挡住一次捣蛋萌可」文案契约', () => {
  beforeEach(setup);

  it('漏卡第 1 天不生成捣蛋萌可，护盾不应被白白消耗', async () => {
    await seedMissedStreak(2, 0); // 仅漏卡 1 天 → troubleCount = 0
    await getDb().execute({
      sql: 'UPDATE castle_state SET shield_equipped = 1 WHERE child_id = ?',
      args: [CHILD],
    });

    await settleCastle(CHILD, dateStr());

    const s = await readState();
    // 没有捣蛋萌可可挡时，护盾必须留着（原文案：挡「一次捣蛋萌可」）
    expect(s.shield, '无捣蛋萌可时护盾不应被消耗').toBe(1);
    expect(s.trouble).toBe(0);
  });

  it('漏卡第 2 天生成捣蛋萌可，护盾挡掉一只并消耗 1 个', async () => {
    await seedMissedStreak(3, 0); // 漏卡 2 天 → troubleCount = 1
    await getDb().execute({
      sql: 'UPDATE castle_state SET shield_equipped = 1 WHERE child_id = ?',
      args: [CHILD],
    });

    await settleCastle(CHILD, dateStr());

    const s = await readState();
    expect(s.shield, '护盾应消耗 1 个').toBe(0);
    expect(s.trouble, '唯一那只捣蛋萌可被挡掉').toBe(0);
  });
});
