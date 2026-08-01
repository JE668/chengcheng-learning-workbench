import { NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const db = getDb();
  const taskId = Number(params.id);
  const task = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [taskId] });
  if (!task.rows.length) return NextResponse.json({ error: '任务不存在' }, { status: 404 });

  const points = Number(task.rows[0].points);
  // 防重放刷分：同一孩子同一任务只计分一次（原子 INSERT ... WHERE NOT EXISTS）。
  const res = await db.execute({
    sql: `INSERT INTO completions (task_id, child_id, points)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM completions WHERE task_id = ? AND child_id = ?)`,
    args: [taskId, user.id, points, taskId, user.id],
  });
  if (Number(res.rowsAffected ?? 0) === 0) {
    return NextResponse.json({ error: '已经领取过该任务积分' }, { status: 409 });
  }
  const balance = await getChildPoints(user.id);
  return NextResponse.json({ ok: true, points: balance, message: `完成「${task.rows[0].title}」，获得 ${points} 积分！` });
}
