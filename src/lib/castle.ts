import { getDb } from './db';
import { mokoCollection } from './moko-collection';
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

/* 📔 萌可成长日记：把联动中的高光时刻写入事件流 */
export interface GrowthEvent {
  id: number;
  day: string;
  type: string;
  emoji: string;
  title: string;
  desc: string | null;
  created_at: string;
}

export async function logGrowthEvent(
  childId: number,
  type: string,
  emoji: string,
  title: string,
  desc: string,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO growth_events (child_id, day, type, emoji, title, desc) VALUES (?, ?, ?, ?, ?, ?)',
    args: [childId, dateStr(), type, emoji, title, desc],
  });
}

export async function getGrowthDiary(childId: number, limit = 24): Promise<GrowthEvent[]> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM growth_events WHERE child_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    args: [childId, limit],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    day: String(r.day),
    type: String(r.type),
    emoji: String(r.emoji),
    title: String(r.title),
    desc: r.desc != null ? String(r.desc) : null,
    created_at: String(r.created_at),
  }));
}

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
  emoji: string;
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
  skin: string;
  checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'>;
  residents: ResidentMoko[];
  gallery: { key: string; name: string; img: string; emoji: string; color: string; category?: string; subject?: string; owned: boolean }[];
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

/* ----------------------------- 🌟 每日结算（奖励/捣蛋萌可捣乱/补作业） ----------------------------- */
async function applyPenalty(childId: number, day: string, confirmedCount: number) {
  const db = getDb();
  const missed = 3 - confirmedCount;
  if (missed <= 0) return;

  const row = await getRow(childId);
  let shield = Number(row?.shield_equipped ?? 0);
  let star = Number(row?.star_coins ?? 0);
  let lastStolen = Number(row?.last_stolen ?? 0);

  // 护盾能帮乐美挡住一次捣蛋萌可
  let spawn = missed;
  if (shield > 0 && spawn > 0) {
    shield -= 1;
    spawn -= 1;
  }
  // 捣蛋萌可溜进城堡捣乱，帮乐美把它们捉回去
  for (let i = 0; i < spawn; i++) {
    const key = troubleMokoKeys[i % troubleMokoKeys.length];
    await db.execute({
      sql: 'INSERT INTO troublemakers (child_id, moko_key, day, resolved) VALUES (?, ?, ?, 0)',
      args: [childId, key, day],
    });
  }

  // ④ 捣蛋萌可把一半星星币藏起来了（捉回后找回）
  if (star > 0) {
    const stolen = Math.floor(star / 2);
    star -= stolen;
    lastStolen = stolen;
  }

  // 捣蛋萌可把入驻萌可的心情弄糟了（心情值 3 格）
  const residents = (
    await db.execute({ sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident'", args: [childId] })
  ).rows;
  const flee = (id: number) =>
    db.execute({ sql: "UPDATE moko_owned SET status = 'fled', mood = 0 WHERE id = ?", args: [id] });
  const hitMood = (id: number, dec: number) =>
    db.execute({ sql: 'UPDATE moko_owned SET mood = MAX(0, mood - ?) WHERE id = ?', args: [dec, id] });

  if (missed >= 3) {
    // ③ 三科全未完成：萌可们被吓跑了
    for (const r of residents) await flee(Number(r.id));
  } else if (missed === 2) {
    // ② 两科未完成：半数萌可被吓跑；不足则各少 2 格心情
    if (residents.length >= 2) {
      const n = Math.floor(residents.length / 2);
      for (let i = 0; i < n; i++) await flee(Number(residents[i].id));
    } else {
      for (const r of residents) await hitMood(Number(r.id), 2);
    }
  } else {
    // ① 一科未完成：弄糟一只的心情，少 1 格
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
    // 🌟 学习-城堡联动：未完成 → 捣蛋萌可溜进来捣乱
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

/** 家长端：确认（今天）或补作业（过去某天） */
export async function confirm(childId: number, day: string, subject: Subject) {
  const db = getDb();
  await ensureCastle(childId);
  const today = dateStr();
  // 防御：未传/非法 day 时默认今天，避免写出 day="undefined" 的假行
  if (!day || day === 'undefined') day = today;
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
  const mokoName = mokoChars[subjectMokoKey[subject]]?.name ?? '萌可';
  const subjectEmoji: Record<Subject, string> = { 语文: '❤️', 数学: '💪', 英语: '🎵' };
  await logGrowthEvent(childId, 'checkin', subjectEmoji[subject] ?? '🌟', `「${subject}」打卡成功`,
    `阳光能量 +${SUN_PER_SUBJECT}，召唤 ${mokoName} 入驻城堡`);

  // 当天三科全部确认 → 城堡繁荣度提升
  if (day === today) {
    const c = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'`,
      args: [childId, today],
    });
    if (Number(c.rows[0]?.n) === 3) {
      await db.execute({ sql: 'UPDATE castle_state SET prosperity = prosperity + ? WHERE child_id = ?', args: [PROSPERITY_BONUS, childId] });
      await logGrowthEvent(childId, 'prosperity', '🏰', '三科全勤！城堡升级', `繁荣度 +${PROSPERITY_BONUS}，萌可们更开心啦`);
    }
  } else {
    // 补作业：若该过去日期现已三科全确认且仍有未捉回的捣蛋萌可 → 可领取魔法喷雾
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
      await logGrowthEvent(childId, 'rescue', '🧴', '补作业完成，乐美来帮忙！', '捣蛋萌可溜进城堡捣乱，乐美送来魔法喷雾，快帮她把捣蛋萌可捉回去！');
      return { ok: true, message: '补作业完成！乐美送来 1 瓶魔法喷雾，去背包帮她把捣蛋萌可捉回去吧～' };
    }
  }
  return { ok: true, message: `确认「${subject}」完成，获得 ${SUN_PER_SUBJECT} 阳光能量 + 1 只萌可！` };
}

/* ----------------------------- 道具：购买 / 使用 ----------------------------- */
export async function buy(childId: number, itemKey: string) {
  const db = getDb();
  await ensureCastle(childId);
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
  // 🏰 城堡皮肤：购买后自动换上
  if (itemKey.startsWith('skin_')) {
    await db.execute({ sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?', args: [itemKey, childId] });
    return { ok: true, message: `兑换「${starItem.name}」成功，城堡已换上新皮肤！` };
  }
  return { ok: true, message: `兑换「${starItem.name}」成功！` };
}

/** 切换城堡皮肤（仅限已拥有的皮肤或默认皮肤） */
export async function setSkin(childId: number, skin: string): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  const owned = skin === 'default' || Number(
    (await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, skin] })).rows[0]?.qty ?? 0,
  ) > 0;
  if (!owned) return { ok: false, message: '还没有这个皮肤哦，去星星币商城兑换吧！' };
  await db.execute({ sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?', args: [skin, childId] });
  return { ok: true, message: '城堡皮肤已更新！' };
}

/** 使用魔法喷雾：和乐美一起捉回捣蛋萌可 */
export async function castSpray(childId: number) {
  const db = getDb();
  await ensureCastle(childId);
  const inv = await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) return { ok: false, message: '没有魔法喷雾' };
  const row = await getRow(childId);
  // 🌟 捉回机制：帮乐美捉回捣蛋萌可 + 安抚心情 + 找回被藏星星币 50%（向上取整）
  await db.execute({ sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND resolved = 0', args: [childId] });
  await db.execute({ sql: "UPDATE moko_owned SET mood = 3, status = 'resident' WHERE child_id = ?", args: [childId] });
  const returnCoins = Math.ceil(Number(row?.last_stolen ?? 0) * 0.5);
  await db.execute({
    sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?',
    args: [returnCoins, childId],
  });
  await db.execute({ sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  await logGrowthEvent(childId, 'repair', '🧼', '捉回捣蛋萌可，城堡恢复欢乐！', `和乐美一起捉回捣蛋萌可，萌可们心情全满，找回 ${returnCoins} 星星币`);
  return { ok: true, message: `太棒了！和乐美一起捉回捣蛋萌可，找回 ${returnCoins} 星星币～` };
}

/** 收获星星币（好朋友阶段萌可每日产出） */
export async function harvest(childId: number) {
  const db = getDb();
  await ensureCastle(childId);
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
  await logGrowthEvent(childId, 'harvest', '⭐', '收获星星币', `萌可朋友们产出了 ${gained} 星星币`);
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
  const skin = String(row?.skin ?? 'default');

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
        emoji: mc?.emoji ?? '✨',
        color: mc?.color ?? 'text-slate-500',
        stage,
        mood: Number(r.mood),
        status: 'resident' as const,
        progress,
        nextStage,
      };
    })
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  // 图鉴：以真实图片集为正源（图片与名字一一对应，杜绝「图不对名」）
  // - 同名只折叠「核心萌可 vs 图片集变体」（如爱心萌可出现两次只留 1 张）
  // - 「其他萌可」整组保留：10 张都是独立图片，若按名字折叠会丢失 9 张（数量缺失）
  // - 图片集没有的核心角色（宝石萌可/钥匙萌可/甜心萌可等）补进图鉴，避免缺角
  const collectedNames = new Set(
    owned.rows.map((r) => mokoChars[String(r.moko_key)]?.name).filter((n): n is string => !!n),
  );
  const seenName = new Set<string>();
  const gallery: { key: string; name: string; img: string; emoji: string; color: string; category?: string; subject?: string; owned: boolean }[] = [];
  for (const m of mokoCollection) {
    if (m.category === 'trouble') continue;
    const isOther = m.name === '其他萌可';
    if (!isOther && seenName.has(m.name)) continue; // 普通同名折叠为 1 张
    seenName.add(m.name);
    gallery.push({
      key: m.key,
      name: m.name,
      img: m.img ?? '',
      emoji: m.emoji,
      color: m.color,
      category: m.category,
      subject: m.subject,
      // 是否「已收集」以孩子实际捕捉到的萌可为准（而非整组默认已收集）
      owned: collectedNames.has(m.name),
    });
  }
  // 补充：核心萌可里图片集没有的角色（宝石萌可/钥匙萌可/甜心萌可/星星萌可/乐美公主等）
  for (const m of Object.values(mokoChars)) {
    if (m.category === 'trouble') continue;
    if (seenName.has(m.name)) continue; // 图片集已收录的角色不再重复
    seenName.add(m.name);
    gallery.push({
      key: m.key,
      name: m.name,
      img: m.img ?? '',
      emoji: m.emoji,
      color: m.color,
      category: m.category,
      subject: m.subject,
      owned: collectedNames.has(m.name),
    });
  }

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
    skin,
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

/* ----------------------------- 🏅 成就徽章（由现有数据派生，无需额外埋点） ----------------------------- */
export interface BadgeItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: boolean;
  hint: string;
}

export async function getBadges(childId: number): Promise<BadgeItem[]> {
  const db = getDb();
  const row = await getRow(childId);
  const prosperity = Number(row?.prosperity ?? 0);
  const streak = await computeStreak(childId, dateStr());
  const moko = await db.execute({ sql: 'SELECT COUNT(*) n FROM moko_owned WHERE child_id = ?', args: [childId] });
  const mokoCount = Number(moko.rows[0]?.n ?? 0);
  const resolved = await db.execute({ sql: "SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND resolved = 1", args: [childId] });
  const resolvedCount = Number(resolved.rows[0]?.n ?? 0);
  const enResolved = await db.execute({ sql: "SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND subject = '英语' AND resolved = 1", args: [childId] });
  const enCount = Number(enResolved.rows[0]?.n ?? 0);
  const pts = await db.execute({ sql: 'SELECT COALESCE(SUM(points),0) n FROM completions WHERE child_id = ?', args: [childId] });
  const points = Number(pts.rows[0]?.n ?? 0);
  const trouble = await db.execute({ sql: "SELECT COUNT(*) n FROM troublemakers WHERE child_id = ? AND resolved = 0", args: [childId] });
  const troubleCount = Number(trouble.rows[0]?.n ?? 0);

  return [
    { id: 'first', name: '萌可初遇', emoji: '🌱', desc: '召唤第一只萌可', earned: mokoCount >= 1, hint: '完成任意一科打卡召唤萌可' },
    { id: 'castle', name: '城堡小主', emoji: '🏰', desc: '繁荣度达到 10', earned: prosperity >= 10, hint: '繁荣度达到 10' },
    { id: 'streak', name: '三日之约', emoji: '🔥', desc: '连续打卡 3 天', earned: streak >= 3, hint: '连续 3 天三科全打卡' },
    { id: 'mistake', name: '错题克星', emoji: '📝', desc: '复习解决 10 道错题', earned: resolvedCount >= 10, hint: '在复习本把 10 道错题练会' },
    { id: 'star', name: '学习之星', emoji: '⭐', desc: '累计获得 50 积分', earned: points >= 50, hint: '累计获得 50 积分' },
    { id: 'family', name: '萌可大家族', emoji: '👑', desc: '收集 5 只萌可', earned: mokoCount >= 5, hint: '收集 5 只萌可' },
    { id: 'raz', name: 'RAZ 小学者', emoji: '🇬🇧', desc: '攻克 5 个英语易错词', earned: enCount >= 5, hint: '英语发音评测把 5 个词练到 3 星' },
    { id: 'full', name: '满血城堡', emoji: '🌟', desc: '繁荣 20 且无捣蛋萌可', earned: prosperity >= 20 && troubleCount === 0, hint: '繁荣度 20 且城堡无捣蛋萌可' },
  ];
}

export { STAGE_LABEL, dateStr };
