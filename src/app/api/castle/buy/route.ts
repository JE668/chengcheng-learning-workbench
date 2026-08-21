import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { buy } from '@/lib/castle';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const limit = rateLimit(`buy:${user.id}`, { windowSeconds: 10, maxRequests: 5 });
  if (!limit.ok) return NextResponse.json({ ok: false, message: '操作太频繁，请稍后再试' }, { status: 429 });
  const { itemKey } = await safeJson(req, {});
  const res = await buy(user.id, String(itemKey));
  return NextResponse.json(res);
}