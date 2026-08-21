import { getDb } from './db';
import { dateStr, addDays } from './date';
import { mokoCollection, COLLECTIBLE_MOKO_NAMES } from './moko-collection';
import { mokoChars, STAR_PER_FRIEND, GROWTH_MIN } from './moko';
import { SHIELD_STREAK_REQ } from './economy';
import type { Subject } from './types';
import {
  type MokoStage,
  type GrowthEvent,
  type ResidentMoko,
  type CastleStateView,
  type BadgeItem,
  STAGE_ORDER,
  STAGE_LABEL,
} from './castle-types';

const SUBJECTS: Subject[] = ['语文', '数学', '英语'];

/* ----------------------------- 基础读写 ----------------------------- */
export async function getRow(childId: number) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM castle_state WHERE child_id = ?', args: [childId] });
  return res.rows[0];
}

export async function ensureCastle(childId: number) {
  const db = getDb();
  const initSettledDay = addDays(dateStr(), -1);
  await db.execute({
    sql: 'INSERT OR IGNORE INTO castle_state (child_id, sunlight, star_coins, prosperity, last_settled_day) VALUES (?, 0, 0, 0, ?)',
    args: [childId, initSettledDay],
  });
  await db.execute({
    sql: `INSERT OR IGNORE INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
          VALUES (?, 'lemei', NULL, 'friend', CURRENT_TIMESTAMP, 3, 'resident')`,
    args: [childId],
  });
}

/* 连续打卡天数（截至昨天） */
export async function computeStreak(childId: number, today: string): Promise<number> {
  const db = getDb();
  const yesterday = addDays(today, -1);
  const start = addDays(today, -60);
  const res = await db.execute({
    sql: `SELECT day, COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND status = 'confirmed' AND day >= ? AND day <= ? GROUP BY day`,
    args: [childId, start, yesterday],
  });
  const fullDays = new Set<string>();
  for (const r of res.rows) {
    if (Number(r.n) === 3) fullDays.add(String(r.day));
  }
  let streak = 0;
  let d = yesterday;
  while (fullDays.has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

/* ----------------------------- 萌可成长 ----------------------------- */
export function durMinForStage(stage: MokoStage): number {
  if (stage === 'obtained') return GROWTH_MIN.settled;
  if (stage === 'settled') return GROWTH_MIN.playing;
  return GROWTH_MIN.friend;
}

export async function refreshStages(childId: number) {
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

/* ----------------------------- 成长日记 ----------------------------- */
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

/* ----------------------------- 图鉴进度 ----------------------------- */
export async function getMokoProgress(childId: number): Promise<{ owned: number; total: number; percent: number }> {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT moko_key FROM moko_owned WHERE child_id = ?', args: [childId] });
  const ownedNames = new Set(
    res.rows.map((r) => mokoChars[String(r.moko_key)]?.name).filter((n): n is string => !!n),
  );
  const owned = ownedNames.size;
  const total = COLLECTIBLE_MOKO_NAMES.length;
  const percent = total > 0 ? owned / total : 0;
  return { owned, total, percent };
}

/* ----------------------------- 洗牌工具 ----------------------------- */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { STAGE_LABEL, SUBJECTS };
