import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dateStr } from '@/lib/date';
import { isCronAuthorized } from '@/lib/cron-auth';
import { notifyChildSubscribers } from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';

/**
 * 📊 家长周报（2026-10-19 ⑥号升级）
 *
 * 每周日晚推送每个孩子的「本周学习周报」：
 *   - 三科打卡天数（全勤 7 天 = 满分）、学习分钟数、错题清零数
 *   - 本周新解锁的萌可数量（moko_owned 本周新增）
 *   - 下周建议（基于数据的三条固定策略之一）
 *
 * 部署：NAS crontab 周日 20:00（与每日 remind 的 19:00 错开）：
 *   curl -X POST -H "Authorization: $CRON_SECRET" http://127.0.0.1:<port>/api/cron/weekly-report
 *
 * 幂等：同一自然日重复调用只推一次（weekly_report_sent 表按 day 记录）。
 * 推送通道复用 notifyChildSubscribers（家长在孩子视角开过推送即可收到）。
 */
export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }
  const db = getDb();
  const today = dateStr();

  // 周报只在周日发（crontab 排周日，但手动调用也尊重语义）
  const dayOfWeek = new Date(today + 'T12:00:00').getDay();
  if (dayOfWeek !== 0) {
    return NextResponse.json({ ok: true, skipped: '今天不是周日，不发周报' });
  }

  // 幂等闸：今天已发过就跳过
  try {
    const sent = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM weekly_report_sent WHERE day = ?',
      args: [today],
    });
    if (Number(sent.rows[0]?.n ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: '今日周报已发过（幂等）' });
    }
  } catch {
    /* 表不存在（旧库未迁移）→ 建表后继续；本次仍会正常推送 */
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS weekly_report_sent (
        day TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: [],
    });
  }

  const weekAgo = new Date(new Date(today + 'T12:00:00').getTime() - 6 * 86400000)
    .toISOString()
    .slice(0, 10);

  const children = await db.execute({
    sql: "SELECT id, display_name FROM users WHERE role = 'child'",
    args: [],
  });

  let pushed = 0;
  const details: string[] = [];

  for (const c of children.rows) {
    const childId = Number(c.id);
    const name = String(c.display_name ?? '孩子');

    // ① 三科全勤天数（每天 3 科都 confirmed 才算一天全勤）
    const fullDays = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM (
              SELECT day FROM daily_checkins
              WHERE child_id = ? AND day BETWEEN ? AND ? AND status = 'confirmed'
              GROUP BY day HAVING COUNT(*) >= 3
            )`,
      args: [childId, weekAgo, today],
    });
    const perfectDays = Number(fullDays.rows[0]?.n ?? 0);

    // ② 学习分钟数（study_sessions 心跳分钟合计）
    const mins = await db.execute({
      sql: 'SELECT COALESCE(SUM(minutes), 0) AS m FROM study_sessions WHERE child_id = ? AND day BETWEEN ? AND ?',
      args: [childId, weekAgo, today],
    });
    const minutes = Number(mins.rows[0]?.m ?? 0);

    // ③ 本周新解锁萌可
    const newMokos = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM moko_owned WHERE child_id = ? AND created_at >= date('now', '-7 days')",
      args: [childId],
    });
    const mokos = Number(newMokos.rows[0]?.n ?? 0);

    // ④ 错题清零
    const resolved = await db.execute({
      // mistakes 表无 updated_at：resolved=1 后 next_review 停在最后复习日，
      // 用它近似「本周清掉的错题」（freshness 足够周报粒度）
      sql: 'SELECT COUNT(*) AS n FROM mistakes WHERE child_id = ? AND resolved = 1 AND next_review >= ?',
      args: [childId, weekAgo],
    });
    const fixedMistakes = Number(resolved.rows[0]?.n ?? 0);

    // 下周建议（按最短板给一条，不做硬评判）
    let tip: string;
    if (perfectDays < 4) tip = '下周试试每天固定「学习时间」，打卡习惯最养人～';
    else if (fixedMistakes === 0) tip = '错题本里的小卫士等着复习，每天清 3 道就够～';
    else if (minutes < 60) tip = '本周学习时长偏少，下周每天 10 分钟就很棒～';
    else tip = '节奏很好！下周保持住，可以挑战更难的模块～';

    const body =
      `📊 ${name} 的本周周报：全勤 ${perfectDays}/7 天，学习 ${minutes} 分钟，` +
      `新萌可 +${mokos}，错题清零 ${fixedMistakes} 道。${tip}`;

    const { success } = await notifyChildSubscribers(childId, {
      title: `📊 ${name} 的一周学习报告`,
      body,
      icon: '/icons/icon-192.png',
    });
    pushed += success;
    details.push(`${name}: 全勤${perfectDays}/7 · ${minutes}min · +${mokos}萌可 · 推送${success ? '✓' : '✗'}`);
  }

  // 幂等标记（无论有没有订阅者成功——"发过"以调用为准，无订阅者重试无意义）
  await db.execute({
    sql: 'INSERT OR IGNORE INTO weekly_report_sent (day) VALUES (?)',
    args: [today],
  });

  return NextResponse.json({
    ok: true,
    pushed,
    children: children.rows.length,
    details,
  });
}
