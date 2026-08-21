import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildId, getChildPoints } from '@/lib/db';
import { getCastleState } from '@/lib/castle';
import { getTodayPractice } from '@/lib/daily-practice';
import ParentCastlePanel from '@/components/ParentCastlePanel';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import TimeGlassApproveList from '@/components/parent/TimeGlassApproveList';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return null;
  const childId = await getChildId(user);
  const db = getDb();
  // 多娃对比数据：取该家长名下所有孩子
  let allChildren: { name: string; points: number; streak: number; mokoCount: number }[] = [];
  try {
    if (user) {
      const childRows2 = await db.execute({ sql: "SELECT id, name FROM users WHERE role = 'child' ORDER BY id", args: [] });
      const childrenList = childRows2.rows;
      if (childrenList.length > 1) {
        const results = await Promise.all(
          childrenList.map(async (ch) => {
            const cid = Number(ch.id);
            const pts = await getChildPoints(cid);
            let streak = 0;
            try { const p = await getTodayPractice(cid, false); streak = p.practiceStreak ?? 0; } catch {}
            let mokos = 0;
            try { const owned = await db.execute({ sql: 'SELECT COUNT(*) as n FROM moko_owned WHERE child_id = ?', args: [cid] }); mokos = Number(owned.rows[0]?.n || 0); } catch {}
            return { name: String(ch.name), points: pts, streak, mokoCount: mokos };
          })
        );
        allChildren = results;
      }
    }
  } catch { /* 忽略 */ }

  const childRows = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [childId ?? -1] });
  const c = childRows.rows[0];
  const cId = c ? Number(c.id) : null;
  const points = cId ? await getChildPoints(cId) : 0;
  const tasks = await db.execute({ sql: 'SELECT COUNT(*) as n FROM tasks', args: [] });
  const comps = await db.execute({ sql: 'SELECT COUNT(*) as n FROM completions WHERE child_id = ?', args: [cId ?? -1] });
  const pending = await db.execute({ sql: 'SELECT COUNT(*) as n FROM redemptions WHERE status = ?', args: ['pending'] });

  // 今日完成情况
  let todayDone = false;
  let todaySubj = { 语文: false, 数学: false, 英语: false };
  try {
    if (cId) {
      const practice = await getTodayPractice(cId, false);
      todayDone = practice.completed;
      const checkins = await db.execute({
        sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = date('now','localtime') AND status = ?",
        args: [cId, 'confirmed'],
      });
      for (const r of checkins.rows) todaySubj[String(r.subject) as keyof typeof todaySubj] = true;
    }
  } catch { /* 建表前或查询失败不影响看板 */ }

  // 萌可收集进度
  let ownedCount = 0, totalMoko = 0;
  try {
    if (cId) {
      const castle = await getCastleState(cId);
      ownedCount = castle.gallery.filter((g) => g.owned).length;
      totalMoko = castle.gallery.length;
    }
  } catch { /* 同上 */ }

  // 待审批时光沙漏申请
  let timeglassRequests: { id: number; createdAt: string }[] = [];
  try {
    if (cId) {
      const reqRows = await db.execute({
        sql: "SELECT id, created_at FROM wishes WHERE child_id = ? AND text = ? AND status = 'pending' ORDER BY created_at DESC",
        args: [cId, '⏳ 申请时光沙漏'],
      });
      timeglassRequests = reqRows.rows.map((r) => ({ id: Number(r.id), createdAt: String(r.created_at ?? '') }));
    }
  } catch { /* 忽略 */ }

  // 本周积分趋势（最近 7 天每日积分）
  let weeklyPoints: { day: string; points: number }[] = [];
  try {
    if (cId) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekStart = weekAgo.toISOString().split('T')[0];
      const pts = await db.execute({
        sql: `SELECT DATE(created_at, 'localtime') as day, COALESCE(SUM(points), 0) as pts
              FROM completions WHERE child_id = ? AND created_at >= ? GROUP BY day ORDER BY day`,
        args: [cId, weekStart],
      });
      // 补齐 7 天（含 0 分日）
      const dayMap = new Map<string, number>();
      for (const r of pts.rows) dayMap.set(String(r.day), Number(r.pts));
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        weeklyPoints.push({ day: key, points: dayMap.get(key) ?? 0 });
      }
    }
  } catch { /* 忽略 */ }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h1 className="page-title">爸爸妈妈看板 📊</h1>
        <ChildSwitcher />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '孩子积分', value: points, color: 'bg-moko-rose' },
          { label: '已发布任务', value: Number(tasks.rows[0]?.n || 0), color: 'bg-moko-blue' },
          { label: '完成次数', value: Number(comps.rows[0]?.n || 0), color: 'bg-moko-yellow' },
          { label: '待审核兑换', value: Number(pending.rows[0]?.n || 0), color: 'bg-moko-purple' },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
            <div className="text-4xl font-black">{s.value}</div>
            <div className="text-sm opacity-90">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 👨‍👩‍👧 多娃对比 */}
      {allChildren.length > 1 && (
        <div className="card-moko mb-6">
          <h2 className="text-xl font-black text-moko-violet mb-3">👨‍👩‍👧 多娃对比</h2>
          <div className="space-y-3">
            {(() => {
              const maxPts = Math.max(...allChildren.map(c => c.points), 1);
              const maxMokos = Math.max(...allChildren.map(c => c.mokoCount), 1);
              return allChildren.sort((a, b) => b.points - a.points).map((ch, i) => {
                const isCurrent = ch.name === (c?.name ?? '');
                return (
                  <div key={ch.name} className={`${isCurrent ? 'bg-moko-purple/10 border-moko-purple/30' : 'bg-gray-50 border-gray-100'} rounded-2xl p-3 border-2`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-moko-violet">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {ch.name}
                        {isCurrent && <span className="text-xs text-moko-purple ml-1">（当前查看）</span>}
                      </span>
                      <span className="text-xs text-gray-500">🔥 {ch.streak} 天</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
                          <span>积分</span><span className="font-bold">{ch.points}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-moko-rose rounded-full" style={{ width: `${(ch.points / maxPts) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
                          <span>萌可</span><span className="font-bold">{ch.mokoCount}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-moko-gold rounded-full" style={{ width: `${(ch.mokoCount / maxMokos) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 今日学情摘要 */}
      {cId && (() => {
        const subjects = [
          { name: '语文', done: todaySubj.语文, icon: '📕', color: 'bg-moko-rose' },
          { name: '数学', done: todaySubj.数学, icon: '🔢', color: 'bg-moko-blue' },
          { name: '英语', done: todaySubj.英语, icon: '🔤', color: 'bg-moko-yellow' },
        ];
        const doneCount = subjects.filter((s) => s.done).length;
        return (
          <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-purple/20 mb-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-moko-violet">📋 今日学情</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${todayDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {todayDone ? '今日已完成 🎉' : `${doneCount}/3 科已打卡`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {subjects.map((s) => (
                <div key={s.name} className={`rounded-2xl p-3 text-center ${s.done ? s.color + ' text-white' : 'bg-gray-50 text-gray-400'}`}>
                  <div className="text-2xl mb-1">{s.done ? '✅' : s.icon}</div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs">{s.done ? '已打卡' : '未完成'}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <h2 className="section-title mb-3">🏰 萌可城堡（学习联动）</h2>
      <ParentCastlePanel />

      {totalMoko > 0 && (
        <div className="rounded-3xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-moko-violet">🧸 萌可收集进度</span>
            <span className="text-sm font-bold text-gray-500">{ownedCount} / {totalMoko}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all"
              style={{ width: `${Math.round((ownedCount / totalMoko) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[
          { label: '今日完成', value: todayDone ? '✅ 已完成' : '⬜ 未完成', color: todayDone ? 'bg-green-500' : 'bg-gray-400' },
          { label: '语文', value: todaySubj.语文 ? '✅' : '⬜', color: 'bg-moko-rose' },
          { label: '数学', value: todaySubj.数学 ? '✅' : '⬜', color: 'bg-moko-blue' },
          { label: '英语', value: todaySubj.英语 ? '✅' : '⬜', color: 'bg-moko-yellow' },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-sm opacity-90">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card-moko mt-6">
        <h2 className="text-xl font-bold text-moko-violet mb-2">💡 使用提示</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>孩子完成「今日一练」三科全对 → 自动打卡，解锁对应萌可 + 阳光能量</li>
          <li>三科全对 → 城堡繁荣度飙升，萌可开始产出星星币</li>
          <li>某天漏做 → 次日捣蛋萌可溜进城堡捣乱，可在下方「补作业」帮乐美把它们捉回去</li>
          <li>在「任务」发布学习任务，在「兑换」审核奖励，在「设置」改密码</li>
        </ul>
      </div>

      {/* 本周积分趋势图 */}
      {weeklyPoints.length > 0 && (
        <div className="card-moko mt-6">
          <h2 className="text-xl font-bold text-moko-violet mb-3">📈 本周积分趋势</h2>
          <div className="relative h-24">
            <svg viewBox="0 0 700 120" className="w-full h-full" preserveAspectRatio="none">
              {/* 网格线 */}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={30 + i * 20} x2="700" y2={30 + i * 20} stroke="#f0e6ff" strokeWidth="1" />
              ))}
              {/* 面积图 */}
              <path
                d={
                  'M' + weeklyPoints.map((p, i) => {
                    const x = 50 + (i * 600 / 6);
                    const maxPts = Math.max(...weeklyPoints.map((w) => w.points), 1);
                    const y = 110 - (p.points / maxPts) * 80;
                    return `${x},${y}`;
                  }).join(' L') + ' L' + (50 + 600) + ',110 L50,110 Z'
                }
                fill="url(#gradient)" opacity="0.3"
              />
              {/* 折线 */}
              <path
                d={
                  'M' + weeklyPoints.map((p, i) => {
                    const x = 50 + (i * 600 / 6);
                    const maxPts = Math.max(...weeklyPoints.map((w) => w.points), 1);
                    const y = 110 - (p.points / maxPts) * 80;
                    return `${x},${y}`;
                  }).join(' L')
                }
                fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              />
              {/* 数据点 */}
              {weeklyPoints.map((p, i) => {
                const x = 50 + (i * 600 / 6);
                const maxPts = Math.max(...weeklyPoints.map((w) => w.points), 1);
                const y = 110 - (p.points / maxPts) * 80;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#8B5CF6" stroke="white" strokeWidth="2" />
                    <text x={x} y={125} textAnchor="middle" className="text-[10px]" fill="#9CA3AF" fontSize="10">
                      {p.day.slice(5)}
                    </text>
                    <text x={x} y={y - 10} textAnchor="middle" className="text-[10px]" fill="#8B5CF6" fontSize="10" fontWeight="bold">
                      {p.points}
                    </text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>7 天前</span>
            <span>今天</span>
          </div>
        </div>
      )}

      {/* ⏳ 时光沙漏申请审批 */}
      {timeglassRequests.length > 0 && (
        <TimeGlassApproveList requests={timeglassRequests} childId={cId!} />
      )}
    </div>
  );
}