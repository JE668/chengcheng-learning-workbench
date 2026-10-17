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

/**
 * 任务指派（多娃归属，迁移 v19）：
 * - assigned_to = NULL → 全家任务（存量语义，谁都能做）
 * - assigned_to = 孩子 id → 只有该孩子可见/可做
 * 家长 GET 看全部（带 assignedTo 字段）；孩子 GET 只看「NULL 或自己」。
 */
const TASK_COLS = 'id, title, subject, description, points, created_by, assigned_to, created_at';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  const subject = req.nextUrl.searchParams.get('subject');
  if (user.role === 'child') {
    // 归属过滤：全家任务（assigned_to IS NULL）+ 指派给自己的。
    // assigned_to 列由迁移 v19 保证存在；旧库未跑迁移时 ensureSchema 会补。
    let sql = `SELECT ${TASK_COLS} FROM tasks WHERE (assigned_to IS NULL OR assigned_to = ?)`;
    const args: (string | number)[] = [user.id];
    if (subject) {
      sql += ' AND subject = ?';
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
      assignedTo: r.assigned_to == null ? null : Number(r.assigned_to),
      createdAt: String(r.created_at),
      completed: done.has(r.id),
    }));
    return NextResponse.json({ tasks });
  }
  const all = await db.execute({
    sql: `SELECT ${TASK_COLS} FROM tasks ORDER BY created_at DESC`,
    args: [],
  });
  const tasks = all.rows.map((r) => ({
    ...r,
    assigned_to: r.assigned_to == null ? null : Number(r.assigned_to),
  }));
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { title, subject, description, points, assignedTo } = await safeJson(req, {});
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
  // 指派校验：assignedTo 必须是**自己名下的孩子**，不接受任意 id（防越权指派/IDOR）。
  let assigned: number | null = null;
  if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
    const cid = Number(assignedTo);
    if (!Number.isInteger(cid) || cid <= 0) {
      return NextResponse.json({ error: '指派对象无效' }, { status: 400 });
    }
    const own = await db.execute({
      sql: 'SELECT 1 FROM users WHERE id = ? AND parent_id = ? AND role = ?',
      args: [cid, user.id, 'child'],
    });
    if (!own.rows.length) {
      return NextResponse.json({ error: '只能指派给自己的小孩' }, { status: 400 });
    }
    assigned = cid;
  }
  await db.execute({
    sql: 'INSERT INTO tasks (title, subject, description, points, created_by, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
    args: [parsedTitle, subject, description || '', parsedPoints, user.id, assigned],
  });
  return NextResponse.json({ ok: true });
}
