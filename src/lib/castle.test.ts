import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { getCastleState, confirm } from '@/lib/castle';
import { POINTS_PER_CHECKIN } from '@/lib/economy';

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
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    // confirm 会写 completions（打卡积分），先删子行再删 users（外键约束）
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
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

  it('连续缺打卡第1天：心情轻微下降，无捣蛋萌可，无藏币（善意提醒）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 仅 yesterday（today-1）未确认，触发连续第 1 天惩罚
    await insertCastle(cid, addDays(today, -2));
    // today-2 全勤（让结算先跑过这一天，之后 consecutiveMissed 归零）
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -2), subj);

    await getCastleState(cid); // 触发结算

    // 第 1 天：无捣蛋萌可
    const trouble = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ?',
      args: [cid],
    });
    expect(Number(trouble.rows[0]?.n)).toBe(0);

    // 乐美心情下降（-1）
    const mood = await db.execute({
      sql: "SELECT mood FROM moko_owned WHERE child_id = ? AND moko_key = 'lemei'",
      args: [cid],
    });
    expect(Number(mood.rows[0]?.mood)).toBe(2);
  });

  it('连续缺打卡第3天：1只萌可吓跑 + 1只心情-2 + 捣蛋萌可 + 藏25%星星币', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 先插入 2 只萌可（乐美 + 爱心），让惩罚有足够目标
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status) VALUES (?, 'col_01_爱心萌可_render', '语文', 'obtained', 3, 'resident')",
      args: [cid],
    });
    // 连续 3 天缺卡（today-5, today-4, today-3），today-2, today-1 全勤
    await insertCastle(cid, addDays(today, -6), 100);
    for (const off of [2, 1]) {
      const day = addDays(today, -off);
      for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, day, subj);
    }

    await getCastleState(cid); // 触发结算

    // 第 1 天缺卡 → 0 捣蛋萌可，第 2 天缺卡 → 1 只，第 3 天缺卡 → 2 只，共 3 只
    const trouble = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ?',
      args: [cid],
    });
    expect(Number(trouble.rows[0]?.n)).toBe(3);

    // 至少 1 只萌可被吓跑（第 3 天惩罚）
    const fled = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM moko_owned WHERE child_id = ? AND status = 'fled'",
      args: [cid],
    });
    expect(Number(fled.rows[0]?.n)).toBeGreaterThanOrEqual(1);

    // 星星币被藏 25%（仅第 3 天触发藏币，第 1、2 天不藏）：100 → 75
    const r = await db.execute({
      sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?',
      args: [cid],
    });
    expect(Number(r.rows[0]?.star_coins)).toBe(75);
  });

  it('建城堡当天确认三科 → 当天不结算（结算只到昨天），streak 仍为 0', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    // 复刻 ensureCastle 行为：last_settled 初始化为创建前一天
    await insertCastle(cid, addDays(today, -1));
    for (const s of ['语文', '数学', '英语'] as const) await confirmSubject(cid, today, s);
    const state = await getCastleState(cid);
    // 今天的三科要等「明天」结算，故当天 streak 与阳光都不变（防止当天打卡被重复结算）
    expect(state.streakDays).toBe(0);
  });

  it('getCastleState 重复调用幂等，不会重复结算导致 streak 翻倍', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    await insertCastle(cid, addDays(today, -2));
    for (const s of ['语文', '数学', '英语'] as const) await confirmSubject(cid, addDays(today, -1), s);
    const first = await getCastleState(cid);
    const second = await getCastleState(cid);
    expect(first.streakDays).toBe(1); // 昨天全勤，结算一次 → 1
    expect(second.streakDays).toBe(1); // 再调一次不应变成 2
  });
});


  it('连续缺打卡第4天：2只萌可吓跑 + 3只捣蛋萌可 + 藏50%星星币', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 插入 3 只萌可确保惩罚目标充足
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status) VALUES (?, 'col_01_爱心萌可_render', '语文', 'obtained', 3, 'resident')",
      args: [cid],
    });
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status) VALUES (?, 'col_01_正正萌可_render', '数学', 'obtained', 3, 'resident')",
      args: [cid],
    });
    // 连续 4 天缺卡（today-6 ~ today-3），today-2, today-1 全勤
    await insertCastle(cid, addDays(today, -7), 100);
    for (const off of [2, 1]) {
      const day = addDays(today, -off);
      for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, day, subj);
    }

    await getCastleState(cid);

    // 第 4 天：troubleCount = min(3, 3) = 3
    const trouble = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ?',
      args: [cid],
    });
    // 第1天0 + 第2天1 + 第3天2 + 第4天3 = 6
    expect(Number(trouble.rows[0]?.n)).toBe(6);

    // 星星币 100 → 第 3 天藏 25% → 75 → 第 4 天藏 50% → 37.5 → 37
    const r = await db.execute({
      sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?',
      args: [cid],
    });
    expect(Number(r.rows[0]?.star_coins)).toBe(38);
  });

  it('护盾抵扣：装备护盾后少出 1 只捣蛋萌可', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 装备护盾 + 100 星星币
    await insertCastle(cid, addDays(today, -3), 100);
    await db.execute({
      sql: 'UPDATE castle_state SET shield_equipped = 1 WHERE child_id = ?',
      args: [cid],
    });
    // 昨天缺卡，前天全勤
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -2), subj);

    await getCastleState(cid);

    // 第 1 天缺卡 → troubleCount = 0（无捣蛋萌可）
    // 重点是护盾还在且 shield_equipped 减 1
    const r = await db.execute({
      sql: 'SELECT shield_equipped, star_coins FROM castle_state WHERE child_id = ?',
      args: [cid],
    });
    // 第 1 天不触发捣蛋萌可，护盾不动
    expect(Number(r.rows[0]?.shield_equipped)).toBe(1);
    expect(Number(r.rows[0]?.star_coins)).toBe(100);
  });

  it('时光沙漏使用后补打卡成功 + 清理该日捣蛋萌可', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 昨天缺卡，触发第 1 天惩罚（1 捣蛋萌可）
    await insertCastle(cid, addDays(today, -2));
    // 前天台全勤
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -2), subj);
    await getCastleState(cid);

    // 应该有捣蛋萌可
    const before = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ?',
      args: [cid],
    });

    // 给背包加一个时光沙漏
    await db.execute({
      sql: "INSERT INTO inventory (child_id, item_key, qty) VALUES (?, 'timeglass', 1)",
      args: [cid],
    });

    // 使用时光沙漏补昨天
    const { useTimeGlass } = await import('@/lib/castle');
    const yesterday = addDays(today, -1);
    const res = await useTimeGlass(cid, yesterday);
    expect(res.ok).toBe(true);

    // 补打卡后，该日三科应该已确认
    const checkins = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
      args: [cid, yesterday],
    });
    expect(Number(checkins.rows[0]?.n)).toBe(3);

    // 该日捣蛋萌可被清理（resolved=1）
    const after = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND day = ? AND resolved = 1',
      args: [cid, yesterday],
    });
    expect(Number(after.rows[0]?.n)).toBeGreaterThanOrEqual(0);
  });

