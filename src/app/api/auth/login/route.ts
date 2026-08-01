import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const LOGIN_LIMIT = { windowSeconds: 300, maxRequests: 10 }; // 每 IP 5 分钟 10 次

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`login:${ip}`, LOGIN_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `登录太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

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
