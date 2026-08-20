import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildId, getChildPoints } from '@/lib/db';
import { getCastleState } from '@/lib/castle';
import { getTodayPractice } from '@/lib/daily-practice';
import ParentCastlePanel from '@/components/ParentCastlePanel';
import { ChildSwitcher } from '@/components/ChildSwitcher';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return null;
  const childId = await getChildId(user);
  const db = getDb();
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
    </div>
  );
}
