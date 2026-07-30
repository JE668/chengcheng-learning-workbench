import { getDb } from './db';
import {
  mokoChars,
  subjectMokoKey,
  troubleMokoKeys,
  GROWTH_MIN,
  STAR_PER_FRIEND,
  SUN_PER_SUBJECT,
  PROSPERITY_BONUS,
  SHIELD_STREAK_REQ,
} from './moko';
import type { Subject } from './types';

const SUBJECTS: Subject[] = ['语文', '数学', '英语'];

/* ----------------------------- 时间工具 ----------------------------- */
function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

/* ----------------------------- 类型定义 ----------------------------- */
export type MokoStage = 'obtained' | 'settled' | 'playing' | 'friend';
const STAGE_ORDER: MokoStage[] = ['obtained', 'settled', 'playing', 'friend'];

export interface ResidentMoko {
  key: string;
  name: string;
  img: string;
  color: string;
  stage: MokoStage;
  mood: number;
  status: 'resident' | 'fled';
  progress: number; // 0~1 当前阶段进度
  nextStage: MokoStage | null;
}

export interface CastleStateView {
  today: string;
  sunlight: number;
  starCoins: number;
  prosperity: number;
  streakDays: number;
  shieldEquipped: number;
  checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'>;
  residents: ResidentMoko[];
  gallery: { key: string; name: string; img: string; color: string; category?: string; subject?: string; owned: boolean }[];
  troublemakers: { key: string; name: string; img: string }[];
  inventory: Record<string, number>;
  missedDays: { day: string; missed: Subject[]; hasTrouble: boolean }[];
  canBuyShield: boolean;
  noStarToday: boolean;
}

/* ----------------------------- 基础读写 ----------------------------- */
async function getRow(childId: number) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM castle_state WHERE child_id = ?', args: [childId] });
  return res.rows[0];
}

async function ensureCastle(childId: number) {
  const db = getDb();
  await db.execute({
    sql: 'INSERT OR IGNORE INTO castle_state (child_id, sunlight, star_coins, prosperity, last_settled_day) VALUES (?, 0, 0, 0, ?)',
    args: [childId, dateStr()],
  });
  // 引导萌可（乐美公主）初始即好朋友
  await db.execute({
    sql: `INSERT OR IGNORE INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
          VALUES (?, 'lemei', NULL, 'friend', CURRENT_TIMESTAMP, 3, 'resident')`,
    args: [childId],
  });
}

/* 连续打卡天数（截至昨天） */
async function computeStreak(childId: number, today: string): Promise<number> {
  const db = getDb();
  let streak = 0;
  let d = addDays(today, -1);
  // 最多回看 60 天
  for (let i = 0; i < 60; i++) {
    const res = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'`,
      args: [childId, d],
    });
    if (Number(res.rows[0]?.n) === 3) {
      streak++;
      d = addDays(d, -1);
    } else break;
  }
  return streak;
}

/* ----------------------------- 萌可成长 ----------------------------- */
function durMinForStage(stage: MokoStage): number {
  if (stage === 'obtained') return GROWTH_MIN.settled;
  if (stage === 'settled') return GROWTH_MIN.playing;
  return GROWTH_MIN.friend;
}
const STAGE_LABEL: Record<MokoStage, string> = {
  obtained: '刚解锁',
  settled: '入驻城堡',
  playing: '开心玩耍',
  friend: '成为好朋友',
};

async function refreshStages(childId: number) {
  const db = getDb();
  const now = Date.now();
  const res = await db.execute({ sql: 'SELECT * FROM moko_owned WHERE child_id = ?', args: [childId] });
  for (const r of res.rows) {
    let stage = r.stage as MokoStage;
    let stageAt = new Date(String(r.stage_at)).getTime();
    let changed = false;
    while (stage !== 'friend') {
      const nextAt = stageAt + durMinForStage(stage) * 60000;
      if (now >= nextAt) {
        stage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
        stageAt = nextAt;
        changed = true;
      } else break;
    }
    if (changed) {
      await db.execute({
        sql: 'UPDATE moko_owned SET stage = ?, stage_at = ? WHERE id = ?',
        args: [stage, new Date(stageAt).toISOString(), Number(r.id)],
      });
    }
  }
}

