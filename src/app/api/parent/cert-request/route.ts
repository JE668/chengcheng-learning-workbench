import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';

// 家长端：审批奖状申请（通过/拒绝）
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const childId = (await getChildId(user)) ?? 0;
  const { id, status } = await req.json();
  if (!id || (status !== 'approved' && status !== 'rejected')) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  const db = getDb();
  // 仅允许操作当前选中孩子的申请
  const res = await db.execute({
    sql: `UPDATE cert_requests SET status = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ? AND child_id = ?`,
    args: [status, id, childId],
  });
  if (Number(res.rowsAffected ?? 0) === 0) {
    return NextResponse.json({ error: '申请不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, status });
}
