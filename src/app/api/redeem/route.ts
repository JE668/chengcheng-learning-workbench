import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints, getChildId } from '@/lib/db';
import { getCurrentUser, resolveChildId } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  let rows;
  if (user.role === 'parent') {
    const childId = await getChildId(user);
    rows = await db.execute({
      sql: `SELECT r.*, u.display_name as child_name FROM redemptions r JOIN users u ON r.child_id = u.id WHERE r.child_id = ? ORDER BY r.created_at DESC`,
      args: [childId ?? -1],
    });
  } else {
    rows = await db.execute({ sql: 'SELECT * FROM redemptions WHERE child_id = ? ORDER BY created_at DESC', args: [user.id] });
  }
  return NextResponse.json({ redemptions: rows.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'child' && user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { rewardName, cost } = await req.json();
  const numCost = Number(cost);
  if (!rewardName || typeof rewardName !== 'string' || !rewardName.trim()) {
    return NextResponse.json({ error: '请输入奖励名称' }, { status: 400 });
  }
  if (!Number.isInteger(numCost) || numCost <= 0) {
    return NextResponse.json({ error: '消耗积分必须为正整数' }, { status: 400 });
  }

  const db = getDb();
  // 孩子本人 → 自己；家长 → 选中的孩子（多娃隔离，避免直接信任客户端 childId）。
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const points = await getChildPoints(childId);
  if (points < numCost) return NextResponse.json({ error: '积分不够' }, { status: 400 });

  await db.execute({
    sql: 'INSERT INTO redemptions (child_id, reward_name, cost, created_by) VALUES (?, ?, ?, ?)',
    args: [childId, rewardName.trim(), numCost, user.id],
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
