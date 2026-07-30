import { getDb, getChildPoints } from '@/lib/db';

export default async function DashboardPage() {
  const db = getDb();
  const child = await db.execute({ sql: 'SELECT * FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  const c = child.rows[0];
  const points = c ? await getChildPoints(Number(c.id)) : 0;
  const tasks = await db.execute({ sql: 'SELECT COUNT(*) as n FROM tasks' });
  const comps = await db.execute({ sql: 'SELECT COUNT(*) as n FROM completions WHERE child_id = ?', args: [c?.id] });
  const pending = await db.execute({ sql: 'SELECT COUNT(*) as n FROM redemptions WHERE status = ?', args: ['pending'] });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-6">家长看板 📊</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '孩子积分', value: points, color: 'bg-moko-rose' },
          { label: '已发布任务', value: tasks.rows[0]?.n || 0, color: 'bg-moko-blue' },
          { label: '完成次数', value: comps.rows[0]?.n || 0, color: 'bg-moko-yellow' },
          { label: '待审核兑换', value: pending.rows[0]?.n || 0, color: 'bg-moko-purple' },
        ].map((s) => (
          <div key={s.label} className={`card-moko text-center ${s.color} text-white`}>
            <div className="text-4xl font-black">{s.value}</div>
            <div className="text-sm opacity-90">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card-moko">
        <h2 className="text-xl font-bold text-moko-violet mb-2">💡 使用提示</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>在「任务」页面给孩子发布学习任务</li>
          <li>在「兑换」页面审核孩子的奖励申请</li>
          <li>在「设置」页面修改孩子登录密码</li>
        </ul>
      </div>
    </div>
  );
}
