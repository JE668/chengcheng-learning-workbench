import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { castSpray, applyTimeGlass } from '@/lib/castle';
import type { Subject } from '@/lib/types';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { itemKey, day, subject } = await safeJson(req, {});
  if (itemKey === 'spray') {
    const res = await castSpray(user.id);
    return NextResponse.json(res);
  }
  if (itemKey === 'timeglass') {
    if (!day) {
      return NextResponse.json({ ok: false, message: '请选择要补打卡的日期' }, { status: 400 });
    }
    const res = await applyTimeGlass(user.id, String(day));
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false, message: '暂不支持该道具' });
}
