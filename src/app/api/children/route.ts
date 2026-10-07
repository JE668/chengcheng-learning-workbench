import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildrenOfParent, getSelectedChildId } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import {
  parseUsername,
  parseDisplayName,
  parsePassword,
  MIN_CHILD_PASSWORD,
  MAX_CHILD_PASSWORD,
} from '@/lib/children-validation';

export const dynamic = 'force-dynamic';

// 列出当前家长名下的孩子，并标出选中项
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const children = await getChildrenOfParent(user.id);
  const selectedId = await getSelectedChildId(user.id);
  return NextResponse.json({
    children: children.map((c) => ({
      id: c.id,
      name: c.displayName,
      username: c.username,
      selected: c.id === selectedId,
    })),
    selectedId,
  });
}

// 新增一个孩子（归属当前家长）
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });

  // 创建账号是高价值操作（可批量建弱口令账号供后续撞库），
  // 必须限流。对比 login（IP+账号双重）、parent/reset（每家长 5 次/分），
  // 本路由原先**完全没有限流**，是鉴权路由里唯一的缺口。
  const limit = rateLimit(`child-create:${user.id}`, { windowSeconds: 300, maxRequests: 5 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `创建过于频繁，请 ${limit.retryAfter} 秒后再试` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  // 入参校验口径见 lib/children-validation.ts（用户名白名单 / 密码强度 / 昵称长度）
  const username = parseUsername(body.username);
  const displayName = parseDisplayName(body.displayName);
  const password = parsePassword(body.password);
  if (!username) {
    return NextResponse.json(
      { error: '用户名只能是字母、数字、下划线或中文（1~20 位）' },
      { status: 400 }
    );
  }
  if (!displayName) {
    return NextResponse.json({ error: '请填写有效的昵称（不超过 20 字）' }, { status: 400 });
  }
  if (password === null) {
    return NextResponse.json(
      { error: `密码需为 ${MIN_CHILD_PASSWORD}-${MAX_CHILD_PASSWORD} 位` },
      { status: 400 }
    );
  }

  const db = getDb();
  const MAX_CHILDREN = 5;
  const cur = await db.execute({
    sql: 'SELECT COUNT(*) n FROM users WHERE parent_id = ?',
    args: [user.id],
  });
  if (Number(cur.rows[0]?.n ?? 0) >= MAX_CHILDREN) {
    return NextResponse.json({ error: `最多添加 ${MAX_CHILDREN} 个孩子` }, { status: 400 });
  }
  const exist = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: [username],
  });
  if (exist.rows.length) return NextResponse.json({ error: '用户名已存在' }, { status: 409 });

  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, role, display_name, parent_id) VALUES (?, ?, ?, ?, ?)',
    args: [username, bcrypt.hashSync(password, 10), 'child', displayName, user.id],
  });
  const children = await getChildrenOfParent(user.id);
  return NextResponse.json({
    ok: true,
    children: children.map((c) => ({ id: c.id, name: c.displayName, username: c.username })),
  });
}
