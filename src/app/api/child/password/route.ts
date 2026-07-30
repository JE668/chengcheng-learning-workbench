import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { childUsername, newPassword } = await req.json();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?',
    args: [hashPassword(newPassword), childUsername, 'child'],
  });
  return NextResponse.json({ ok: true });
}
