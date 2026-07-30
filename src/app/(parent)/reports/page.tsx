import { getDb } from '@/lib/db';

export default async function ReportsPage() {
  const db = getDb();
  const child = await db.execute({ sql: 'SELECT * FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  const c = child.rows[0];
  const rows = c ? await db.execute({
    sql: `SELECT DATE(c.created_at) as day, SUM(c.points) as total
          FROM completions c WHERE c.child_id = ?
          GROUP BY DATE(c.created_at) ORDER BY day DESC LIMIT 14`,
    args: [c.id],
  }) : { rows: [] };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-4">学习报告 📈</h1>
      <div className="card-moko">
        <h2 className="text-xl font-bold text-moko-violet mb-3">近 14 天每日积分</h2>
        <div className="space-y-3">
          {rows.rows.map((r) => (
            <div key={r.day} className="flex items-center gap-3">
              <span className="w-24 text-gray-600">{r.day}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose rounded-full" style={{ width: `${Math.min(100, Number(r.total))}%` }}></div>
              </div>
              <span className="w-12 text-right font-bold text-moko-rose">{r.total}</span>
            </div>
          ))}
          {rows.rows.length === 0 && <div className="text-gray-500">暂无数据</div>}
        </div>
      </div>
    </div>
  );
}
