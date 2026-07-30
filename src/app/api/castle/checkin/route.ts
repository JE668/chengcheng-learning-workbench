import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkin } from '@/lib/castle';
import type { Subject } from '@/lib/types';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { subject } = await req.json();
  if (!['语文', '数学', '英语'].includes(subject)) return NextResponse.json({ error: '科目无效' }, { status: 400 });
  const res = await checkin(user.id, subject as Subject);
  return NextResponse.json(res);
}
