import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getCertRequestStatus } from '@/lib/cert';

// 孩子端：查询当前奖状申请状态
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const status = await getCertRequestStatus(user.id);
  return NextResponse.json({ status });
}

// 孩子端：申请颁发奖状（只能申请，由家长审批；不能自己打印）
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const db = getDb();
  // 已有待审批申请则不允许重复提交
  const existing = await getCertRequestStatus(user.id);
  if (existing === 'pending') {
    return NextResponse.json({ ok: false, status: 'pending', error: '已经提交过申请啦，等爸爸妈妈审批就好～' });
  }
  await db.execute({
    sql: `INSERT INTO cert_requests (child_id, status) VALUES (?, 'pending')`,
    args: [user.id],
  });
  return NextResponse.json({ ok: true, status: 'pending' });
}