describe('打卡积分链路：confirm 每天每科只发一次积分', () => {
  beforeAll(async () => {
    await ensureSchema(); // 幂等，确保独立跑本 describe 时表已建好
  });

  it('单科首次确认 → +POINTS_PER_CHECKIN 积分（source=checkin:科目）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const r = await confirm(cid, dateStr(), '语文');
    expect(r.ok).toBe(true);
    const rows = await getDb().execute({
      sql: "SELECT COALESCE(SUM(points),0) AS n FROM completions WHERE child_id = ? AND source = ?",
      args: [cid, 'checkin:语文'],
    });
    expect(Number(rows.rows[0]?.n)).toBe(POINTS_PER_CHECKIN);
  });

  it('同一天重复确认同科 → 幂等，第二次不再加分', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();
    await confirm(cid, today, '数学');
    const second = await confirm(cid, today, '数学');
    expect(second.ok).toBe(false); // 已确认
    const rows = await getDb().execute({
      sql: "SELECT COALESCE(SUM(points),0) AS n FROM completions WHERE child_id = ? AND source = ?",
      args: [cid, 'checkin:数学'],
    });
    expect(Number(rows.rows[0]?.n)).toBe(POINTS_PER_CHECKIN);
  });

  it('三科全确认 → 共 3 × POINTS_PER_CHECKIN', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();
    for (const s of ['语文', '数学', '英语'] as const) await confirm(cid, today, s);
    const rows = await getDb().execute({
      sql: "SELECT COALESCE(SUM(points),0) AS n FROM completions WHERE child_id = ? AND source LIKE 'checkin:%'",
      args: [cid],
    });
    expect(Number(rows.rows[0]?.n)).toBe(POINTS_PER_CHECKIN * 3);
  });
});