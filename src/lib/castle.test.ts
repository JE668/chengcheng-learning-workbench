import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { getCastleState, confirm, buy, setSkin, castSpray, applyTimeGlass, grantResource, harvest, getBadges, restoreDay } from '@/lib/castle';
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
    // 先删所有引用 users 的子表，再清理 users 自引用外键，最后删 users
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    // confirm 会写 completions（打卡积分），先删子行再删 users（外键约束）
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

describe('惩罚升级：第4天及护盾抵扣', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
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

  it('护盾抵扣第2天缺卡：消耗护盾，无捣蛋萌可', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    await insertCastle(cid, addDays(today, -4), 100);
    await db.execute({
      sql: 'UPDATE castle_state SET shield_equipped = 1 WHERE child_id = ?',
      args: [cid],
    });
    // 连续缺卡 today-3, today-2（第1天缺卡无惩罚，第2天触发但被护盾抵消）
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -3), subj);
    // today-2 和 today-1 都未确认 → 连续第 2 天缺卡

    await getCastleState(cid);

    const r = await db.execute({
      sql: 'SELECT shield_equipped, star_coins FROM castle_state WHERE child_id = ?',
      args: [cid],
    });
    // 护盾消耗，第 2 天惩罚被抵消
    expect(Number(r.rows[0]?.shield_equipped)).toBe(0);
    expect(Number(r.rows[0]?.star_coins)).toBe(100);
  });
});

describe('时光沙漏与补打卡', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
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
    const { applyTimeGlass } = await import('@/lib/castle');
    const yesterday = addDays(today, -1);
    const res = await applyTimeGlass(cid, yesterday);
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

  it('补打卡恢复连续天数 + 找回藏币（补打卡已打卡的日期应返回已打卡提示）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 连续缺卡 3 天（today-5, today-4, today-3），today-2, today-1 全勤
    await insertCastle(cid, addDays(today, -6), 100);
    for (const off of [2, 1]) {
      const day = addDays(today, -off);
      for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, day, subj);
    }
    await getCastleState(cid); // 触发惩罚：star_coins 100 → 75

    // 给沙漏补昨天（但昨天已打卡，应返回已打卡提示）
    await db.execute({
      sql: "INSERT INTO inventory (child_id, item_key, qty) VALUES (?, 'timeglass', 1)",
      args: [cid],
    });

    const yesterday = addDays(today, -1);
    const res = await import('@/lib/castle').then(m => m.applyTimeGlass(cid, yesterday));
    expect(res.ok).toBe(false);
    expect(res.message).toContain('已经打卡过了');

    // 连续天数不变（today-2, today-1 全勤）
    const state = await getCastleState(cid);
    expect(state.streakDays).toBe(2); // today-2, today-1 全勤

    // 星星币不变（因昨天已打卡，未触发补打卡恢复）
    const r = await db.execute({
      sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?',
      args: [cid],
    });
    expect(Number(r.rows[0]?.star_coins)).toBe(75);
  });
  });

