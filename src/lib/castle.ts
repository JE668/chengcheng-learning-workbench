import { getDb } from './db';
import { dateStr, addDays } from './date';
import { mokoCollection } from './moko-collection';
import { mokoChars, subjectMokoKey, STAR_PER_FRIEND, SUN_PER_SUBJECT, PROSPERITY_BONUS, SHIELD_STREAK_REQ } from './moko';
import { COST_SPRAY, COST_SHIELD, COST_FREEZE, POINTS_PER_CHECKIN } from './economy';
import type { Subject } from './types';
import {
  type MokoStage,
  type CastleStateView,
  type BadgeItem,
  STAGE_ORDER,
  STAGE_LABEL,
} from './castle-types';
import {
  getRow,
  ensureCastle,
  computeStreak,
  refreshStages,
  logGrowthEvent,
  getGrowthDiary,
  getMokoProgress,
  shuffle,
} from './castle-core';
import { settleCastle } from './castle-penalty';

const SUBJECTS: Subject[] = ['语文', '数学', '英语'];

// Re-export from sub-modules
export { logGrowthEvent, getGrowthDiary, getMokoProgress, STAGE_LABEL };
export type { MokoStage, CastleStateView, BadgeItem } from './castle-types';

/* ----------------------------- 打卡与奖励 ----------------------------- */
async function awardSubjectMoko(childId: number, subject: Subject) {
  const key = subjectMokoKey[subject];
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status) VALUES (?, ?, ?, 'obtained', CURRENT_TIMESTAMP, 3, 'resident') ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3",
    args: [childId, key, subject],
  });
}

