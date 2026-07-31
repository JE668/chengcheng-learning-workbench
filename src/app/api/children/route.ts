import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildrenOfParent, getSelectedChildId } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// 列出当前家长名下的孩子，并标出选中项
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const children = await getChildrenOfParent(user.id);
  const selectedId = await getSelectedChildId(user.id);
  return NextResponse.json({
    children: children.map((c) => ({ id: c.id, name: c.displayName, username: c.username, selected: c.id === selectedId })),
    selectedId,
  });
}

// 新增一个孩子（归属当前家长）
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const displayName = String(body.displayName || '').trim();
  const password = String(body.password || '');
  if (!username || !displayName || password.length < 4) {
    return NextResponse.json({ error: '请填写用户名、昵称，密码至少 4 位' }, { status: 400 });
  }
  const db = getDb();
  const MAX_CHILDREN = 5;
  const cur = await db.execute({ sql: 'SELECT COUNT(*) n FROM users WHERE parent_id = ?', args: [user.id] });
  if (Number(cur.rows[0]?.n ?? 0) >= MAX_CHILDREN) {
    return NextResponse.json({ error: `最多添加 ${MAX_CHILDREN} 个孩子` }, { status: 400 });
  }
  const exist = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] });
  if (exist.rows.length) return NextResponse.json({ error: '用户名已存在' }, { status: 409 });

  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, role, display_name, parent_id) VALUES (?, ?, ?, ?, ?)',
    args: [username, bcrypt.hashSync(password, 10), 'child', displayName, user.id],
  });
  const children = await getChildrenOfParent(user.id);
  return NextResponse.json({ ok: true, children: children.map((c) => ({ id: c.id, name: c.displayName, username: c.username })) });
}