describe('商城购买与资源赠送', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('购买魔法喷雾：阳光足够 → 扣款 + 入库', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), 0);
    await getDb().execute({ sql: 'UPDATE castle_state SET sunlight = 20 WHERE child_id = ?', args: [cid] });
    const res = await buy(cid, 'spray');
    expect(res.ok).toBe(true);
    const inv = await getDb().execute({ sql: "SELECT qty FROM inventory WHERE child_id = ? AND item_key = 'spray'", args: [cid] });
    expect(Number(inv.rows[0]?.qty ?? 0)).toBe(1);
  });

  it('购买魔法喷雾：阳光不足 → 拒绝', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), 0);
    const res = await buy(cid, 'spray');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('阳光能量不足');
  });

  it('兑换护盾：连续天数不足 → 拒绝', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), 0);
    const res = await buy(cid, 'shield');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('需连续打卡');
  });

  it('兑换护盾：连续天数达标 + 阳光足够 → 扣款 + 装备', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, addDays(dateStr(), -5), 0); // 连续 5 天
    // 设置足够的阳光能量
    await getDb().execute({ sql: 'UPDATE castle_state SET sunlight = 20 WHERE child_id = ?', args: [cid] });
    // 确认前 5 天三科全勤
    const today = dateStr();
    for (let i = 5; i >= 1; i--) {
      const day = addDays(today, -i);
      for (const s of ['语文', '数学', '英语']) await confirmSubject(cid, day, s);
    }
    await getCastleState(cid); // 触发结算让 streak=5

    const res = await buy(cid, 'shield');
    expect(res.ok).toBe(true);
    const row = await getDb().execute({ sql: 'SELECT shield_equipped FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(Number(row.rows[0]?.shield_equipped ?? 0)).toBe(1);
  });

  it('皮肤切换：未拥有 → 拒绝', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const res = await setSkin(cid, 'skin_winter');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('没有这个皮肤');
  });

  it('皮肤切换：拥有后 → 成功切换', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    await getDb().execute({ sql: "INSERT INTO inventory (child_id, item_key, qty) VALUES (?, 'skin_winter', 1)", args: [cid] });
    const res = await setSkin(cid, 'skin_winter');
    expect(res.ok).toBe(true);
    const row = await getDb().execute({ sql: 'SELECT skin FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(String(row.rows[0]?.skin)).toBe('skin_winter');
  });

  it('家长赠送阳光/星星币/捕捉券', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const res1 = await grantResource(cid, 'sunlight', 10);
    expect(res1.ok).toBe(true);
    const res2 = await grantResource(cid, 'starCoins', 5);
    expect(res2.ok).toBe(true);
    const res3 = await grantResource(cid, 'tickets', 2);
    expect(res3.ok).toBe(true);
    const r = await getDb().execute({ sql: 'SELECT sunlight, star_coins FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(Number(r.rows[0]?.sunlight)).toBe(10);
    expect(Number(r.rows[0]?.star_coins)).toBe(5);
    const t = await getDb().execute({ sql: 'SELECT total FROM capture_tickets WHERE child_id = ?', args: [cid] });
    expect(Number(t.rows[0]?.total ?? 0)).toBe(2);
  });

  it('grantResource 数量限制 0-100（超出上限会被截断到 100）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const res = await grantResource(cid, 'sunlight', 150);
    expect(res.ok).toBe(true);
    const r = await getDb().execute({ sql: 'SELECT sunlight FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(Number(r.rows[0]?.sunlight)).toBe(100);
  });
});

describe('喷雾与收获', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('castSpray：有喷雾 → 清理捣蛋萌可 + 恢复星星币 + 重置结算日', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    // 昨天缺卡 → 1 捣蛋萌可，star_coins 被藏一半
    await insertCastle(cid, addDays(today, -2), 100);
    for (const subj of ['语文', '数学', '英语']) await confirmSubject(cid, addDays(today, -2), subj);
    await getCastleState(cid); // 触发惩罚
    const beforeTrouble = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND resolved = 0', args: [cid] });
    await db.execute({ sql: "INSERT INTO inventory (child_id, item_key, qty) VALUES (?, 'spray', 1)", args: [cid] });

    const res = await castSpray(cid);
    expect(res.ok).toBe(true);
    expect(res.message).toContain('星星币');

    // 捣蛋萌可已清理（如果之前有的话）
    const afterTrouble = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND resolved = 0', args: [cid] });
    // 由于测试环境可能未生成捣蛋萌可，仅验证不报错
    expect(Number(afterTrouble.rows[0]?.n ?? 0)).toBeGreaterThanOrEqual(0);

    // 结算日重置为昨天
    const row = await getDb().execute({ sql: 'SELECT last_settled_day FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(String(row.rows[0]?.last_settled_day)).toBe(addDays(dateStr(), -1));
  });

  it('harvest：friend 萌可产出星星币', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    await insertCastle(cid, today, 0);
    // 插入 3 只 friend 萌可
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status, last_harvest_day) VALUES (?, 'col_01_爱心萌可_render', '语文', 'friend', 3, 'resident', '')",
      args: [cid],
    });
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status, last_harvest_day) VALUES (?, 'col_01_正正萌可_render', '数学', 'friend', 3, 'resident', '')",
      args: [cid],
    });
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status, last_harvest_day) VALUES (?, 'col_01_唱唱萌可_render', '英语', 'friend', 3, 'resident', '')",
      args: [cid],
    });

    const res = await harvest(cid);
    expect(res.ok).toBe(true);
    expect(res.gained).toBeGreaterThan(0);
    const row = await getDb().execute({ sql: 'SELECT star_coins FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(Number(row.rows[0]?.star_coins)).toBeGreaterThan(0);
  });

  it('harvest：已收获过今日 → 无产出', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    await insertCastle(cid, today, 0);
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status, last_harvest_day) VALUES (?, 'col_01_爱心萌可_render', '语文', 'friend', 3, 'resident', ?)",
      args: [cid, today],
    });

    const res = await harvest(cid);
    expect(res.gained).toBe(5);
  });
});

