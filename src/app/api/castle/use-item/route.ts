import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { castSpray, applyTimeGlass } from '@/lib/castle';
import { dateStr, addDays } from '@/lib/date';
import type { Subject } from '@/lib/types';

/** 允许补打卡的最早天数（往前）。超出即拒绝，避免用异常日期重写连击锚点。 */
const MAX_BACKFILL_DAYS = 30;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { itemKey, day, subject } = await safeJson(req, {});
  if (itemKey === 'spray') {
    const res = await castSpray(user.id);
    return NextResponse.json(res);
  }
  if (itemKey === 'timeglass') {
    // ⚠️ 必须校验日期：applyTimeGlass 会按这个日期重写 streak_days / last_settled_day，
    // 不校验的话孩子可以补到任意（含未来）日期，从而伪造连击。
    // 这里与 castle/request-timeglass 的口径一致，并额外限制范围。
    const dayStr = typeof day === 'string' ? day.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayStr)) {
      return NextResponse.json({ ok: false, message: '请选择要补打卡的日期' }, { status: 400 });
    }
    const today = dateStr();
    if (dayStr >= today) {
      // 只能补「已经过去」的日子；未来日期没有补打卡的意义
      return NextResponse.json({ ok: false, message: '只能补今天之前的日期' }, { status: 400 });
    }
    if (dayStr < addDays(today, -MAX_BACKFILL_DAYS)) {
      return NextResponse.json(
        { ok: false, message: '只能补最近 ' + MAX_BACKFILL_DAYS + ' 天内的日期' },
        { status: 400 }
      );
    }
    const res = await applyTimeGlass(user.id, dayStr);
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false, message: '暂不支持该道具' });
}
