import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildPoints } from '@/lib/db';
import { MokoHelper } from '@/components/MokoHelper';
import ChildTaskList from '@/components/study/ChildTaskList';
import type { Task, Subject } from '@/lib/types';

export default async function MyTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;
  const db = getDb();
  // 多娃归属过滤（与 /api/tasks GET 孩子分支同一口径）：
  // 只看「全家任务（assigned_to IS NULL）+ 指派给自己的」。
  const tasksRes = await db.execute({
    sql: 'SELECT * FROM tasks WHERE assigned_to IS NULL OR assigned_to = ? ORDER BY created_at DESC',
    args: [user.id],
  });
  const compRes = await db.execute({ sql: 'SELECT task_id FROM completions WHERE child_id = ?', args: [user.id] });
  const done = new Set(compRes.rows.map((r) => Number(r.task_id)));
  const points = await getChildPoints(user.id);
  const tasks: Task[] = tasksRes.rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    subject: String(r.subject) as Subject,
    description: String(r.description || ''),
    points: Number(r.points),
    createdBy: Number(r.created_by),
    createdAt: String(r.created_at),
    completed: done.has(Number(r.id)),
    assignedTo: r.assigned_to == null ? null : Number(r.assigned_to),
  }));

  return (
    <div className="max-w-3xl mx-auto fade-up">
      <h1 className="page-title mb-2">我的任务 📝</h1>
      <p className="text-gray-600 mb-4">爸爸妈妈布置的学习任务都在这里，做完一个点亮一个，积分叮咚进账！</p>
      <MokoHelper
        subject="语文"
        tips={[
          '把任务一个一个点亮，就像收集萌可一样有成就感～',
          '做完一个就点「完成」，积分会叮咚进账哦！啾～',
        ]}
      />
      <ChildTaskList tasks={tasks} initialPoints={points} />
    </div>
  );
}
