import { getDb, getChildPoints } from '@/lib/db';
import ParentCastlePanel from '@/components/ParentCastlePanel';

export default async function DashboardPage() {
  const db = getDb();
  const child = await db.execute({ sql: 'SELECT * FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  const c = child.rows[0];
  const points = c ? await getChildPoints(Number(c.id)) : 0;
  const tasks = await db.execute({ sql: 'SELECT COUNT(*) as n FROM tasks', args: [] });
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
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
            <div className="text-4xl font-black">{s.value}</div>
            <div className="text-sm opacity-90">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black text-moko-violet mb-3">🏰 萌可城堡（学习联动）</h2>
      <ParentCastlePanel />

      <div className="card-moko mt-6">
        <h2 className="text-xl font-bold text-moko-violet mb-2">💡 使用提示</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>孩子完成某科后点「我完成了」，请在此确认 → 解锁对应萌可 + 阳光能量</li>
          <li>三科全确认 → 城堡繁荣度飙升，萌可开始产出星星币</li>
          <li>某天漏做 → 次日捣蛋萌可入侵，可在「补作业」补回并修复城堡</li>
          <li>在「任务」发布学习任务，在「兑换」审核奖励，在「设置」改密码</li>
        </ul>
      </div>
    </div>
  );
}
