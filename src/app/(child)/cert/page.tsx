import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getBadges } from '@/lib/castle';
import Certificate, { CertData } from '@/components/Certificate';
import PrintButton from '@/components/PrintButton';

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

export default async function ChildCertPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;

  const db = getDb();
  const childId = user.id;
  const childName = user.displayName || '小朋友';

  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const ws = fmt(weekStart);
  const we = fmt(weekEnd);

  const daily = await db.execute({
    sql: `SELECT DATE(c.created_at) as day, SUM(c.points) as total
          FROM completions c WHERE c.child_id = ? AND DATE(c.created_at) BETWEEN ? AND ?
          GROUP BY DATE(c.created_at) ORDER BY day DESC`,
    args: [childId, ws, we],
  });
  const pointsWeek = daily.rows.reduce((s: number, r) => s + Number(r.total ?? 0), 0);

  const checkinRows = await db.execute({
    sql: `SELECT day, COUNT(*) as n FROM daily_checkins WHERE child_id = ? AND day BETWEEN ? AND ? AND status = 'confirmed' GROUP BY day`,
    args: [childId, ws, we],
  });
  const fullDays = checkinRows.rows.filter((r) => Number(r.n) === 3).length;

  const resolved = await db.execute({
    sql: 'SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND resolved = 1',
    args: [childId],
  });
  const resolvedCount = Number(resolved.rows[0]?.n ?? 0);

  const moko = await db.execute({
    sql: 'SELECT COUNT(*) n FROM moko_owned WHERE child_id = ?',
    args: [childId],
  });
  const mokoCount = Number(moko.rows[0]?.n ?? 0);

  const badges = await getBadges(childId);
  const earnedBadges = badges.filter((b) => b.earned).map((b) => ({ emoji: b.emoji, name: b.name }));

  const data: CertData = {
    childName,
    weekLabel: `${ws} ~ ${we}`,
    pointsWeek,
    fullDays,
    activeDays: checkinRows.rows.length,
    resolvedCount,
    mokoCount,
    earnedBadges,
    date: fmt(now),
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-2">我的奖状 🏆</h1>
      <p className="text-gray-600 mb-4">选你最喜欢的萌可和颜色，做成专属奖状！也可以让爸爸妈妈帮忙打印出来～</p>
      <Certificate data={data} editable={true} />
      <div className="no-print text-center mt-6 flex items-center justify-center gap-3">
        <PrintButton />
        <Link href="/record" className="text-moko-violet font-bold hover:underline">‹ 返回学习记录</Link>
      </div>
    </div>
  );
}
