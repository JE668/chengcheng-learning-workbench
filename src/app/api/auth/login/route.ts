import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import {
  getClientIp,
  rateLimit,
  loginLockout,
  recordLoginFailure,
  clearLoginFailure,
} from '@/lib/rate-limit';
import { ensureDbReady } from '@/lib/schema-init';
import bcrypt from 'bcryptjs';

/**
 * 供「用户不存在」分支使用的假哈希：模块加载时生成一次，保证是**合法**的 bcrypt 串，
 * 从而让该分支与「密码错误」分支耗时相当。
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('ccwb-login-timing-dummy', 10);

// 登录限流配置（可通过环境变量覆盖）
const LOGIN_LIMIT = {
  windowSeconds: Number(process.env.LOGIN_RATE_LIMIT_WINDOW) || 300,
  maxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
}; // 每 IP 5 分钟 10 次

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`login:${ip}`, LOGIN_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `登录太频繁，请 ${limit.retryAfter} 秒后再试` },
      { status: 429 }
    );
  }

  let username: unknown;
  let password: unknown;
  try {
    const body = await req.json();
    username = body?.username;
    password = body?.password;
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
  }
  // 本路由不经过根布局，全新库冷启动时表可能还没建好 —— 先确保 schema 就绪。
  // 与根布局共用同一份记忆化（见 lib/schema-init.ts），不会重复建表。
  await ensureDbReady();

  const uname = username.trim();
  // 账号级防爆破：该用户名连续失败过多则临时锁定（挡住轮换 IP 定向试密）
  const lock = loginLockout(uname);
  if (!lock.ok) {
    return NextResponse.json(
      { error: `该账号已被临时锁定，请 ${lock.retryAfter} 秒后再试` },
      { status: 429 }
    );
  }
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [uname] });
  const row = res.rows[0];
  // 用户不存在时也要跑一次 bcrypt：原先的 `!row || ...` 会短路掉哈希计算，
  // 响应时间可区分「用户存在 / 不存在」→ 可被用来枚举用户名。
  const hash = row ? String(row.password_hash) : DUMMY_PASSWORD_HASH;
  const passwordOk = verifyPassword(password, hash);
  if (!row || !passwordOk) {
    recordLoginFailure(uname);
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }
  clearLoginFailure(uname);
  await setSessionCookie(Number(row.id));
  const redirect = row.role === 'parent' ? '/dashboard' : '/home';
  return NextResponse.json({ ok: true, redirect });
}
