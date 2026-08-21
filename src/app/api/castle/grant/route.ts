import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';
import { grantResource } from '@/lib/castle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 家长端：直接给孩子发放资源（阳光/星星币/捕捉券） */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const { resource, amount } = await req.json();
  if (!['sunlight', 'starCoins', 'tickets'].includes(resource)) {
    return NextResponse.json({ error: '未知资源类型' }, { status: 400 });
  }
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 100) {
    return NextResponse.json({ error: '数量必须是 1-100 的数字' }, { status: 400 });
  }
  const res = await grantResource(childId, resource, numAmount);
  return NextResponse.json(res);
}