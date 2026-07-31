import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { getCurrentUser, resolveChildId } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  let rows;
  if (user.role === 'parent') {
    rows = await db.execute({
      sql: `SELECT r.*, u.display_name as child_name FROM redemptions r JOIN users u ON r.child_id = u.id ORDER BY r.created_at DESC`,
      args: [],
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
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const { id, status } = await req.json();
  const db = getDb();
  // 越权防护：只能审批自己孩子的兑换申请（按 child_id 收敛，而非任意 id）
  const res = await db.execute({
    sql: 'UPDATE redemptions SET status = ? WHERE id = ? AND child_id = ?',
    args: [status, Number(id), childId],
  });
  if (Number(res.rowsAffected ?? 0) === 0) return NextResponse.json({ error: '无权限或记录不存在' }, { status: 403 });
  return NextResponse.json({ ok: true });
}
