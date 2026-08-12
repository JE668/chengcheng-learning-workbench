import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { castSpray } from '@/lib/castle';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { itemKey } = await safeJson(req, {});
  if (itemKey === 'spray') {
    const res = await castSpray(user.id);
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false, message: '暂不支持该道具' });
}
