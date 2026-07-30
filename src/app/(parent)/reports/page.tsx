import { getDb } from '@/lib/db';
import { getBadges } from '@/lib/castle';
import PrintButton from '@/components/PrintButton';
import Certificate from '@/components/Certificate';

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

export default async function ReportsPage() {
  const db = getDb();
  const child = await db.execute({ sql: 'SELECT * FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  const c = child.rows[0];
  const childId = c ? Number(c.id) : 0;
  const childName = c ? String(c.display_name) : '小朋友';

  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const ws = fmt(weekStart);
  const we = fmt(weekEnd);

  const daily = c ? await db.execute({
    sql: `SELECT DATE(c.created_at) as day, SUM(c.points) as total
          FROM completions c WHERE c.child_id = ? AND DATE(c.created_at) BETWEEN ? AND ?
          GROUP BY DATE(c.created_at) ORDER BY day DESC`,
    args: [childId, ws, we],
  }) : { rows: [] };

  const pointsWeek = daily.rows.reduce((s: number, r) => s + Number(r.total ?? 0), 0);

  const checkinRows = c ? await db.execute({
    sql: `SELECT day, COUNT(*) as n FROM daily_checkins WHERE child_id = ? AND day BETWEEN ? AND ? AND status = 'confirmed' GROUP BY day`,
    args: [childId, ws, we],
  }) : { rows: [] };
  const fullDays = checkinRows.rows.filter((r) => Number(r.n) === 3).length;
  const activeDays = checkinRows.rows.length;

  const resolved = c ? await db.execute({
    sql: 'SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND resolved = 1',
    args: [childId],
  }) : { rows: [{ n: 0 }] };
  const resolvedCount = Number(resolved.rows[0]?.n ?? 0);

  const moko = c ? await db.execute({
    sql: 'SELECT COUNT(*) n FROM moko_owned WHERE child_id = ?',
    args: [childId],
  }) : { rows: [{ n: 0 }] };
  const mokoCount = Number(moko.rows[0]?.n ?? 0);

  const badges = c ? await getBadges(childId) : [];
  const earnedBadges = badges.filter((b) => b.earned);

  const weekLabel = `${ws} ~ ${we}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print">
        <h1 className="text-3xl font-black text-moko-violet mb-4">学习报告 📈</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '本周积分', value: pointsWeek, color: 'bg-moko-rose' },
            { label: '全勤天数', value: `${fullDays} 天`, color: 'bg-moko-blue' },
            { label: '活跃天数', value: `${activeDays} 天`, color: 'bg-moko-yellow' },
            { label: '累计攻克错题', value: resolvedCount, color: 'bg-moko-purple' },
          ].map((s) => (
            <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
              <div className="text-3xl font-black">{s.value}</div>
              <div className="text-xs opacity-90 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card-moko mb-6">
          <h2 className="text-xl font-bold text-moko-violet mb-3">近 7 天每日积分（{weekLabel}）</h2>
          <div className="space-y-3">
            {daily.rows.map((r) => (
              <div key={String(r.day)} className="flex items-center gap-3">
                <span className="w-24 text-gray-600 text-sm">{String(r.day)}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose rounded-full" style={{ width: `${Math.min(100, Number(r.total))}%` }}></div>
                </div>
                <span className="w-12 text-right font-bold text-moko-rose">{Number(r.total)}</span>
              </div>
            ))}
            {daily.rows.length === 0 && <div className="text-gray-500">本周还没有积分记录</div>}
          </div>
        </div>

        <div className="card-moko mb-6">
          <h2 className="text-xl font-bold text-moko-violet mb-2">🏅 已点亮徽章（{earnedBadges.length}/{badges.length}）</h2>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <span key={b.id} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-moko-yellow to-moko-pink text-white font-bold text-sm">{b.emoji} {b.name}</span>
            ))}
            {earnedBadges.length === 0 && <span className="text-gray-500">还没有徽章，继续加油～</span>}
          </div>
        </div>

        <div className="text-center mb-8">
          <PrintButton />
        </div>
      </div>

      {/* 🏆 可打印奖状（真实萌可图案 + 孩子自选定制，选择存于 localStorage） */}
      <Certificate
        data={{
          childName,
          weekLabel,
          pointsWeek,
          fullDays,
          activeDays,
          resolvedCount,
          mokoCount,
          earnedBadges: earnedBadges.map((b) => ({ emoji: b.emoji, name: b.name })),
          date: fmt(now),
        }}
        editable={false}
      />
    </div>
  );
}
