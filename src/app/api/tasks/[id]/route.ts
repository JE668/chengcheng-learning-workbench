import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const id = Number(params.id);
  const db = getDb();
  // 越权防护：只能改自己创建的任务
  const own = await db.execute({ sql: 'SELECT 1 FROM tasks WHERE id = ? AND created_by = ?', args: [id, user.id] });
  if (!own.rows.length) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { title, subject, description, points } = await safeJson(req, {});
  await db.execute({
    sql: 'UPDATE tasks SET title = ?, subject = ?, description = ?, points = ? WHERE id = ?',
    args: [title, subject, description || '', Number(points) || 5, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const id = Number(params.id);
  const db = getDb();
  // 越权防护：只能删自己创建的任务
  const own = await db.execute({ sql: 'SELECT 1 FROM tasks WHERE id = ? AND created_by = ?', args: [id, user.id] });
  if (!own.rows.length) return NextResponse.json({ error: '无权限' }, { status: 403 });
  // 先清掉该任务的完成记录（外键无级联），再删任务本身
  await db.execute({ sql: 'DELETE FROM completions WHERE task_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
  return NextResponse.json({ ok: true });
}