/* ----------------------------- 🌟 每日结算（奖励/惩罚/补作业） ----------------------------- */
async function applyPenalty(childId: number, day: string, confirmedCount: number) {
  const db = getDb();
  const missed = 3 - confirmedCount;
  if (missed <= 0) return;

  const row = await getRow(childId);
  let shield = Number(row?.shield_equipped ?? 0);
  let star = Number(row?.star_coins ?? 0);
  let lastStolen = Number(row?.last_stolen ?? 0);

  // 护盾可抵挡一次捣蛋萌可攻击
  let spawn = missed;
  if (shield > 0 && spawn > 0) {
    shield -= 1;
    spawn -= 1;
  }
  // 生成捣蛋萌可
  for (let i = 0; i < spawn; i++) {
    const key = troubleMokoKeys[i % troubleMokoKeys.length];
    await db.execute({
      sql: 'INSERT INTO troublemakers (child_id, moko_key, day, resolved) VALUES (?, ?, ?, 0)',
      args: [childId, key, day],
    });
  }

  // ④ 迷糊萌可偷走一半星星币
  if (star > 0) {
    const stolen = Math.floor(star / 2);
    star -= stolen;
    lastStolen = stolen;
  }

  // 攻击已入驻萌可（心情值 3 格）
  const residents = (
    await db.execute({ sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident'", args: [childId] })
  ).rows;
  const flee = (id: number) =>
    db.execute({ sql: "UPDATE moko_owned SET status = 'fled', mood = 0 WHERE id = ?", args: [id] });
  const hitMood = (id: number, dec: number) =>
    db.execute({ sql: 'UPDATE moko_owned SET mood = MAX(0, mood - ?) WHERE id = ?', args: [dec, id] });

  if (missed >= 3) {
    // ③ 三科全未完成：所有萌可逃跑
    for (const r of residents) await flee(Number(r.id));
  } else if (missed === 2) {
    // ② 两科未完成：赶走半数；不足则各损失 2 格心情
    if (residents.length >= 2) {
      const n = Math.floor(residents.length / 2);
      for (let i = 0; i < n; i++) await flee(Number(residents[i].id));
    } else {
      for (const r of residents) await hitMood(Number(r.id), 2);
    }
  } else {
    // ① 一科未完成：攻击一只，损失 1 格心情
    if (residents.length) await hitMood(Number(residents[0].id), 1);
  }

  await db.execute({
    sql: 'UPDATE castle_state SET shield_equipped = ?, star_coins = ?, last_stolen = ? WHERE child_id = ?',
    args: [shield, star, lastStolen, childId],
  });
}

async function settleCastle(childId: number, today: string) {
  const row = await getRow(childId);
  if (!row) return;
  let last = row.last_settled_day ? String(row.last_settled_day) : today;
  let cursor = addDays(last, 1);
  const yesterday = addDays(today, -1);
  const db = getDb();
  while (cursor <= yesterday) {
    const c = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'`,
      args: [childId, cursor],
    });
    const confirmed = Number(c.rows[0]?.n ?? 0);
    // 🌟 学习-城堡联动：未完成 → 惩罚触发
    await applyPenalty(childId, cursor, confirmed);
    // 连续打卡更新
    const streak = confirmed === 3 ? Number(row.streak_days ?? 0) + 1 : 0;
    await db.execute({ sql: 'UPDATE castle_state SET streak_days = ? WHERE child_id = ?', args: [streak, childId] });
    // 重新读取（streak 已变）
    const r2 = await getRow(childId);
    row.streak_days = r2?.streak_days;
    last = cursor;
    cursor = addDays(cursor, 1);
  }
  if (last !== (row.last_settled_day ? String(row.last_settled_day) : today)) {
    await db.execute({ sql: 'UPDATE castle_state SET last_settled_day = ? WHERE child_id = ?', args: [last, childId] });
  }
}

/* ----------------------------- 打卡与奖励 ----------------------------- */
async function awardSubjectMoko(childId: number, subject: Subject) {
  const key = subjectMokoKey[subject];
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
          VALUES (?, ?, ?, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
          ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
    args: [childId, key, subject],
  });
}

/** 孩子端：标记今天某科“我完成了” */
export async function checkin(childId: number, subject: Subject) {
  const db = getDb();
  const today = dateStr();
  await db.execute({
    sql: `INSERT INTO daily_checkins (child_id, day, subject, status, child_done_at)
          VALUES (?, ?, ?, 'child_done', CURRENT_TIMESTAMP)
          ON CONFLICT(child_id, day, subject) DO UPDATE SET status = 'child_done', child_done_at = CURRENT_TIMESTAMP`,
    args: [childId, today, subject],
  });
  return { ok: true };
}

