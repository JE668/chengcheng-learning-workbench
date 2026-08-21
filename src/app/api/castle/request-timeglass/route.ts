import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db';

/**
 * 孩子发起时光沙漏申请（写入 wishes 表，供家长审批）。
 * 复用 wishes 表，text 以 ⏳ 前缀标记为沙漏申请。
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') {
    return NextResponse.json({ error: '只有孩子才能申请时光沙漏' }, { status: 403 });
  }
  const db = getDb();

  // 检查是否已有待审批的沙漏申请，避免重复提交
  const existing = await db.execute({
    sql: "SELECT id FROM wishes WHERE child_id = ? AND text = ? AND status = 'pending'",
    args: [user.id, '⏳ 申请时光沙漏'],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json({ ok: true, message: '已经申请过了，等爸爸妈妈审批吧～' });
  }

  await db.execute({
    sql: 'INSERT INTO wishes (child_id, text, status) VALUES (?, ?, ?)',
    args: [user.id, '⏳ 申请时光沙漏', 'pending'],
  });
  return NextResponse.json({ ok: true, message: '已向爸爸妈妈申请时光沙漏，等他们审批吧 ⏳' });
}

/**
 * 家长查看待审批的时光沙漏申请。
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const db = getDb();
  const rows = await db.execute({
    sql: "SELECT id, child_id, created_at FROM wishes WHERE child_id = ? AND text = ? AND status = 'pending' ORDER BY created_at DESC",
    args: [childId, '⏳ 申请时光沙漏'],
  });
  return NextResponse.json({
    requests: rows.rows.map((r) => ({
      id: Number(r.id),
      childId: Number(r.child_id),
      createdAt: String(r.created_at ?? ''),
    })),
  });
}
