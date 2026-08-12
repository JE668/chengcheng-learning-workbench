import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildId } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser, resolveChildId } from '@/lib/auth';

/** 列出当前孩子（家长=选中的孩子）的愿望清单 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  const childId = user.role === 'parent' ? await getChildId(user) : user.id;
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const rows = await db.execute({
    sql: 'SELECT * FROM wishes WHERE child_id = ? ORDER BY created_at DESC',
    args: [childId],
  });
  return NextResponse.json({ wishes: rows.rows });
}

/** 新增愿望（孩子或家长都可写入，家长写入对应选中的孩子） */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'child' && user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  let text = '';
  try {
    const body = await safeJson(req, {});
    text = typeof body.text === 'string' ? body.text : '';
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ error: '请输入愿望内容' }, { status: 400 });

  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO wishes (child_id, text, status) VALUES (?, ?, ?)',
    args: [childId, text.trim().slice(0, 100), 'pending'],
  });
  return NextResponse.json({ ok: true });
}

/** 家长审核：approved=同意兑换目标 / fulfilled=已经实现 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  let id = 0;
  let status = '';
  try {
    const body = await safeJson(req, {});
    id = Number(body.id);
    status = typeof body.status === 'string' ? body.status : '';
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!id || (status !== 'approved' && status !== 'fulfilled')) {
    return NextResponse.json({ error: '非法状态' }, { status: 400 });
  }
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const db = getDb();
  // 越权防护：只能操作自己孩子的愿望（按 child_id 收敛）
  const res = await db.execute({
    sql: 'UPDATE wishes SET status = ? WHERE id = ? AND child_id = ?',
    args: [status, id, childId],
  });
  if (Number(res.rowsAffected ?? 0) === 0) return NextResponse.json({ error: '无权限或记录不存在' }, { status: 403 });
  return NextResponse.json({ ok: true });
}
