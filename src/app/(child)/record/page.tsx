import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildPoints } from '@/lib/db';

export default async function RecordPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;
  const db = getDb();
  const points = await getChildPoints(user.id);
  const comps = await db.execute({
    sql: `SELECT c.*, t.title as task_title FROM completions c LEFT JOIN tasks t ON c.task_id = t.id
          WHERE c.child_id = ? ORDER BY c.created_at DESC LIMIT 30`,
    args: [user.id],
  });
  const redeems = await db.execute({ sql: 'SELECT * FROM redemptions WHERE child_id = ? ORDER BY created_at DESC LIMIT 10', args: [user.id] });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-4">学习记录 🏆</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-moko text-center">
          <div className="text-4xl font-black text-moko-rose">{points}</div>
          <div className="text-gray-500">当前积分</div>
        </div>
        <div className="card-moko text-center">
          <div className="text-4xl font-black text-moko-blue">{comps.rows.length}</div>
          <div className="text-gray-500">完成次数</div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">积分明细</h2>
      <div className="space-y-2 mb-8">
        {comps.rows.map((c, i) => (
          <div key={i} className="card-moko flex justify-between">
            <span className="font-medium">{c.task_title || (c.source ? `游戏/课程：${String(c.source).replace('lesson-', '').replace('task-', '').replace(/-/g, ' ')}` : '学习奖励')}</span>
            <span className="font-bold text-moko-rose">+{c.points}</span>
          </div>
        ))}
        {comps.rows.length === 0 && <div className="card-moko text-gray-500">还没有记录，快去学习吧！</div>}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">兑换记录</h2>
      <div className="space-y-2">
        {redeems.rows.map((r) => (
          <div key={r.id} className="card-moko flex justify-between">
            <span>{r.reward_name}</span>
            <span className={`font-bold ${r.status === 'approved' ? 'text-moko-mint' : r.status === 'rejected' ? 'text-red-400' : 'text-moko-yellow'}`}>
              -{r.cost} {r.status === 'pending' ? '审核中' : r.status === 'approved' ? '已兑换' : '已拒绝'}
            </span>
          </div>
        ))}
        {redeems.rows.length === 0 && <div className="card-moko text-gray-500">还没有兑换记录</div>}
      </div>
    </div>
  );
}