/** 家长端：确认（今天）或补作业（过去某天） */
export async function confirm(childId: number, day: string, subject: Subject) {
  const db = getDb();
  const today = dateStr();
  const existing = await db.execute({
    sql: 'SELECT status FROM daily_checkins WHERE child_id = ? AND day = ? AND subject = ?',
    args: [childId, day, subject],
  });
  const status = existing.rows[0]?.status;
  if (status === 'confirmed') return { ok: false, message: '该科今天已确认' };

  await db.execute({
    sql: `INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at)
          VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP)
          ON CONFLICT(child_id, day, subject) DO UPDATE SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP`,
    args: [childId, day, subject],
  });

  // 🌟 学习-城堡联动：完成单科 → 1 阳光能量 + 1 对应学科萌可
  await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight + ? WHERE child_id = ?', args: [SUN_PER_SUBJECT, childId] });
  await awardSubjectMoko(childId, subject);

  // 当天三科全部确认 → 城堡繁荣度提升
  if (day === today) {
    const c = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'`,
      args: [childId, today],
    });
    if (Number(c.rows[0]?.n) === 3) {
      await db.execute({ sql: 'UPDATE castle_state SET prosperity = prosperity + ? WHERE child_id = ?', args: [PROSPERITY_BONUS, childId] });
    }
  } else {
    // 补作业：若该过去日期现已三科全确认且仍有未驱散捣蛋萌可 → 可领取魔法喷雾
    const c = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'`,
      args: [childId, day],
    });
    const trouble = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM troublemakers WHERE child_id = ? AND day = ? AND resolved = 0',
      args: [childId, day],
    });
    if (Number(c.rows[0]?.n) === 3 && Number(trouble.rows[0]?.n) > 0) {
      await db.execute({
        sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
        args: [childId, 'spray'],
      });
      return { ok: true, message: '补作业完成！获得 1 瓶魔法喷雾，去背包使用修复城堡吧～' };
    }
  }
  return { ok: true, message: `确认「${subject}」完成，获得 ${SUN_PER_SUBJECT} 阳光能量 + 1 只萌可！` };
}

/* ----------------------------- 道具：购买 / 使用 ----------------------------- */
export async function buy(childId: number, itemKey: string) {
  const db = getDb();
  const row = await getRow(childId);
  if (itemKey === 'spray') {
    const cost = 5;
    if (Number(row?.sunlight ?? 0) < cost) return { ok: false, message: '阳光能量不足' };
    await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight - ? WHERE child_id = ?', args: [cost, childId] });
    await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, 'spray'] });
    return { ok: true, message: '购买魔法喷雾成功！' };
  }
  if (itemKey === 'shield') {
    const cost = 10;
    const streak = await computeStreak(childId, dateStr());
    if (streak < SHIELD_STREAK_REQ) return { ok: false, message: `需连续打卡 ${SHIELD_STREAK_REQ} 天才能兑换护盾（当前 ${streak} 天）` };
    if (Number(row?.sunlight ?? 0) < cost) return { ok: false, message: '阳光能量不足' };
    await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight - ?, shield_equipped = shield_equipped + 1 WHERE child_id = ?', args: [cost, childId] });
    await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, 'shield'] });
    return { ok: true, message: '护盾已兑换并自动装备到城堡！' };
  }
  // 星星币商城
  const starItem = (await import('./moko')).starShop.find((s) => s.key === itemKey);
  if (!starItem) return { ok: false, message: '未知商品' };
  if (Number(row?.star_coins ?? 0) < starItem.cost) return { ok: false, message: '星星币不足' };
  await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins - ? WHERE child_id = ?', args: [starItem.cost, childId] });
  await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, itemKey] });
  return { ok: true, message: `兑换「${starItem.name}」成功！` };
}

