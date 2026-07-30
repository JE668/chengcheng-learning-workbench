import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
  const row = res.rows[0];
  if (!row || !verifyPassword(password, String(row.password_hash))) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }
  await setSessionCookie(Number(row.id));
  const redirect = row.role === 'parent' ? '/dashboard' : '/home';
  return NextResponse.json({ ok: true, redirect });
}
