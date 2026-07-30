import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buy } from '@/lib/castle';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { itemKey } = await req.json();
  const res = await buy(user.id, String(itemKey));
  return NextResponse.json(res);
}