/** 使用魔法喷雾：修复城堡 */
export async function useSpray(childId: number) {
  const db = getDb();
  const inv = await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) return { ok: false, message: '没有魔法喷雾' };
  const row = await getRow(childId);
  // 🌟 修复机制：驱散捣蛋萌可 + 恢复心情 + 返还被偷星星币 50%（向上取整）
  await db.execute({ sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND resolved = 0', args: [childId] });
  await db.execute({ sql: "UPDATE moko_owned SET mood = 3, status = 'resident' WHERE child_id = ?", args: [childId] });
  const returnCoins = Math.ceil(Number(row?.last_stolen ?? 0) * 0.5);
  await db.execute({
    sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?',
    args: [returnCoins, childId],
  });
  await db.execute({ sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  return { ok: true, message: `城堡已修复！驱散捣蛋萌可，返还 ${returnCoins} 星星币。` };
}

/** 收获星星币（好朋友阶段萌可每日产出） */
export async function harvest(childId: number) {
  const db = getDb();
  const today = dateStr();
  const friends = (
    await db.execute({
      sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident' AND stage = 'friend' AND last_harvest_day != ?",
      args: [childId, today],
    })
  ).rows;
  if (!friends.length) return { ok: true, gained: 0, message: '今天还没有可收获的星星币～' };
  const gained = friends.length * STAR_PER_FRIEND;
  await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?', args: [gained, childId] });
  for (const r of friends) {
    await db.execute({ sql: 'UPDATE moko_owned SET last_harvest_day = ? WHERE id = ?', args: [today, Number(r.id)] });
  }
  return { ok: true, gained, message: `收获 ${gained} 星星币！` };
}

/* ----------------------------- 组装看板数据 ----------------------------- */
export async function getCastleState(childId: number): Promise<CastleStateView> {
  const today = dateStr();
  await ensureCastle(childId);
  await refreshStages(childId);
  await settleCastle(childId, today);

  const db = getDb();
  const row = await getRow(childId);
  const sunlight = Number(row?.sunlight ?? 0);
  const starCoins = Number(row?.star_coins ?? 0);
  const prosperity = Number(row?.prosperity ?? 0);
  const streakDays = Number(row?.streak_days ?? 0);
  const shieldEquipped = Number(row?.shield_equipped ?? 0);
  const lastStolen = Number(row?.last_stolen ?? 0);

  // 今日三科打卡状态
  const checkRows = await db.execute({
    sql: 'SELECT subject, status FROM daily_checkins WHERE child_id = ? AND day = ?',
    args: [childId, today],
  });
  const checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'> = { 语文: 'pending', 数学: 'pending', 英语: 'pending' };
  for (const r of checkRows.rows) {
    const s = r.subject as Subject;
    if (s in checkins) checkins[s] = (r.status as any) || 'pending';
  }

  // 入驻萌可（含成长进度）
  const owned = await db.execute({ sql: 'SELECT * FROM moko_owned WHERE child_id = ?', args: [childId] });
  const now = Date.now();
  const residents: ResidentMoko[] = owned.rows
    .filter((r) => r.status === 'resident')
    .map((r) => {
      const key = String(r.moko_key);
      const mc = mokoChars[key];
      const stage = r.stage as MokoStage;
      let progress = 1;
      let nextStage: MokoStage | null = null;
      if (stage !== 'friend') {
        const stageAt = new Date(String(r.stage_at)).getTime();
        const total = durMinForStage(stage) * 60000;
        progress = Math.max(0, Math.min(1, (now - stageAt) / total));
        nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
      }
      return {
        key,
        name: mc?.name ?? key,
        img: mc?.img ?? '',
        color: mc?.color ?? 'text-slate-500',
        stage,
        mood: Number(r.mood),
        status: 'resident' as const,
        progress,
        nextStage,
      };
    })
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  // 图鉴（全部萌可 + 是否已拥有）
  const ownedKeys = new Set(owned.rows.map((r) => String(r.moko_key)));
  const gallery = Object.values(mokoChars)
    .filter((m) => m.category !== 'trouble')
    .map((m) => ({
      key: m.key,
      name: m.name,
      img: m.img,
      color: m.color,
      category: m.category,
      subject: m.subject,
      owned: ownedKeys.has(m.key),
    }));

  // 活跃捣蛋萌可
  const trouble = await db.execute({
    sql: 'SELECT moko_key FROM troublemakers WHERE child_id = ? AND resolved = 0',
    args: [childId],
  });
  const troublemakers = trouble.rows.map((r) => {
    const mc = mokoChars[String(r.moko_key)];
    return { key: String(r.moko_key), name: mc?.name ?? '捣蛋萌可', img: mc?.img ?? '' };
  });

  // 背包
  const inv = await db.execute({ sql: 'SELECT item_key, qty FROM inventory WHERE child_id = ?', args: [childId] });
  const inventory: Record<string, number> = {};
  for (const r of inv.rows) inventory[String(r.item_key)] = Number(r.qty);

  // 过去未完成日期（用于补作业）
  const past = await db.execute({
    sql: `SELECT day, subject, status FROM daily_checkins WHERE child_id = ? AND day < ? ORDER BY day DESC`,
    args: [childId, today],
  });
  const byDay = new Map<string, { confirmed: number; missed: Subject[]; hasTrouble: boolean }>();
  for (const r of past.rows) {
    const d = String(r.day);
    if (!byDay.has(d)) byDay.set(d, { confirmed: 0, missed: [], hasTrouble: false });
    const e = byDay.get(d)!;
    if (r.status === 'confirmed') e.confirmed++;
    else e.missed.push(r.subject as Subject);
  }
  const troubleDays = await db.execute({
    sql: 'SELECT DISTINCT day FROM troublemakers WHERE child_id = ? AND resolved = 0',
    args: [childId],
  });
  const troubleDaySet = new Set(troubleDays.rows.map((r) => String(r.day)));
  const missedDays = Array.from(byDay.entries())
    .filter(([, v]) => v.confirmed < 3)
    .map(([day, v]) => ({ day, missed: v.missed, hasTrouble: troubleDaySet.has(day) }))
    .slice(0, 14);

  return {
    today,
    sunlight,
    starCoins,
    prosperity,
    streakDays,
    shieldEquipped,
    checkins,
    residents,
    gallery,
    troublemakers,
    inventory,
    missedDays,
    canBuyShield: streakDays >= SHIELD_STREAK_REQ,
    noStarToday: false,
  };
}

export { STAGE_LABEL, dateStr };
