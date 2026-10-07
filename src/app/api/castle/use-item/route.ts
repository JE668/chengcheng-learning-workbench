import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { castSpray, applyTimeGlass } from '@/lib/castle';
import type { Subject } from '@/lib/types';
import { validateBackfillDay } from '@/lib/backfill-date';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { itemKey, day, subject } = await safeJson(req, {});
  if (itemKey === 'spray') {
    const res = await castSpray(user.id);
    return NextResponse.json(res);
  }
  if (itemKey === 'timeglass') {
    // ⚠️ 必须校验日期：applyTimeGlass 会按这个日期重写 streak_days / last_settled_day，
    // 不校验的话孩子可以补到任意（含未来）日期，从而伪造连击。
    // 三条补卡路径共用 backfill-date.ts 的同一套校验；这里 allowToday=false ——
    // 道具只用来补「已经过去」的日子，当天直接打卡即可，不需要道具。
    const dayCheck = validateBackfillDay(day, { allowToday: false });
    if (!dayCheck.ok) {
      return NextResponse.json({ ok: false, message: dayCheck.reason }, { status: 400 });
    }
    const res = await applyTimeGlass(user.id, dayCheck.day!);
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false, message: '暂不支持该道具' });
}
