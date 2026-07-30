import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  const subject = req.nextUrl.searchParams.get('subject');
  if (user.role === 'child') {
    let sql = 'SELECT * FROM tasks';
    const args: any[] = [];
    if (subject) { sql += ' WHERE subject = ?'; args.push(subject); }
    sql += ' ORDER BY created_at DESC';
    const tasksRes = await db.execute({ sql, args });
    const compRes = await db.execute({ sql: 'SELECT task_id FROM completions WHERE child_id = ?', args: [user.id] });
    const done = new Set(compRes.rows.map((r) => r.task_id));
    const tasks = tasksRes.rows.map((r) => ({
      id: Number(r.id), title: String(r.title), subject: String(r.subject),
      description: String(r.description || ''), points: Number(r.points), createdBy: Number(r.created_by),
      createdAt: String(r.created_at), completed: done.has(r.id),
    }));
    return NextResponse.json({ tasks });
  }
  const all = await db.execute({ sql: 'SELECT * FROM tasks ORDER BY created_at DESC', args: [] });
  return NextResponse.json({ tasks: all.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { title, subject, description, points } = await req.json();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO tasks (title, subject, description, points, created_by) VALUES (?, ?, ?, ?, ?)',
    args: [title, subject, description || '', Number(points) || 5, user.id],
  });
  return NextResponse.json({ ok: true });
}
