import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildPoints } from '@/lib/db';
import { getGrowthDiary } from '@/lib/castle';
import Link from 'next/link';
import GrowthTree from '@/components/GrowthTree';
import CheckinCalendar from '@/components/CheckinCalendar';
import { EmptyState } from '@/components/EmptyState';

// 本地日期工具（与 castle/date 一致）
function dateStrForPg(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const diary = await getGrowthDiary(user.id, 20);

  // 近 7 天积分趋势
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().split('T')[0];
  const weeklyPts = await db.execute({
    sql: `SELECT DATE(created_at, 'localtime') as day, COALESCE(SUM(points), 0) as pts
          FROM completions WHERE child_id = ? AND created_at >= ? GROUP BY day ORDER BY day`,
    args: [user.id, weekStart],
  });
  const ptsByDay = new Map<string, number>();
  for (const r of weeklyPts.rows) ptsByDay.set(String(r.day), Number(r.pts));
  const weeklyTrend: { day: string; pts: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    weeklyTrend.push({ day: key, pts: ptsByDay.get(key) ?? 0 });
  }

  // 打卡日历：近 35 天每日打卡科目数 + 是否有捣蛋萌可
  const calStartDate = new Date();
  calStartDate.setDate(calStartDate.getDate() - 34);
  const calStart = calStartDate.toISOString().split('T')[0];
  const calCheckins = await db.execute({
    sql: "SELECT day, subject FROM daily_checkins WHERE child_id = ? AND day >= ? AND status = 'confirmed'",
    args: [user.id, calStart],
  });
  const calTrouble = await db.execute({
    sql: "SELECT DISTINCT day FROM troublemakers WHERE child_id = ? AND day >= ? AND resolved = 0",
    args: [user.id, calStart],
  });
  const calTroubleSet = new Set(calTrouble.rows.map((r) => String(r.day)));
  const calByDay = new Map<string, Set<string>>();
  for (const r of calCheckins.rows) {
    const d = String(r.day);
    if (!calByDay.has(d)) calByDay.set(d, new Set());
    calByDay.get(d)!.add(String(r.subject));
  }
  const calDays: { day: string; count: number; hasTrouble: boolean }[] = [];
  const todayKey = dateStrForPg();
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateStrForPg(d);
    const subs = calByDay.get(key) ?? new Set<string>();
    calDays.push({ day: key, count: subs.size, hasTrouble: calTroubleSet.has(key) });
  }

  return (
    <div className="max-w-3xl mx-auto fade-up">
      <h1 className="page-title mb-4">学习记录 🏆</h1>
      <Link href="/cert" className="block mb-6 rounded-2xl p-4 bg-gradient-to-r from-moko-gold to-moko-rose text-white shadow-lg hover:scale-[1.01] transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black">🎖️ 我的奖状</div>
            <div className="text-sm opacity-90">选喜欢的萌可和颜色，做专属奖状～</div>
          </div>
          <div className="text-3xl">➡️</div>
        </div>
      </Link>
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

      {/* 近 7 天积分趋势 */}
      {weeklyTrend.length > 0 && (
        <div className="card-moko mb-6">
          <h2 className="text-xl font-bold text-moko-violet mb-3">📈 近 7 天积分趋势</h2>
          <div className="relative h-28">
            <svg viewBox="0 0 700 140" className="w-full h-full" preserveAspectRatio="none">
              {[0,1,2,3].map((i) => (
                <line key={i} x1="0" y1={30 + i * 25} x2="700" y2={30 + i * 25} stroke="#f0e6ff" strokeWidth="1" />
              ))}
              <path
                d={'M' + weeklyTrend.map((p, i) => {
                  const x = 50 + (i * 600 / 6);
                  const maxPts = Math.max(...weeklyTrend.map(w => w.pts), 1);
                  return x + ',' + (130 - (p.pts / maxPts) * 90);
                }).join(' L') + ' L' + (50 + 600) + ',130 L50,130 Z'}
                fill="url(#gradient)" opacity="0.25"
              />
              <path
                d={'M' + weeklyTrend.map((p, i) => {
                  const x = 50 + (i * 600 / 6);
                  const maxPts = Math.max(...weeklyTrend.map(w => w.pts), 1);
                  return x + ',' + (130 - (p.pts / maxPts) * 90);
                }).join(' L')}
                fill="none" stroke="#FF5DA0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              />
              {weeklyTrend.map((p, i) => {
                const x = 50 + (i * 600 / 6);
                const maxPts = Math.max(...weeklyTrend.map(w => w.pts), 1);
                const y = 130 - (p.pts / maxPts) * 90;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#FF5DA0" stroke="white" strokeWidth="2" />
                    <text x={x} y={145} textAnchor="middle" fill="#9CA3AF" fontSize="10">{p.day.slice(5)}</text>
                    <text x={x} y={y - 10} textAnchor="middle" fill="#FF5DA0" fontSize="10" fontWeight="bold">{p.pts}</text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5DA0" />
                  <stop offset="100%" stopColor="#FF8FC6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}
      {/* 📅 打卡日历（近 35 天） */}
      <div className="card-moko mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black text-moko-violet">📅 打卡日历</h2>
          <span className="text-sm text-gray-500">坚持每天三科打卡，日历越来越绿！</span>
        </div>
        <CheckinCalendar days={calDays} />
      </div>

      {/* 🌳 成长树 */}
      <h2 className="text-2xl font-black text-moko-violet mb-3">🌳 我的成长树</h2>
      <GrowthTree />

      {/* 📔 萌可成长日记 */}
      <h2 className="text-2xl font-black text-moko-violet mb-3">📔 萌可成长日记</h2>
      <div className="card-moko mb-8">
        {diary.length === 0 ? (
          <EmptyState emoji="📔" title="还没有日记" desc="快去完成打卡，和萌可们一起写成长故事吧！" />
        ) : (
          <ol className="relative border-l-4 border-moko-pink/40 ml-3 space-y-4">
            {diary.map((e) => (
              <li key={e.id} className="ml-5">
                <span className="absolute -left-[14px] flex items-center justify-center w-7 h-7 bg-white rounded-full border-2 border-moko-pink shadow text-lg">{e.emoji}</span>
                <div className="font-bold text-moko-violet">{e.title}</div>
                {e.desc && <div className="text-sm text-gray-500">{e.desc}</div>}
                <div className="text-xs text-gray-400 mt-0.5">{e.created_at?.slice(0, 16)?.replace('T', ' ')}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">积分明细</h2>
      <div className="space-y-2 mb-8">
        {comps.rows.map((c, i) => {
          let label = '学习奖励';
          if (c.task_title) {
            label = `任务：${String(c.task_title)}`;
          } else if (c.source) {
            const src = String(c.source);
            if (src.startsWith('checkin:')) label = `每日一练 · ${src.replace('checkin:', '')} 打卡`;
            else if (src.startsWith('story:')) label = '捕捉萌可';
            else if (src.startsWith('game-') || src.startsWith('lesson-') || src.startsWith('task-')) label = `游戏/课程：${src.replace(/^(game|lesson|task)-/, '').replace(/-/g, ' ')}`;
            else label = src.replace(/-/g, ' ');
          }
          return (
            <div key={i} className="card-moko flex justify-between">
              <span className="font-medium">{label}</span>
              <span className="font-bold text-moko-rose">+{Number(c.points)}</span>
            </div>
          );
        })}
        {comps.rows.length === 0 && <div className="card-moko text-gray-500">还没有记录，快去学习吧！</div>}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">兑换记录</h2>
      <div className="space-y-2">
        {redeems.rows.map((r) => (
          <div key={String(r.id)} className="card-moko flex justify-between">
            <span>{String(r.reward_name)}</span>
            <span className={`font-bold ${String(r.status) === 'approved' ? 'text-moko-mint' : String(r.status) === 'rejected' ? 'text-red-400' : 'text-moko-yellow'}`}>
              -{Number(r.cost)} {String(r.status) === 'pending' ? '审核中' : String(r.status) === 'approved' ? '已兑换' : '已拒绝'}
            </span>
          </div>
        ))}
        {redeems.rows.length === 0 && <div className="card-moko text-gray-500">还没有兑换记录</div>}
      </div>
    </div>
  );
}
