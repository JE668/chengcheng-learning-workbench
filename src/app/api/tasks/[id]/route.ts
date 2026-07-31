import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const id = Number(params.id);
  const { title, subject, description, points } = await req.json();
  const db = getDb();
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
  // 先清掉该任务的完成记录（外键无级联），再删任务本身
  await db.execute({ sql: 'DELETE FROM completions WHERE task_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
  return NextResponse.json({ ok: true });
}