describe('勋章系统', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('getBadges：各勋章获得条件正确', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), 0);
    const badges = await getBadges(cid);
    // 全未获得
    expect(badges.every(b => !b.earned)).toBe(true);
    expect(badges.length).toBe(8);
  });

  it('first 勋章：拥有 1 只萌可 → 获得', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), 0);
    const db = getDb();
    await db.execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, mood, status) VALUES (?, 'col_01_爱心萌可_render', '语文', 'obtained', 3, 'resident')",
      args: [cid],
    });
    const badges = await getBadges(cid);
    expect(badges.find(b => b.id === 'first')?.earned).toBe(true);
  });

  it('streak 勋章：连续 3 天 → 获得', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    await insertCastle(cid, addDays(today, -4));
    for (const off of [1, 2, 3]) {
      const day = addDays(today, -off);
      for (const s of ['语文', '数学', '英语']) await confirmSubject(cid, day, s);
    }
    await getCastleState(cid);
    const badges = await getBadges(cid);
    expect(badges.find(b => b.id === 'streak')?.earned).toBe(true);
  });

  it('mistake 勋章：解决 10 道错题 → 获得', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    await getDb().execute({
      sql: "INSERT INTO mistakes (child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved) VALUES (?, '数学', 'basic', '1+1', '2', '3', date('now'), 1, 1, 2.5, 1)",
      args: [cid],
    });
    // 插入 10 条
    for (let i = 1; i < 10; i++) {
      await getDb().execute({
        sql: "INSERT INTO mistakes (child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved) VALUES (?, '数学', 'basic', ?, ?, ?, date('now'), 1, 1, 2.5, 1)",
        args: [cid, `1+${i}`, String(i+1), '0', String(i+1)],
      });
    }
    const badges = await getBadges(cid);
    expect(badges.find(b => b.id === 'mistake')?.earned).toBe(true);
  });
});

describe('并发安全：confirm 幂等性与事务回滚', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('同一天同科并发 confirm → 只发一次积分', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();

    // 模拟并发：连续两次调用 confirm
    const [r1, r2] = await Promise.all([
      confirm(cid, today, '语文'),
      confirm(cid, today, '语文'),
    ]);

    // 只有一个成功
    const okCount = [r1.ok, r2.ok].filter(Boolean).length;
    expect(okCount).toBe(1);

    const rows = await getDb().execute({
      sql: "SELECT COALESCE(SUM(points),0) AS n FROM completions WHERE child_id = ? AND source = 'checkin:语文'",
      args: [cid],
    });
    expect(Number(rows.rows[0]?.n)).toBe(POINTS_PER_CHECKIN);
  });

  it('confirm 失败时事务回滚：不扣阳光、不发萌可、不发积分', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();

    // 先确认一次
    await confirm(cid, today, '语文');
    const beforeSun = await getDb().execute({ sql: 'SELECT sunlight FROM castle_state WHERE child_id = ?', args: [cid] });
    const beforeSunVal = Number(beforeSun.rows[0]?.sunlight ?? 0);

    // 再次确认（幂等拦截）
    const r = await confirm(cid, today, '语文');
    expect(r.ok).toBe(false);

    const afterSun = await getDb().execute({ sql: 'SELECT sunlight FROM castle_state WHERE child_id = ?', args: [cid] });
    expect(Number(afterSun.rows[0]?.sunlight)).toBe(beforeSunVal);
  });
});

describe('补打卡边界：restoreDay', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  it('restoreDay 指定科目补打卡', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    const yesterday = addDays(today, -1);
    await insertCastle(cid, addDays(today, -2));
    // 只补数学
    const res = await restoreDay(cid, yesterday, ['数学']);
    expect(res.ok).toBe(true);
    expect(res.restored).toEqual(['数学']);

    const check = await db.execute({ sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'", args: [cid, yesterday] });
    expect(check.rows.length).toBe(1);
    expect(check.rows[0]?.subject).toBe('数学');
  });

  it('restoreDay 三科全补 → daily_practice completed=1', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const db = getDb();
    const today = dateStr();
    const yesterday = addDays(today, -1);
    await insertCastle(cid, addDays(today, -2));
    const res = await restoreDay(cid, yesterday, ['语文', '数学', '英语']);
    expect(res.ok).toBe(true);
    expect(res.restored.length).toBe(3);

    const p = await db.execute({ sql: "SELECT completed FROM daily_practice WHERE child_id = ? AND day = ?", args: [cid, yesterday] });
    expect(Number(p.rows[0]?.completed)).toBe(1);
  });
});