/** 漏卡惩罚阶梯：仅负责对单个已漏卡日期施加惩罚。 */

import { getDb } from './db';
import { mokoChars, troubleMokoKeys } from './moko';
import { getRow, logGrowthEvent, shuffle } from './castle-core';

/**
 * 连续漏打卡逐级惩罚。consecutiveMissed = 连续多少天未三科全勤。
 * 惩罚阶梯：
 *   第 1 天 → 1 只萌可 -1 心情（善意提醒）
 *   第 2 天 → 1 只萌可 -2 心情 + 1 捣蛋萌可
 *   第 3 天 → 1 只吓跑 + 1 只 -2 心情 + 2 捣蛋 + 藏 25% 星星币
 *   第 4 天 → 2 只吓跑 + 剩余 -2 心情 + 3 捣蛋 + 藏 50% 星星币
 *   第 5 天+ → 全部吓跑 + 3 捣蛋 + 藏 50% 星星币
 */
export async function applyPenalty(childId: number, day: string, consecutiveMissed: number) {
  const db = getDb();
  if (consecutiveMissed <= 0) return;

  const row = await getRow(childId);
  const shield = Number(row?.shield_equipped ?? 0);
  const star = Number(row?.star_coins ?? 0);

  // 捣蛋萌可数量：第 1 天 0 只，之后逐天递增，上限 3 只
  const troubleCount = Math.max(0, Math.min(consecutiveMissed - 1, 3));
  let spawn = troubleCount;
  const shieldUsed = shield > 0 && spawn > 0;
  if (shieldUsed) spawn -= 1;
  for (let i = 0; i < spawn; i++) {
    const key = troubleMokoKeys[i % troubleMokoKeys.length];
    await db.execute({
      sql: 'INSERT INTO troublemakers (child_id, moko_key, day, resolved) VALUES (?, ?, ?, 0)',
      args: [childId, key, day],
    });
  }

  // 藏星星币（第 3 天起）
  // ⚠️ 用**增量 UPDATE** 写回，不用内存里的绝对值：applyPenalty 跑在 withWriteLock 内，
  // 但 grantResource（家长送币）不走锁。旧实现读出 star_coins → 内存计算 → 绝对值写回，
  // 结算期间家长恰好送币会被旧值覆盖丢失。增量写只动自己那一份，天然不覆盖别人。
  let stolen = 0;
  if (consecutiveMissed >= 3 && star > 0) {
    const pct = consecutiveMissed >= 4 ? 0.5 : 0.25;
    stolen = Math.floor(star * pct);
  }

  // 随机惩罚萌可
  const residents = (
    await db.execute({
      sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident'",
      args: [childId],
    })
  ).rows;
  const flee = (id: number) =>
    db.execute({ sql: "UPDATE moko_owned SET status = 'fled', mood = 0 WHERE id = ?", args: [id] });
  const hitMood = (id: number, dec: number) =>
    db.execute({
      sql: 'UPDATE moko_owned SET mood = MAX(0, mood - ?) WHERE id = ?',
      args: [dec, id],
    });

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
      penaltySummary =
        getMokoName(shuffled[0]) +
        ' 被吓跑了！' +
        getMokoName(shuffled[1]) +
        ' 心情下降，还丢了 25% 的星星币 😰';
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
      if (residents.length)
        penaltySummary = getMokoName(residents[0]) + ' 心情很低落，连续 4 天没打卡了 😱';
    }
  } else {
    for (const r of residents) await flee(Number(r.id));
    penaltySummary = '连续 ' + consecutiveMissed + ' 天没打卡，所有萌可都被吓跑了，城堡一片混乱 💀';
  }

  if (penaltySummary) {
    await logGrowthEvent(
      childId,
      'penalty',
      '⚠️',
      '连续 ' + consecutiveMissed + ' 天漏打卡',
      penaltySummary
    );
  }

  // 增量写回：护盾扣减仅在真正挡下捣蛋时发生；藏币扣 stolen、记入 last_stolen。
  // 三条都只动自己的差量，不覆盖并发写入（见上面「藏星星币」处的说明）。
  if (shieldUsed || stolen > 0) {
    await db.execute({
      sql: 'UPDATE castle_state SET shield_equipped = shield_equipped - 1, star_coins = star_coins - ?, last_stolen = last_stolen + ? WHERE child_id = ?',
      args: [stolen, stolen, childId],
    });
  }
}
