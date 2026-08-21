import { getDb } from './db';
import { dateStr, addDays } from './date';
import { mokoChars, troubleMokoKeys } from './moko';
import { getRow, ensureCastle, logGrowthEvent, shuffle } from './castle-core';
import type { MokoStage } from './castle-types';

/**
 * 连续漏打卡逐级惩罚。consecutiveMissed = 连续多少天未三科全勤。
 * 惩罚阶梯：
 *   第 1 天 → 1 只萌可 -1 心情（善意提醒）
 *   第 2 天 → 1 只萌可 -2 心情 + 1 捣蛋萌可
 *   第 3 天 → 1 只吓跑 + 1 只 -2 心情 + 2 捣蛋 + 藏 25% 星星币
 *   第 4 天 → 2 只吓跑 + 剩余 -2 心情 + 3 捣蛋 + 藏 50% 星星币
 *   第 5 天+ → 全部吓跑 + 3 捣蛋 + 藏 50% 星星币
 */
async function applyPenalty(childId: number, day: string, consecutiveMissed: number) {
  const db = getDb();
  if (consecutiveMissed <= 0) return;

  const row = await getRow(childId);
  let shield = Number(row?.shield_equipped ?? 0);
  let star = Number(row?.star_coins ?? 0);
  let lastStolen = Number(row?.last_stolen ?? 0);

  // 捣蛋萌可数量：第 1 天 0 只，之后逐天递增，上限 3 只
  const troubleCount = Math.max(0, Math.min(consecutiveMissed - 1, 3));
  let spawn = troubleCount;
  if (shield > 0 && spawn > 0) {
    shield -= 1;
    spawn -= 1;
  }
  for (let i = 0; i < spawn; i++) {
    const key = troubleMokoKeys[i % troubleMokoKeys.length];
    await db.execute({
      sql: 'INSERT INTO troublemakers (child_id, moko_key, day, resolved) VALUES (?, ?, ?, 0)',
      args: [childId, key, day],
    });
  }

  // 藏星星币（第 3 天起）
  if (consecutiveMissed >= 3 && star > 0) {
    const pct = consecutiveMissed >= 4 ? 0.5 : 0.25;
    const stolen = Math.floor(star * pct);
    star -= stolen;
    lastStolen += stolen;
  }

  // 随机惩罚萌可
  const residents = (
    await db.execute({ sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident'", args: [childId] })
  ).rows;
  const flee = (id: number) =>
    db.execute({ sql: "UPDATE moko_owned SET status = 'fled', mood = 0 WHERE id = ?", args: [id] });
  const hitMood = (id: number, dec: number) =>
    db.execute({ sql: 'UPDATE moko_owned SET mood = MAX(0, mood - ?) WHERE id = ?', args: [dec, id] });

  const getMokoName = (r: any) => {
    const mc = mokoChars[String(r.moko_key)];
    return mc?.name ?? String(r.moko_key);
  };

  let penaltySummary = '';

  if (consecutiveMissed === 1) {
    if (residents.length) {
      const [target] = shuffle(residents);
      await hitMood(Number(target.id), 1);
      penaltySummary = getMokoName(target) + ' 心情下降了，因为昨天没有打卡 😢';
    }
  } else if (consecutiveMissed === 2) {
    if (residents.length) {
      const [target] = shuffle(residents);
      await hitMood(Number(target.id), 2);
      penaltySummary = getMokoName(target) + ' 心情下降了，连续 2 天没打卡，捣蛋萌可溜进了城堡 😈';
    }
  } else if (consecutiveMissed === 3) {
    if (residents.length >= 2) {
      const shuffled = shuffle(residents);
      await flee(Number(shuffled[0].id));
      await hitMood(Number(shuffled[1].id), 2);
      penaltySummary = getMokoName(shuffled[0]) + ' 被吓跑了！' + getMokoName(shuffled[1]) + ' 心情下降，还丢了 25% 的星星币 😰';
    } else if (residents.length === 1) {
      const [target] = shuffle(residents);
      await hitMood(Number(target.id), 2);
      penaltySummary = getMokoName(target) + ' 心情下降了，还丢了 25% 的星星币 😰';
    }
  } else if (consecutiveMissed === 4) {
    if (residents.length >= 2) {
      const shuffled = shuffle(residents);
      const n = Math.min(2, shuffled.length);
      const names: string[] = [];
      for (let i = 0; i < n; i++) {
        await flee(Number(shuffled[i].id));
        names.push(getMokoName(shuffled[i]));
      }
      for (let i = n; i < shuffled.length; i++) {
        await hitMood(Number(shuffled[i].id), 2);
      }
      penaltySummary = names.join('、') + ' 被吓跑了！连续 4 天没打卡，城堡陷入危机 😱';
    } else {
      for (const r of residents) await hitMood(Number(r.id), 2);
      if (residents.length) penaltySummary = getMokoName(residents[0]) + ' 心情很低落，连续 4 天没打卡了 😱';
    }
  } else {
    for (const r of residents) await flee(Number(r.id));
    penaltySummary = '连续 ' + consecutiveMissed + ' 天没打卡，所有萌可都被吓跑了，城堡一片混乱 💀';
  }

  if (penaltySummary) {
    await logGrowthEvent(childId, 'penalty', '⚠️', '连续 ' + consecutiveMissed + ' 天漏打卡', penaltySummary);
  }

  await db.execute({
    sql: 'UPDATE castle_state SET shield_equipped = ?, star_coins = ?, last_stolen = ? WHERE child_id = ?',
    args: [shield, star, lastStolen, childId],
  });
}

/* ----------------------------- 每日结算 ----------------------------- */
export async function settleCastle(childId: number, today: string) {
  const row = await getRow(childId);
  if (!row) return;
  const initialLast = row.last_settled_day ? String(row.last_settled_day) : today;
  let cursor = addDays(initialLast, 1);
  const yesterday = addDays(today, -1);
  if (cursor > yesterday) return;
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT day, COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND status = 'confirmed' AND day >= ? AND day <= ? GROUP BY day",
    args: [childId, cursor, yesterday],
  });
  const confirmedByDay = new Map<string, number>();
  for (const r of res.rows) confirmedByDay.set(String(r.day), Number(r.n));

  let streak = Number(row.streak_days ?? 0);
  let consecutiveMissed = 0;
  let last = initialLast;
  while (cursor <= yesterday) {
    const confirmed = confirmedByDay.get(cursor) ?? 0;
    const isFullDay = confirmed === 3;
    if (!isFullDay) {
      // 🧊 检查冰冻徽章：有则消耗保护一天连胜（与连胜更新在同一条 SQL 中保证一致性）
      let frozen = false;
      try {
        const fr = await db.execute({ sql: "SELECT id, qty FROM inventory WHERE child_id = ? AND item_key = 'freeze' AND qty > 0", args: [childId] });
        if (fr.rows.length > 0) {
          const freezeId = Number(fr.rows[0].id);
          await db.execute({ sql: 'UPDATE inventory SET qty = qty - 1 WHERE id = ?', args: [freezeId] });
          await db.execute({ sql: "DELETE FROM inventory WHERE id = ? AND qty <= 0", args: [freezeId] });
          frozen = true;
          streak = streak + 1;
          await db.execute({ sql: 'UPDATE castle_state SET streak_days = ? WHERE child_id = ?', args: [streak, childId] });
          await logGrowthEvent(childId, 'freeze', '🧊', '冰冻徽章保护', '🧊 冰冻徽章自动消耗，' + cursor + ' 漏卡但连胜未中断！');
        }
      } catch { /* inventory 表可能不存在 */ }
      if (!frozen) {
        consecutiveMissed++;
        await applyPenalty(childId, cursor, consecutiveMissed);
        streak = 0;
      }
    } else {
      consecutiveMissed = 0;
      streak = streak + 1;
    }
    await db.execute({ sql: 'UPDATE castle_state SET streak_days = ? WHERE child_id = ?', args: [streak, childId] });
    last = cursor;
    cursor = addDays(cursor, 1);
  }
  if (last !== initialLast) {
    await db.execute({ sql: 'UPDATE castle_state SET last_settled_day = ? WHERE child_id = ?', args: [last, childId] });
  }
}