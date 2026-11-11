/** 每日城堡结算：补算截止昨日的连续打卡、冰冻保护与逐级惩罚。 */

import { getDb, withWriteLock } from './db';
import { addDays } from './date';
import { getRow, logGrowthEvent } from './castle-core';
import { applyPenalty } from './castle-penalty-rule';

/* ----------------------------- 每日结算 ----------------------------- */
export async function settleCastle(childId: number, today: string) {
  return withWriteLock(async () => {
    const row = await getRow(childId);
    if (!row) return;
    const initialLast = row.last_settled_day ? String(row.last_settled_day) : today;
    const cursor = addDays(initialLast, 1);
    const yesterday = addDays(today, -1);
    if (cursor > yesterday) return;
    const db = getDb();
    // ⚠️ 整个补结算循环包进事务：循环中途崩溃（NAS 断电 / docker 重启）时，
    // 若 last_settled_day 未推进，重启后同一天会被**二次惩罚**——捣蛋萌可翻倍、
    // 星星币重复藏、冰冻徽章重复消耗。与 castle.confirm / castle.buy 同一套做法
    //（withWriteLock 解决并发，BEGIN/COMMIT 解决崩溃）。
    // 逐日 UPDATE streak_days 保留：万一真崩溃，进度最多丢整段（可重放），不会半段生效。
    await db.execute('BEGIN IMMEDIATE');
    try {
      await settleLocked(db, childId, today, initialLast, Number(row.streak_days ?? 0), cursor);
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  });
}

/** 事务主体（仅在 settleCastle 的 BEGIN/COMMIT 之间调用）。 */
async function settleLocked(
  db: ReturnType<typeof getDb>,
  childId: number,
  today: string,
  initialLast: string,
  initialStreak: number,
  cursor: string
) {
  const yesterday = addDays(today, -1);
  const res = await db.execute({
    sql: "SELECT day, COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND status = 'confirmed' AND day >= ? AND day <= ? GROUP BY day",
    args: [childId, cursor, yesterday],
  });
  const confirmedByDay = new Map<string, number>();
  for (const r of res.rows) confirmedByDay.set(String(r.day), Number(r.n));

  // 🌴 节假日豁免（迁移 v20）：出游/请假日整段跳过——不加惩罚、不加连胜、
  // 不消耗冰冻徽章（等同「这一天不存在」）。查一次豁免日集合（全家共用）。
  // 表不存在（旧库未跑迁移）时静默跳过——豁免是增强，绝不阻塞结算主体。
  const exemptSet = new Set<string>();
  try {
    const ex = await db.execute({ sql: 'SELECT day FROM holiday_exemptions', args: [] });
    for (const r of ex.rows) exemptSet.add(String(r.day));
  } catch {
    /* holiday_exemptions 表不存在 */
  }

  let streak = initialStreak;
  let consecutiveMissed = 0;
  let last = initialLast;
  // ⚠️ 补结算上限：游标落后太多时（容器停了几天/几周），逐日重放会长时间
  // 持有**全局写锁**（withWriteLock），把其它写接口全堵在后面；而且这些天
  // 多半本来就没打卡，逐日结算只会一路累加惩罚事件。
  // 这里只补最近 MAX_CATCHUP_DAYS 天，更早的部分把游标直接推到窗口起点 ——
  // 漏卡事实仍记在 daily_checkins 里，UI 的 missedDays 展示不受影响。
  const MAX_CATCHUP_DAYS = 30;
  const catchupFloor = addDays(yesterday, -(MAX_CATCHUP_DAYS - 1));
  if (cursor < catchupFloor) cursor = catchupFloor;
  while (cursor <= yesterday) {
    // 🌴 豁免日：游标照常推进（结算水位前进），但当天不计入任何状态
    if (exemptSet.has(cursor)) {
      last = cursor;
      cursor = addDays(cursor, 1);
      continue;
    }
    const confirmed = confirmedByDay.get(cursor) ?? 0;
    const isFullDay = confirmed === 3;
    if (!isFullDay) {
      // 🧊 检查冰冻徽章：有则消耗保护一天连胜（与连胜更新在同一条 SQL 中保证一致性）
      let frozen = false;
      try {
        const fr = await db.execute({
          sql: "SELECT id, qty FROM inventory WHERE child_id = ? AND item_key = 'freeze' AND qty > 0",
          args: [childId],
        });
        // ⚠️ 只在连胜还在（streak > 0）时才消耗冰冻（第五轮审查 2026-11-12）：
        // 连胜早已归零的孩子每个漏卡日都会白吃一枚冰冻，且 streak 从 0 被
        // 无条件 +1——「保护连胜」的前提是连胜还存在。
        if (fr.rows.length > 0 && streak > 0) {
          const freezeId = Number(fr.rows[0].id);
          await db.execute({
            sql: 'UPDATE inventory SET qty = qty - 1 WHERE id = ?',
            args: [freezeId],
          });
          await db.execute({
            sql: 'DELETE FROM inventory WHERE id = ? AND qty <= 0',
            args: [freezeId],
          });
          frozen = true;
          streak = streak + 1;
          await db.execute({
            sql: 'UPDATE castle_state SET streak_days = ? WHERE child_id = ?',
            args: [streak, childId],
          });
          await logGrowthEvent(
            childId,
            'freeze',
            '🧊',
            '冰冻徽章保护',
            '🧊 冰冻徽章自动消耗，' + cursor + ' 漏卡但连胜未中断！'
          );
        }
      } catch {
        /* inventory 表可能不存在 */
      }
      if (!frozen) {
        consecutiveMissed++;
        await applyPenalty(childId, cursor, consecutiveMissed);
        streak = 0;
      }
    } else {
      consecutiveMissed = 0;
      streak = streak + 1;
    }
    await db.execute({
      sql: 'UPDATE castle_state SET streak_days = ? WHERE child_id = ?',
      args: [streak, childId],
    });
    last = cursor;
    cursor = addDays(cursor, 1);
  }
  if (last !== initialLast) {
    await db.execute({
      sql: 'UPDATE castle_state SET last_settled_day = ? WHERE child_id = ?',
      args: [last, childId],
    });
  }
}
