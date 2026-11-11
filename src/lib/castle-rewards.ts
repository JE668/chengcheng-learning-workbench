/** 打卡确认与发奖：幂等插卡、阳光/积分/萌可和全勤奖励。 */

import { getDb, withWriteLock } from './db';
import { dateStr } from './date';
import { mokoChars, subjectMokoKey, SUN_PER_SUBJECT, PROSPERITY_BONUS } from './moko';
import { POINTS_PER_CHECKIN } from './economy';
import type { Subject } from './types';
import { ensureCastle, logGrowthEvent } from './castle-core';

async function awardSubjectMoko(childId: number, subject: Subject) {
  const key = subjectMokoKey[subject];
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status) VALUES (?, ?, ?, 'obtained', CURRENT_TIMESTAMP, 3, 'resident') ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3",
    args: [childId, key, subject],
  });
}

/**
 * confirm 的「发奖励主体」：必须在**已持有 withWriteLock 且已 BEGIN** 的上下文里调用。
 * （从原 confirm 原样抽出，无任何行为变化；抽出是为了让 applyTimeGlass 这类
 * 「外层已有自己的多步事务」的调用方能复用同一事务而不是嵌套死锁——
 * 2026-10-17 审查确认 restoreDay→confirm 链的锁不可重入。）
 *
 * 返回值与 confirm 对外语义一致；假定幂等插卡（daily_checkins 的
 * ON CONFLICT DO NOTHING）**已由调用方完成**且判定为「新确认」。
 */
export async function confirmRewardsTx(
  db: ReturnType<typeof getDb>,
  childId: number,
  day: string,
  today: string,
  subject: Subject
): Promise<{ ok: boolean; message: string }> {
  // 只有新确认才发奖励，避免重复发积分/阳光/萌可/捕捉券
  await db.execute({
    sql: 'INSERT INTO completions (child_id, points, source) VALUES (?, ?, ?)',
    args: [childId, POINTS_PER_CHECKIN, 'checkin:' + subject],
  });

  await db.execute({
    sql: 'UPDATE castle_state SET sunlight = sunlight + ? WHERE child_id = ?',
    args: [SUN_PER_SUBJECT, childId],
  });
  await awardSubjectMoko(childId, subject);
  const mokoName = mokoChars[subjectMokoKey[subject]]?.name ?? '萌可';
  const subjectEmoji: Record<Subject, string> = { 语文: '❤️', 数学: '💪', 英语: '🎵' };
  await logGrowthEvent(
    childId,
    'checkin',
    subjectEmoji[subject] ?? '🌟',
    '「' + subject + '」打卡成功',
    '阳光能量 +' + SUN_PER_SUBJECT + '，召唤 ' + mokoName + ' 入驻城堡'
  );

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
      await db.execute({
        sql: 'UPDATE castle_state SET prosperity = prosperity + ? WHERE child_id = ?',
        args: [PROSPERITY_BONUS, childId],
      });
      await logGrowthEvent(
        childId,
        'prosperity',
        '🏰',
        '三科全勤！城堡升级',
        '繁荣度 +' + PROSPERITY_BONUS + '，萌可们更开心啦'
      );
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
      await logGrowthEvent(
        childId,
        'rescue',
        '🧴',
        '补作业完成，乐美来帮忙！',
        '捣蛋萌可溜进城堡捣乱，乐美送来魔法喷雾，快帮她把捣蛋萌可捉回去！'
      );
      return {
        ok: true,
        message: '补作业完成！乐美送来 1 瓶魔法喷雾，去背包帮她把捣蛋萌可捉回去吧～',
      };
    }
  }
  return {
    ok: true,
    message: '确认「' + subject + '」完成，获得 ' + SUN_PER_SUBJECT + ' 阳光能量 + 1 只萌可！',
  };
}

export async function confirm(childId: number, day: string, subject: Subject) {
  const db = getDb();
  await ensureCastle(childId);
  const today = dateStr();
  if (!day || day === 'undefined') day = today;

  // 新确认：奖励发放整体串行化（本地 sqlite3 是单连接同步驱动，
  // 手写 BEGIN/COMMIT 之间若被并发请求的 await 穿插会串事务，用互斥锁兜住）。
  // ⚠️ 幂等插卡必须在锁内事务里做：原先放在锁外 autocommit，若进程在
  // 「插卡已落库、奖励未发」之间崩溃，重试会因该行已存在被判「已确认」，
  // 奖励永久丢失。移进事务后用 rowsAffected 判定，插卡与发奖同生共死。
  return withWriteLock(async () => {
    await db.execute('BEGIN IMMEDIATE');
    try {
      const insertResult = await db.execute({
        sql: "INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT(child_id, day, subject) DO NOTHING",
        args: [childId, day, subject],
      });
      const isNewConfirm = Number(insertResult.rowsAffected ?? 0) > 0;
      if (!isNewConfirm) {
        await db.execute('COMMIT');
        return { ok: false, message: '该科今天已确认' };
      }
      const result = await confirmRewardsTx(db, childId, day, today, subject);
      await db.execute('COMMIT');
      return result;
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  });
}
