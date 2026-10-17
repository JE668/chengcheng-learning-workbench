import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dateStr } from '@/lib/date';
import { isCronAuthorized } from '@/lib/cron-auth';
import { notifyChildSubscribers } from '@/lib/push-notifications';
import { getDueMistakes } from '@/lib/mistakes';

export const dynamic = 'force-dynamic';

/**
 * 晚间学习提醒（2026-10-17 推送补全）：
 * 检查每个孩子「今天三科打卡是否全勤」，没打满则推一条温和提醒。
 * 顺带：有今日到期错题的孩子，提醒里捎上一句「错题小卫士」。
 *
 * 部署：NAS crontab 晚 19:00 调用一次（与 cron/settle 的每日结算错开）：
 *   curl -X POST -H "Authorization: $CRON_SECRET" http://127.0.0.1:<port>/api/cron/remind
 *
 * 文案刻意温柔——目标是「把孩子拉回来」，不是「让孩子害怕」。
 * 提醒只发给该孩子名下的订阅（家长在该孩子视角开过推送就能收到，
 * 与 notifyChildSubscribers 的既有语义一致）。
 */
export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }
  const db = getDb();
  const today = dateStr();

  const children = await db.execute({
    sql: "SELECT id, display_name FROM users WHERE role = 'child'",
    args: [],
  });

  let reminded = 0;
  let allDone = 0;
  for (const c of children.rows) {
    const childId = Number(c.id);
    const name = String(c.display_name ?? '');
    const checkins = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
      args: [childId, today],
    });
    const confirmed = Number(checkins.rows[0]?.n ?? 0);
    if (confirmed >= 3) {
      allDone++;
      continue; // 已全勤，不打扰
    }

    // 错题提醒：今日到期未解决的错题数
    let dueMistakes = 0;
    try {
      const due = await getDueMistakes(childId, 5);
      dueMistakes = due.length;
    } catch {
      /* mistakes 表可能不存在（全新库未跑迁移），提醒主体不受影响 */
    }

    const subject = 3 - confirmed;
    const mistakeLine = dueMistakes > 0 ? `还有 ${dueMistakes} 道错题小卫士等你复习哦～` : '';
    const { success } = await notifyChildSubscribers(childId, {
      title: '🌙 萌可们在等你',
      body:
        confirmed === 0
          ? `${name}，今天的三科冒险还没开始呢！${mistakeLine}`.trim()
          : `${name}，还差 ${subject} 科没打卡，萌可们想你了！${mistakeLine}`.trim(),
      data: { type: 'evening-remind', childId, day: today },
    });
    if (success > 0) reminded++;
  }

  return NextResponse.json({ ok: true, children: children.rows.length, reminded, allDone });
}
