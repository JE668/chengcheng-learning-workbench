import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { harvest } from '@/lib/castle';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const res = await harvest(user.id);
  return NextResponse.json(res);
}
