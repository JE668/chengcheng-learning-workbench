import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getChildId } from '@/lib/db';
import { confirm } from '@/lib/castle';
import type { Subject } from '@/lib/types';
import { validateBackfillDay } from '@/lib/backfill-date';

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
  // 三条补卡路径（confirm / use-item / approve-timeglass）现在共用 backfill-date.ts 的
  // 同一套口径：格式 → 不能是今天之后 → 最多回溯 30 天。
  const dayCheck = validateBackfillDay(day, { allowToday: true });
  if (!dayCheck.ok) {
    return NextResponse.json({ error: dayCheck.reason }, { status: 400 });
  }

  const res = await confirm(childId, dayCheck.day!, subject as Subject);
  return NextResponse.json(res);
}
