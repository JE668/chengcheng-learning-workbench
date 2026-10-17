import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import {
  parseTaskPoints,
  parseTaskTitle,
  MIN_TASK_POINTS,
  MAX_TASK_POINTS,
} from '@/lib/tasks-validation';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Next 15：路由 params 是 Promise，必须先 await
  const { id: idStr } = await params;
  const id = Number(idStr);
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const db = getDb();
  // 越权防护：只能改自己创建的任务
  const own = await db.execute({
    sql: 'SELECT 1 FROM tasks WHERE id = ? AND created_by = ?',
    args: [id, user.id],
  });
  if (!own.rows.length) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { title, subject, description, points, assignedTo } = await safeJson(req, {});
  // 与 POST 共用同一套校验（lib/tasks-validation.ts），杜绝两处分叉
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
  // 指派校验：与 POST 同口径——只能指派给自己名下的孩子（防 IDOR）。
  let assigned: number | null = null;
  if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
    const cid = Number(assignedTo);
    if (!Number.isInteger(cid) || cid <= 0) {
      return NextResponse.json({ error: '指派对象无效' }, { status: 400 });
    }
    const ownChild = await db.execute({
      sql: 'SELECT 1 FROM users WHERE id = ? AND parent_id = ? AND role = ?',
      args: [cid, user.id, 'child'],
    });
    if (!ownChild.rows.length) {
      return NextResponse.json({ error: '只能指派给自己的小孩' }, { status: 400 });
    }
    assigned = cid;
  }
  await db.execute({
    sql: 'UPDATE tasks SET title = ?, subject = ?, description = ?, points = ?, assigned_to = ? WHERE id = ?',
    args: [parsedTitle, subject, description || '', parsedPoints, assigned, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const db = getDb();
  // 越权防护：只能删自己创建的任务
  const own = await db.execute({
    sql: 'SELECT 1 FROM tasks WHERE id = ? AND created_by = ?',
    args: [id, user.id],
  });
  if (!own.rows.length) return NextResponse.json({ error: '无权限' }, { status: 403 });
  // 先清掉该任务的完成记录（外键无级联），再删任务本身
  await db.execute({ sql: 'DELETE FROM completions WHERE task_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
  return NextResponse.json({ ok: true });
}
