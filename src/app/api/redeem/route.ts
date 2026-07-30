import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  let rows;
  if (user.role === 'parent') {
    rows = await db.execute({
      sql: `SELECT r.*, u.display_name as child_name FROM redemptions r JOIN users u ON r.child_id = u.id ORDER BY r.created_at DESC`,
    });
  } else {
    rows = await db.execute({ sql: 'SELECT * FROM redemptions WHERE child_id = ? ORDER BY created_at DESC', args: [user.id] });
  }
  return NextResponse.json({ redemptions: rows.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { rewardName, cost } = await req.json();
  const db = getDb();
  const points = await getChildPoints(user.id);
  if (points < Number(cost)) return NextResponse.json({ error: '积分不够' }, { status: 400 });
  const parent = await db.execute({ sql: 'SELECT id FROM users WHERE role = ? LIMIT 1', args: ['parent'] });
  const parentId = parent.rows[0]?.id ? Number(parent.rows[0].id) : user.id;
  await db.execute({
    sql: 'INSERT INTO redemptions (child_id, reward_name, cost, created_by) VALUES (?, ?, ?, ?)',
    args: [user.id, rewardName, Number(cost), parentId],
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { id, status } = await req.json();
  const db = getDb();
  await db.execute({ sql: 'UPDATE redemptions SET status = ? WHERE id = ?', args: [status, Number(id)] });
  return NextResponse.json({ ok: true });
}
