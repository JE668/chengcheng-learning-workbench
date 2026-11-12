/** 城堡状态视图与勋章查询。 */

import { getDb } from './db';
import { dateStr } from './date';
import { mokoCollection } from './moko-collection';
import { mokoChars, STAR_PER_FRIEND, SHIELD_STREAK_REQ, GROWTH_MIN } from './moko';
import type { Subject } from './types';
import {
  type MokoStage,
  type CastleStateView,
  type ResidentMoko,
  type BadgeItem,
  STAGE_ORDER,
} from './castle-types';
import { getRow, ensureCastle, computeStreak, refreshStages, getMokoProgress } from './castle-core';
import { settleCastle } from './castle-settlement';

/** moko_owned 表行（libsql Row 的字段子集，显式声明以替代 any）。 */
interface MokoOwnedRow {
  moko_key?: unknown;
  status?: unknown;
  stage?: unknown;
  mood?: unknown;
  stage_at?: unknown;
  last_harvest_day?: unknown;
}

/** troublemakers 表行（仅取 moko_key / day 两列）。 */
interface TroubleRow {
  moko_key?: unknown;
  day?: unknown;
}

export async function getCastleState(childId: number): Promise<CastleStateView> {
  const today = dateStr();
  await ensureCastle(childId);
  await refreshStages(childId);
  await settleCastle(childId, today);

  const db = getDb();
  const [row, checkRows, owned, trouble, inv, past, troubleDays, penaltyEvents, freezeRow] =
    await Promise.all([
      getRow(childId),
      db.execute({
        sql: 'SELECT subject, status FROM daily_checkins WHERE child_id = ? AND day = ?',
        args: [childId, today],
      }),
      db.execute({ sql: 'SELECT * FROM moko_owned WHERE child_id = ?', args: [childId] }),
      db.execute({
        sql: 'SELECT moko_key FROM troublemakers WHERE child_id = ? AND resolved = 0',
        args: [childId],
      }),
      db.execute({
        sql: 'SELECT item_key, qty FROM inventory WHERE child_id = ?',
        args: [childId],
      }),
      db.execute({
        // 只取最近 30 天。
        // 原先没有 LIMIT，会把**全部历史打卡**捞出来；而这些行最终只用来拼
        // 最近 14 天的 missedDays（下面 slice(0, 14)），多出来的纯属白读白解析，
        // 并随孩子使用月数增长而无界变慢。30 天足够覆盖 14 天窗口 + 排序余量。
        sql: 'SELECT day, subject, status FROM daily_checkins WHERE child_id = ? AND day < ? ORDER BY day DESC LIMIT 30',
        args: [childId, today],
      }),
      db.execute({
        sql: 'SELECT DISTINCT day FROM troublemakers WHERE child_id = ? AND resolved = 0',
        args: [childId],
      }),
      db.execute({
        sql: "SELECT title, desc FROM growth_events WHERE child_id = ? AND type = 'penalty' AND day = ? ORDER BY id DESC LIMIT 1",
        args: [childId, today],
      }),
      db
        .execute({
          sql: "SELECT qty FROM inventory WHERE child_id = ? AND item_key = 'freeze'",
          args: [childId],
        })
        .catch(() => ({ rows: [] as { qty: unknown }[] })),
    ]);

  const sunlight = Number(row?.sunlight ?? 0);
  const starCoins = Number(row?.star_coins ?? 0);
  const prosperity = Number(row?.prosperity ?? 0);
  const streakDays = Number(row?.streak_days ?? 0);
  const shieldEquipped = Number(row?.shield_equipped ?? 0);
  const freezeCount = Number(freezeRow?.rows?.[0]?.qty ?? 0);
  const skin = String(row?.skin ?? 'default');

  const checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'> = {
    语文: 'pending',
    数学: 'pending',
    英语: 'pending',
  };
  for (const r of checkRows.rows) {
    const s = r.subject as Subject;
    if (s in checkins)
      checkins[s] = (r.status as 'pending' | 'child_done' | 'confirmed') || 'pending';
  }

  const now = Date.now();
  const residents: ResidentMoko[] = (owned.rows as MokoOwnedRow[])
    .filter((r) => r.status === 'resident')
    .map((r) => {
      const key = String(r.moko_key);
      const mc = mokoChars[key];
      const stage = r.stage as MokoStage;
      let progress = 1;
      let nextStage: MokoStage | null = null;
      if (stage !== 'friend') {
        const stageAt = new Date(String(r.stage_at)).getTime();
        // 分母与 refreshStages 的 durMinForStage/GROWTH_MIN 同源（10/30/60 分钟）：
        // 原写死 5/10/15 让进度条提前到 100% 后长时间「卡住」才升级，孩子困惑。
        const total =
          (stage === 'obtained'
            ? GROWTH_MIN.settled
            : stage === 'settled'
              ? GROWTH_MIN.playing
              : GROWTH_MIN.friend) * 60000;
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

  const collectedNames = new Set(
    (owned.rows as MokoOwnedRow[])
      .map((r) => mokoChars[String(r.moko_key)]?.name)
      .filter((n): n is string => !!n)
  );
  const seenName = new Set<string>();
  const gallery: CastleStateView['gallery'] = [];
  for (const m of mokoCollection) {
    if (m.category === 'trouble') continue;
    if (seenName.has(m.name)) continue;
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

  const troublemakers = (trouble.rows as TroubleRow[]).map((r) => {
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
  const troubleDaySet = new Set((troubleDays.rows as TroubleRow[]).map((r) => String(r.day)));
  const missedDays = Array.from(byDay.entries())
    .filter(([, v]) => v.confirmed < 3)
    .map(([day, v]) => ({ day, missed: v.missed, hasTrouble: troubleDaySet.has(day) }))
    .slice(0, 14);

  const friendRows = (owned.rows as MokoOwnedRow[]).filter(
    (r) => r.status === 'resident' && r.stage === 'friend'
  );
  const friendTotal = friendRows.length;
  const friendHarvestedToday = friendRows.filter(
    (r) => String(r.last_harvest_day) === today
  ).length;
  const harvestableStars = (friendTotal - friendHarvestedToday) * STAR_PER_FRIEND;

  let penaltyAlert = '';
  if (penaltyEvents.rows.length) {
    penaltyAlert = String(penaltyEvents.rows[0].desc ?? '');
  }

  return {
    today,
    sunlight,
    starCoins,
    harvestableStars,
    friendTotal,
    friendHarvestedToday,
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
    freezeCount,
    noStarToday: false,
    penaltyAlert,
  };
}

export async function getBadges(childId: number): Promise<BadgeItem[]> {
  const db = getDb();
  // 7 个指标互不依赖——并行取齐（此前纯串行 7 个往返，报表/城堡页徽章区
  // 首屏多吃 6 拍）。
  const [row, streak, moko, resolved, enResolved, pts, trouble] = await Promise.all([
    getRow(childId),
    computeStreak(childId, dateStr()),
    getMokoProgress(childId),
    db.execute({
      sql: 'SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND resolved = 1',
      args: [childId],
    }),
    db.execute({
      sql: "SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND subject = '英语' AND resolved = 1",
      args: [childId],
    }),
    db.execute({
      sql: 'SELECT COALESCE(SUM(points),0) n FROM completions WHERE child_id = ?',
      args: [childId],
    }),
    db.execute({
      sql: 'SELECT COUNT(*) n FROM troublemakers WHERE child_id = ? AND resolved = 0',
      args: [childId],
    }),
  ]);
  const prosperity = Number(row?.prosperity ?? 0);
  const { owned: mokoCount } = moko;
  const resolvedCount = Number(resolved.rows[0]?.n ?? 0);
  const enCount = Number(enResolved.rows[0]?.n ?? 0);
  const points = Number(pts.rows[0]?.n ?? 0);
  const troubleCount = Number(trouble.rows[0]?.n ?? 0);

  return [
    {
      id: 'first',
      name: '萌可初遇',
      emoji: '🌱',
      desc: '召唤第一只萌可',
      earned: mokoCount >= 1,
      hint: '完成任意一科打卡召唤萌可',
    },
    {
      id: 'castle',
      name: '城堡小主',
      emoji: '🏰',
      desc: '繁荣度达到 10',
      earned: prosperity >= 10,
      hint: '繁荣度达到 10',
    },
    {
      id: 'streak',
      name: '三日之约',
      emoji: '🔥',
      desc: '连续打卡 3 天',
      earned: streak >= 3,
      hint: '连续 3 天三科全打卡',
    },
    {
      id: 'mistake',
      name: '错题克星',
      emoji: '📝',
      desc: '复习解决 10 道错题',
      earned: resolvedCount >= 10,
      hint: '在复习本把 10 道错题练会',
    },
    {
      id: 'star',
      name: '学习之星',
      emoji: '⭐',
      desc: '累计获得 50 积分',
      earned: points >= 50,
      hint: '累计获得 50 积分',
    },
    {
      id: 'family',
      name: '萌可大家族',
      emoji: '👑',
      desc: '收集 5 只萌可',
      earned: mokoCount >= 5,
      hint: '收集 5 只萌可',
    },
    {
      id: 'raz',
      name: 'RAZ 小学者',
      emoji: '🇧🇷',
      desc: '攻克 5 个英语易错词',
      earned: enCount >= 5,
      hint: '英语发音评测把 5 个词练到 3 星',
    },
    {
      id: 'full',
      name: '满血城堡',
      emoji: '🌟',
      desc: '繁荣 20 且无捣蛋萌可',
      earned: prosperity >= 20 && troubleCount === 0,
      hint: '繁荣度 20 且城堡无捣蛋萌可',
    },
  ];
}
