import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getChildId } from '@/lib/db';
import { confirm } from '@/lib/castle';
import { dateStr, addDays } from '@/lib/date';
import type { Subject } from '@/lib/types';

/**
 * 家长确认某天打卡时允许回溯的最大天数。
 * 与 castle/use-item（时光沙漏补打卡）保持同一口径，避免两条补卡路径标准不一。
 */
const MAX_BACKFILL_DAYS = 30;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const { day, subject } = await safeJson(req, {});
  if (!['语文', '数学', '英语'].includes(subject))
    return NextResponse.json({ error: '科目无效' }, { status: 400 });

  // ⚠️ 必须校验日期。原实现是 `confirm(childId, String(day), ...)` —— 直接强转、
  // 零校验：缺省会变成字符串 "undefined"（靠 castle.ts 里的兜底侥幸挡住），
  // 但任意值（如 '2020-01-01'、'9999-01-01'）会一路写进 daily_checkins，
  // 让 computeStreak 算出虚假的超长连胜，孩子拿到远超实际学习的徽章/繁荣度/捕捉券。
  //
  // 这里与 castle/use-item 同一套口径：格式 → 不能是今天及以后 → 最多回溯 30 天。
  const dayStr = typeof day === 'string' ? day.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayStr)) {
    return NextResponse.json({ error: '日期格式不正确' }, { status: 400 });
  }
  const today = dateStr();
  if (dayStr > today) {
    // 未来日期没有「确认完成」的意义，且会污染连胜统计
    return NextResponse.json({ error: '不能确认今天之后的日期' }, { status: 400 });
  }
  if (dayStr < addDays(today, -MAX_BACKFILL_DAYS)) {
    return NextResponse.json(
      { error: `只能确认最近 ${MAX_BACKFILL_DAYS} 天内的日期` },
      { status: 400 }
    );
  }

  const res = await confirm(childId, dayStr, subject as Subject);
  return NextResponse.json(res);
}
