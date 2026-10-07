import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import {
  parseTaskPoints,
  parseTaskTitle,
  MIN_TASK_POINTS,
  MAX_TASK_POINTS,
} from '@/lib/tasks-validation';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  const subject = req.nextUrl.searchParams.get('subject');
  if (user.role === 'child') {
    let sql = 'SELECT id, title, subject, description, points, created_by, created_at FROM tasks';
    const args: any[] = [];
    if (subject) {
      sql += ' WHERE subject = ?';
      args.push(subject);
    }
    sql += ' ORDER BY created_at DESC';
    const tasksRes = await db.execute({ sql, args });
    const compRes = await db.execute({
      sql: 'SELECT task_id FROM completions WHERE child_id = ?',
      args: [user.id],
    });
    const done = new Set(compRes.rows.map((r) => r.task_id));
    const tasks = tasksRes.rows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      subject: String(r.subject),
      description: String(r.description || ''),
      points: Number(r.points),
      createdBy: Number(r.created_by),
      createdAt: String(r.created_at),
      completed: done.has(r.id),
    }));
    return NextResponse.json({ tasks });
  }
  const all = await db.execute({
    sql: 'SELECT id, title, subject, description, points, created_by, created_at FROM tasks ORDER BY created_at DESC',
    args: [],
  });
  return NextResponse.json({ tasks: all.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { title, subject, description, points } = await safeJson(req, {});
  // 未传积分用默认值；传了但非法则拒绝（校验口径见 lib/tasks-validation.ts）
  const parsedPoints = parseTaskPoints(points);
  if (parsedPoints === null) {
    return NextResponse.json(
      { error: `积分必须是 ${MIN_TASK_POINTS}-${MAX_TASK_POINTS} 的整数` },
      { status: 400 }
    );
  }
  const parsedTitle = parseTaskTitle(title);
  if (parsedTitle === null) {
    return NextResponse.json({ error: '请输入任务名称' }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO tasks (title, subject, description, points, created_by) VALUES (?, ?, ?, ?, ?)',
    args: [parsedTitle, subject, description || '', parsedPoints, user.id],
  });
  return NextResponse.json({ ok: true });
}
