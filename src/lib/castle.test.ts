import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { getCastleState } from '@/lib/castle';

/* —— 与 castle.dateStr / addDays 保持一致的本地日期工具 —— */
function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dateStr(dt);
}

let childSeq = 9000;
function nextChild(): number {
  return ++childSeq;
}

async function insertChild(id: number) {
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')`,
    args: [id, `testchild${id}`],
  });
}
async function insertCastle(cid: number, lastSettled: string, starCoins = 0) {
  await getDb().execute({
    sql: `INSERT INTO castle_state (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day) VALUES (?, 0, ?, 0, 0, ?)`,
    args: [cid, starCoins, lastSettled],
  });
}
async function confirmSubject(cid: number, day: string, subject: string) {
  await getDb().execute({
    sql: `INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT(child_id, day, subject) DO UPDATE SET status='confirmed'`,
    args: [cid, day, subject],
  });
}

describe('castle 核心逻辑：连续打卡与惩罚机制', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    // 测试间隔离：清空本测试会写入的表（按 child 隔离，直接 truncate 便于断言）
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    // 先断开 users 自引用外键（parent.selected_child_id / parent_id 指向 child），
    // 否则删 child 会因外键约束失败
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('连续打卡：最近 3 天三科全勤 → streakDays=3 且可兑换护盾', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    // 让结算从 today-3 跑到 today-1，覆盖这 3 个全勤日
    await insertCastle(cid, addDays(today, -4));
    for (const off of [1, 2, 3]) {
      const day = addDays(today, -off);
      for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, day, subj);
    }
    const state = await getCastleState(cid);
    expect(state.streakDays).toBe(3);
    expect(state.canBuyShield).toBe(true);
  });

  it('连续打卡：中间断一天 → streak 只累计到断点之前（应为 1）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    await insertCastle(cid, addDays(today, -4));
    // 昨天(off=1) 全勤；前天(off=2) 缺；大前天(off=3) 全勤
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -1), subj);
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -3), subj);
    const state = await getCastleState(cid);
    expect(state.streakDays).toBe(1); // 仅昨天连续
  });

  it('惩罚机制：整日三科未完成 → 3 只捣蛋萌可入场 + 被藏一半星星币 + 萌可吓跑', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    const missedDay = addDays(today, -4);
    // 给足星星币便于观察被藏；last_settled 设在 missDay 前一天，让结算覆盖到它
    await insertCastle(cid, addDays(missedDay, -1), 100);
    // 其余天三科全勤，让结算跑完
    for (const off of [3, 2, 1]) {
      const day = addDays(today, -off);
      for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, day, subj);
    }

    const state = await getCastleState(cid);

    // 捣蛋萌可：missedDay 三科全缺 → 3 只
    const trouble = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND day = ?',
      args: [cid, missedDay],
    });
    expect(Number(trouble.rows[0]?.n)).toBe(3);

    // 星星币被藏一半：100 -> 50
    expect(state.starCoins).toBe(50);

    // 入驻萌可（乐美）被吓跑
    const fled = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM moko_owned WHERE child_id = ? AND status = 'fled'",
      args: [cid],
    });
    expect(Number(fled.rows[0]?.n)).toBeGreaterThan(0);
  });
});
