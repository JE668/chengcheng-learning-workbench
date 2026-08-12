import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getChildId } from '@/lib/db';
import { setSkin } from '@/lib/castle';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = user.role === 'child' ? user.id : await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const { skin } = await safeJson(req, {});
  if (!skin) return NextResponse.json({ error: '缺少 skin' }, { status: 400 });
  const res = await setSkin(childId, String(skin));
  return NextResponse.json(res);
}