export async function confirm(childId: number, day: string, subject: Subject) {
  const db = getDb();
  await ensureCastle(childId);
  const today = dateStr();
  if (!day || day === 'undefined') day = today;

  await db.execute('BEGIN IMMEDIATE');
  try {
    // 原子级幂等：尝试插入，若冲突则说明已确认
    const insertResult = await db.execute({
      sql: "INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT(child_id, day, subject) DO NOTHING",
      args: [childId, day, subject],
    });
    const isNewConfirm = Number(insertResult.rowsAffected ?? 0) > 0;
    if (!isNewConfirm) {
      await db.execute('COMMIT');
      return { ok: false, message: '该科今天已确认' };
    }

    // 只有新确认才发奖励，避免重复发积分/阳光/萌可/捕捉券
    await db.execute({
      sql: 'INSERT INTO completions (child_id, points, source) VALUES (?, ?, ?)',
      args: [childId, POINTS_PER_CHECKIN, 'checkin:' + subject],
    });

    await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight + ? WHERE child_id = ?', args: [SUN_PER_SUBJECT, childId] });
    await awardSubjectMoko(childId, subject);
    const mokoName = mokoChars[subjectMokoKey[subject]]?.name ?? '萌可';
    const subjectEmoji: Record<Subject, string> = { 语文: '❤️', 数学: '💪', 英语: '🎵' };
    await logGrowthEvent(childId, 'checkin', subjectEmoji[subject] ?? '🌟', '「' + subject + '」打卡成功',
      '阳光能量 +' + SUN_PER_SUBJECT + '，召唤 ' + mokoName + ' 入驻城堡');

    if (day === today) {
      await db.execute({
        sql: 'INSERT INTO capture_tickets (child_id, total, used) VALUES (?, 1, 0) ON CONFLICT(child_id) DO UPDATE SET total = total + 1',
        args: [childId],
      });
      const c = await db.execute({
        sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
        args: [childId, today],
      });
      if (Number(c.rows[0]?.n) === 3) {
        await db.execute({ sql: 'UPDATE castle_state SET prosperity = prosperity + ? WHERE child_id = ?', args: [PROSPERITY_BONUS, childId] });
        await logGrowthEvent(childId, 'prosperity', '🏰', '三科全勤！城堡升级', '繁荣度 +' + PROSPERITY_BONUS + '，萌可们更开心啦');
      }
    } else {
      const c = await db.execute({
        sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
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
        await db.execute('COMMIT');
        return { ok: true, message: '补作业完成！乐美送来 1 瓶魔法喷雾，去背包帮她把捣蛋萌可捉回去吧～' };
      }
    }
    await db.execute('COMMIT');
    return { ok: true, message: '确认「' + subject + '」完成，获得 ' + SUN_PER_SUBJECT + ' 阳光能量 + 1 只萌可！' };
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }
}

export async function buy(childId: number, itemKey: string) {
  const db = getDb();
  await ensureCastle(childId);
  const row = await getRow(childId);
  if (itemKey === 'spray') {
    const cost = COST_SPRAY;
    const res = await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight - ? WHERE child_id = ? AND sunlight >= ?', args: [cost, childId, cost] });
    if (Number(res.rowsAffected ?? 0) === 0) return { ok: false, message: '阳光能量不足' };
    await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, 'spray'] });
    return { ok: true, message: '购买魔法喷雾成功！' };
  }
  if (itemKey === 'freeze') {
    const cost = COST_FREEZE;
    const res = await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight - ? WHERE child_id = ? AND sunlight >= ?', args: [cost, childId, cost] });
    if (Number(res.rowsAffected ?? 0) === 0) return { ok: false, message: '阳光能量不足（需要 ' + cost + ' 阳光）' };
    await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, 'freeze'] });
    return { ok: true, message: '🧊 冰冻徽章购买成功！下次漏卡会自动消耗保护一天连胜。' };
  }
  if (itemKey === 'shield') {
    const cost = COST_SHIELD;
    const streak = await computeStreak(childId, dateStr());
    if (streak < SHIELD_STREAK_REQ) return { ok: false, message: '需连续打卡 ' + SHIELD_STREAK_REQ + ' 天才能兑换护盾（当前 ' + streak + ' 天）' };
    const res = await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight - ?, shield_equipped = shield_equipped + 1 WHERE child_id = ? AND sunlight >= ?', args: [cost, childId, cost] });
    if (Number(res.rowsAffected ?? 0) === 0) return { ok: false, message: '阳光能量不足' };
    return { ok: true, message: '护盾已兑换并自动装备到城堡！' };
  }
  const starItem = (await import('./moko')).starShop.find((s: any) => s.key === itemKey);
  if (!starItem) return { ok: false, message: '未知商品' };
  const starRes = await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins - ? WHERE child_id = ? AND star_coins >= ?', args: [starItem.cost, childId, starItem.cost] });
  if (Number(starRes.rowsAffected ?? 0) === 0) return { ok: false, message: '星星币不足' };
  await db.execute({ sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1', args: [childId, itemKey] });
  if (itemKey.startsWith('skin_')) {
    await db.execute({ sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?', args: [itemKey, childId] });
    return { ok: true, message: '兑换「' + starItem.name + '」成功，城堡已换上新皮肤！' };
  }
  return { ok: true, message: '兑换「' + starItem.name + '」成功！' };
}

export async function setSkin(childId: number, skin: string): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  const isDefault = skin === 'default';
  const qty = Number(
    (await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, skin] })).rows[0]?.qty ?? 0,
  );
  if (!isDefault && qty <= 0) return { ok: false, message: '还没有这个皮肤哦，去星星币商城兑换吧！' };
  await db.execute({ sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?', args: [skin, childId] });
  return { ok: true, message: '城堡皮肤已更新！' };
}

export async function castSpray(childId: number) {
  const db = getDb();
  await ensureCastle(childId);
  const inv = await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) return { ok: false, message: '没有魔法喷雾' };
  const row = await getRow(childId);
  // 只清除最近一天的捣蛋萌可（而非全部历史），避免一次喷雾清掉多天惩罚
  const latestTrouble = await db.execute({ sql: 'SELECT day FROM troublemakers WHERE child_id = ? AND resolved = 0 ORDER BY day DESC LIMIT 1', args: [childId] });
  if (latestTrouble.rows.length) {
    await db.execute({ sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND resolved = 0 AND day = ?', args: [childId, String(latestTrouble.rows[0].day)] });
  }
  await db.execute({ sql: "UPDATE moko_owned SET mood = 3, status = 'resident' WHERE child_id = ?", args: [childId] });
  const returnCoins = Math.ceil(Number(row?.last_stolen ?? 0) * 0.5);
  await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?', args: [returnCoins, childId] });
  const today = dateStr();
  const yesterday = addDays(today, -1);
  await db.execute({ sql: 'UPDATE castle_state SET last_settled_day = ? WHERE child_id = ?', args: [yesterday, childId] });
  await db.execute({ sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?', args: [childId, 'spray'] });
  await logGrowthEvent(childId, 'repair', '🧼', '捉回捣蛋萌可，城堡恢复欢乐！', '和乐美一起捉回捣蛋萌可，萌可们心情全满，找回 ' + returnCoins + ' 星星币');
  return { ok: true, message: '太棒了！和乐美一起捉回捣蛋萌可，找回 ' + returnCoins + ' 星星币～' };
}

export async function grantResource(childId: number, resource: 'sunlight' | 'starCoins' | 'tickets', amount: number): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  await ensureCastle(childId);
  const n = Math.max(0, Math.min(100, Math.floor(amount)));
  if (n <= 0) return { ok: false, message: '数量必须大于 0' };
  if (resource === 'sunlight') {
    await db.execute({ sql: 'UPDATE castle_state SET sunlight = sunlight + ? WHERE child_id = ?', args: [n, childId] });
    await logGrowthEvent(childId, 'gift', '☀️', '爸爸妈妈送了阳光能量', '+' + n + ' 阳光能量');
    return { ok: true, message: '已送 ' + n + ' 阳光能量 ✅' };
  }
  if (resource === 'starCoins') {
    await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?', args: [n, childId] });
    await logGrowthEvent(childId, 'gift', '⭐', '爸爸妈妈送了星星币', '+' + n + ' 星星币');
    return { ok: true, message: '已送 ' + n + ' 星星币 ✅' };
  }
  if (resource === 'tickets') {
    await db.execute({ sql: 'INSERT INTO capture_tickets (child_id, total, used) VALUES (?, ?, 0) ON CONFLICT(child_id) DO UPDATE SET total = total + ?', args: [childId, n, n] });
    await logGrowthEvent(childId, 'gift', '🎟️', '爸爸妈妈送了捕捉券', '+' + n + ' 捕捉券');
    return { ok: true, message: '已送 ' + n + ' 捕捉券 ✅' };
  }
  return { ok: false, message: '未知资源类型' };
}

/**
 * 家长审批时光沙漏申请的入口（带库存校验）。
 * 孩子背包里必须有沙漏，扣减后调用 restoreDay 实际补打卡。
 */
export async function applyTimeGlass(childId: number, day: string): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  await ensureCastle(childId);
  const inv = await db.execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [childId, 'timeglass'] });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) {
    return { ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' };
  }
  const existing = await db.execute({ sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'", args: [childId, day] });
  const doneSet = new Set(existing.rows.map((r) => String(r.subject)));
  const missing = SUBJECTS.filter((s) => !doneSet.has(s));
  if (missing.length === 0) {
    return { ok: false, message: day + ' 三科都已经打卡过了，不用补～' };
  }
  // 扣减沙漏必须先于 confirm 执行：若 confirm 失败则跳过，不浪费沙漏。
  await db.execute({ sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?', args: [childId, 'timeglass'] });
  const restored = await restoreDay(childId, day, missing);
  if (!restored.ok || restored.restored.length === 0) {
    // confirm 都没成功，补回沙漏
    await db.execute({ sql: 'UPDATE inventory SET qty = qty + 1 WHERE child_id = ? AND item_key = ?', args: [childId, 'timeglass'] });
    return { ok: false, message: restored.message };
  }
  const extraMsg = restored.coinsReturned > 0 ? '，还找回了被藏起来的星星币！' : '！';
  return { ok: true, message: '⏳ 时光沙漏生效！' + day + ' 的 ' + restored.restored.join('、') + ' 补打卡成功，连续天数已恢复' + extraMsg };
}

/**
 * 补打卡核心逻辑（不带库存校验），供 applyTimeGlass 和家长审批共用。
 * 将指定日期缺少的科目全部确认，同时处理捣蛋萌可、逃亡萌可、被藏星星币。
 */
export async function restoreDay(
  childId: number,
  day: string,
  subjectsToConfirm?: Subject[],
): Promise<{ ok: boolean; message: string; restored: Subject[]; coinsReturned: number }> {
  const db = getDb();
  await ensureCastle(childId);

  // 确定需要补的科目
  let missing: Subject[];
  if (subjectsToConfirm) {
    missing = subjectsToConfirm;
  } else {
    const existing = await db.execute({ sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'", args: [childId, day] });
    const doneSet = new Set(existing.rows.map((r) => String(r.subject)));
    missing = SUBJECTS.filter((s) => !doneSet.has(s));
  }

  const restored: Subject[] = [];
  for (const subject of missing) {
    const res = await confirm(childId, day, subject);
    if (res.ok) restored.push(subject);
  }

  // 三科全补则标记每日一练完成
  const finalCheckins = await db.execute({ sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'", args: [childId, day] });
  if (Number(finalCheckins.rows[0]?.n) >= 3) {
    await db.execute({ sql: "INSERT INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 1, 0, 0, '[]') ON CONFLICT(child_id, day) DO UPDATE SET completed = 1", args: [childId, day] });
  }

  // 解决该日捣蛋萌可
  await db.execute({ sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND day = ?', args: [childId, day] });
  // 召回逃亡萌可
  await db.execute({ sql: "UPDATE moko_owned SET status = 'resident', mood = 3 WHERE child_id = ? AND status = 'fled'", args: [childId] });

  // 找回被藏起来的星星币
  let coinsReturned = 0;
  const row = await getRow(childId);
  const lastStolen = Number(row?.last_stolen ?? 0);
  if (lastStolen > 0) {
    coinsReturned = Math.ceil(lastStolen * 0.5);
    await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?', args: [coinsReturned, childId] });
  }

  await logGrowthEvent(childId, 'repair', '⏳', '用时光沙漏补打卡 ' + day, day + ' 补打卡 ' + restored.join('、') + '，连续天数已恢复！捣蛋萌可被赶走，萌可们全部回来啦～');
  return { ok: true, message: '补打卡成功', restored, coinsReturned };
}

export async function harvest(childId: number) {
  const db = getDb();
  await ensureCastle(childId);
  const today = dateStr();
  const friends = (await db.execute({ sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident' AND stage = 'friend' AND last_harvest_day != ?", args: [childId, today] })).rows;
  if (!friends.length) return { ok: true, gained: 0, message: '今天还没有可收获的星星币～' };
  const gained = friends.length * STAR_PER_FRIEND;
  await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?', args: [gained, childId] });
  for (const r of friends) {
    await db.execute({ sql: 'UPDATE moko_owned SET last_harvest_day = ? WHERE id = ?', args: [today, Number(r.id)] });
  }
  await logGrowthEvent(childId, 'harvest', '⭐', '收获星星币', '萌可朋友们产出了 ' + gained + ' 星星币');
  return { ok: true, gained, message: '收获 ' + gained + ' 星星币！' };
}

export async function getCastleState(childId: number): Promise<CastleStateView> {
  const today = dateStr();
  await ensureCastle(childId);
  await refreshStages(childId);
  await settleCastle(childId, today);

  const db = getDb();
  const [row, checkRows, owned, trouble, inv, past, troubleDays, penaltyEvents, freezeRow] = await Promise.all([
    getRow(childId),
    db.execute({ sql: 'SELECT subject, status FROM daily_checkins WHERE child_id = ? AND day = ?', args: [childId, today] }),
    db.execute({ sql: 'SELECT * FROM moko_owned WHERE child_id = ?', args: [childId] }),
    db.execute({ sql: 'SELECT moko_key FROM troublemakers WHERE child_id = ? AND resolved = 0', args: [childId] }),
    db.execute({ sql: 'SELECT item_key, qty FROM inventory WHERE child_id = ?', args: [childId] }),
    db.execute({ sql: "SELECT day, subject, status FROM daily_checkins WHERE child_id = ? AND day < ? ORDER BY day DESC", args: [childId, today] }),
    db.execute({ sql: 'SELECT DISTINCT day FROM troublemakers WHERE child_id = ? AND resolved = 0', args: [childId] }),
    db.execute({ sql: "SELECT title, desc FROM growth_events WHERE child_id = ? AND type = 'penalty' AND day = ? ORDER BY id DESC LIMIT 1", args: [childId, today] }),
    db.execute({ sql: "SELECT qty FROM inventory WHERE child_id = ? AND item_key = 'freeze'", args: [childId] }).catch(() => ({ rows: [] as any[] })),
  ]);

  const sunlight = Number(row?.sunlight ?? 0);
  const starCoins = Number(row?.star_coins ?? 0);
  const prosperity = Number(row?.prosperity ?? 0);
  const streakDays = Number(row?.streak_days ?? 0);
  const shieldEquipped = Number(row?.shield_equipped ?? 0);
  const freezeCount = Number(freezeRow?.rows?.[0]?.qty ?? 0);
  const skin = String(row?.skin ?? 'default');

  const checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'> = { 语文: 'pending', 数学: 'pending', 英语: 'pending' };
  for (const r of checkRows.rows) {
    const s = r.subject as Subject;
    if (s in checkins) checkins[s] = (r.status as any) || 'pending';
  }

  const now = Date.now();
  const residents: any[] = owned.rows.filter((r: any) => r.status === 'resident').map((r: any) => {
    const key = String(r.moko_key);
    const mc = mokoChars[key];
    const stage = r.stage as MokoStage;
    let progress = 1;
    let nextStage: MokoStage | null = null;
    if (stage !== 'friend') {
      const stageAt = new Date(String(r.stage_at)).getTime();
      const total = (stage === 'obtained' ? 5 : stage === 'settled' ? 10 : 15) * 60000;
      progress = Math.max(0, Math.min(1, (now - stageAt) / total));
      nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
    }
    return { key, name: mc?.name ?? key, img: mc?.img ?? '', emoji: mc?.emoji ?? '✨', color: mc?.color ?? 'text-slate-500', stage, mood: Number(r.mood), status: 'resident' as const, progress, nextStage };
  }).sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  const collectedNames = new Set(owned.rows.map((r: any) => mokoChars[String(r.moko_key)]?.name).filter((n: any): n is string => !!n));
  const seenName = new Set<string>();
  const gallery: any[] = [];
  for (const m of mokoCollection) {
    if (m.category === 'trouble') continue;
    if (seenName.has(m.name)) continue;
    seenName.add(m.name);
    gallery.push({ key: m.key, name: m.name, img: m.img ?? '', emoji: m.emoji, color: m.color, category: m.category, subject: m.subject, owned: collectedNames.has(m.name) });
  }

  const troublemakers = trouble.rows.map((r: any) => {
    const mc = mokoChars[String(r.moko_key)];
    return { key: String(r.moko_key), name: mc?.name ?? '捣蛋萌可', img: mc?.img ?? '' };
  });

  const inventory: Record<string, number> = {};
  for (const r of inv.rows) inventory[String(r.item_key)] = Number(r.qty);

  const byDay = new Map<string, { confirmed: number; missed: Subject[]; hasTrouble: boolean }>();
  for (const r of past.rows) {
    const d = String(r.day);
    if (!byDay.has(d)) byDay.set(d, { confirmed: 0, missed: [], hasTrouble: false });
    const e = byDay.get(d)!;
    if (r.status === 'confirmed') e.confirmed++;
    else e.missed.push(r.subject as Subject);
  }
  const troubleDaySet = new Set(troubleDays.rows.map((r: any) => String(r.day)));
  const missedDays = Array.from(byDay.entries()).filter(([, v]) => v.confirmed < 3).map(([day, v]) => ({ day, missed: v.missed, hasTrouble: troubleDaySet.has(day) })).slice(0, 14);

  const friendRows = owned.rows.filter((r: any) => r.status === 'resident' && r.stage === 'friend');
  const friendTotal = friendRows.length;
  const friendHarvestedToday = friendRows.filter((r: any) => String(r.last_harvest_day) === today).length;
  const harvestableStars = (friendTotal - friendHarvestedToday) * STAR_PER_FRIEND;

  let penaltyAlert = '';
  if (penaltyEvents.rows.length) {
    penaltyAlert = String(penaltyEvents.rows[0].desc ?? '');
  }

  return {
    today, sunlight, starCoins, harvestableStars, friendTotal, friendHarvestedToday,
    prosperity, streakDays, shieldEquipped, skin, checkins, residents, gallery,
    troublemakers, inventory, missedDays,
    canBuyShield: streakDays >= SHIELD_STREAK_REQ,
    freezeCount,
    noStarToday: false,
    penaltyAlert,
  };
}

export async function getBadges(childId: number): Promise<BadgeItem[]> {
  const db = getDb();
  const row = await getRow(childId);
  const prosperity = Number(row?.prosperity ?? 0);
  const streak = await computeStreak(childId, dateStr());
  const { owned: mokoCount } = await getMokoProgress(childId);
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
    { id: 'raz', name: 'RAZ 小学者', emoji: '🇧🇷', desc: '攻克 5 个英语易错词', earned: enCount >= 5, hint: '英语发音评测把 5 个词练到 3 星' },
    { id: 'full', name: '满血城堡', emoji: '🌟', desc: '繁荣 20 且无捣蛋萌可', earned: prosperity >= 20 && troubleCount === 0, hint: '繁荣度 20 且城堡无捣蛋萌可' },
  ];
}