import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';
import { confirm } from '@/lib/castle';
import type { Subject } from '@/lib/types';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await getChildId();
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const { day, subject } = await req.json();
  if (!['语文', '数学', '英语'].includes(subject)) return NextResponse.json({ error: '科目无效' }, { status: 400 });
  const res = await confirm(childId, String(day), subject as Subject);
  return NextResponse.json(res);
}
