import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildPoints } from '@/lib/db';
import { getCastleState } from '@/lib/castle';
import { getTodayPractice } from '@/lib/daily-practice';
import Link from 'next/link';
import { CheckinPanel, HarvestBtn } from '@/components/castle-client';
import { GuideModal } from '@/components/GuideModal';
import { MokoGroupBg } from '@/components/moko-bg';
import { MokoAvatar } from '@/components/MokoAvatar';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;
  const db = getDb();

  // 并行拉取，减少串行等待（首页加载提速）
  const [points, castle, practice, taskRes] = await Promise.all([
    getChildPoints(user.id),
    getCastleState(user.id),
    getTodayPractice(user.id, false),
    db.execute({
      sql: `SELECT t.id, t.title, t.subject, t.points
            FROM tasks t
            LEFT JOIN completions c ON c.task_id = t.id AND c.child_id = ?
            WHERE c.task_id IS NULL
            ORDER BY t.created_at DESC LIMIT 5`,
      args: [user.id],
    }),
  ]);
  const ownedCount = castle.gallery.filter((g) => g.owned).length;
  const totalMoko = castle.gallery.length;
  const pendingTasks = taskRes.rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    subject: String(r.subject),
    points: Number(r.points),
  }));

  const stats = [
    { label: '我的积分', value: points, icon: '🏅', color: 'bg-moko-rose' },
    { label: '阳光能量', value: castle.sunlight, icon: '☀️', color: 'bg-moko-yellow' },
    { label: '星星币', value: castle.starCoins, icon: '⭐', color: 'bg-moko-gold' },
    { label: '萌可图鉴', value: `${totalMoko} 种`, icon: '🧸', color: 'bg-moko-purple' },
    { label: '城堡繁荣度', value: castle.prosperity, icon: '🏰', color: 'bg-moko-blue' },
  ];

  return (
    <div className="relative max-w-4xl mx-auto min-h-screen fade-up">
      <MokoGroupBg />
      {/* 顶部问候 */}
      <div className="card-moko flex items-center gap-5 mb-6 bg-gradient-to-r from-moko-pink to-moko-rose text-white">
        <img src="/moko/lemei.jpg" alt="乐美" className="w-24 h-24 rounded-full border-4 border-white shadow object-cover" />
        <div>
          <h1 className="text-3xl font-black">你好呀，{user.displayName}！</h1>
          <p className="text-lg opacity-90">今天也要和萌可们一起加油学习哦～</p>
        </div>
      </div>

      {/* 数据大板 */}
      <h2 className="section-title mb-3">我的成长看板 📊</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black leading-tight">{s.value}</div>
            <div className="text-xs opacity-90 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 今日一练 · 三科打卡（合并卡片：状态 + 入口合一） */}
      <div className="card-moko mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">🎯 今日一练 · 三科打卡</h2>
          <span className="text-sm text-gray-500">每科 3 题全对，自动完成该科打卡 🌟</span>
        </div>
        <CheckinPanel initial={castle.checkins} />
        <div className="mt-3">
          {practice.completed ? (
            <div className="flex items-center justify-between">
              <div className="text-moko-rose font-bold">今天已完成啦 🌟（已连续 {practice.practiceStreak} 天）</div>
              <Link href="/daily-practice" className="text-sm font-bold text-moko-rose">查看 ›</Link>
            </div>
          ) : (
            <Link href="/daily-practice" className="block text-center py-3 rounded-2xl bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black text-lg hover:scale-105 transition">
              ▶ 开始今日一练（语文 · 数学 · 英语）
            </Link>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500">再坚持 {practice.nextMilestone} 天，解锁一只新萌可入驻城堡 🧸</div>
      </div>

      {/* 我的任务（家长布置，孩子端即时可见） */}
      <div className="card-moko mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">📝 我的任务</h2>
          <Link href="/my-tasks" className="text-sm font-bold text-moko-rose">全部 ›</Link>
        </div>
        {pendingTasks.length === 0 ? (
          <p className="text-gray-500 text-sm">暂时没有新任务，去「每日一练」练一练吧～</p>
        ) : (
          <ul className="space-y-2">
            {pendingTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between bg-white/60 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {t.subject === '语文' ? '📕' : t.subject === '数学' ? '🔢' : t.subject === '英语' ? '🔤' : '📝'}
                  </span>
                  <span className="font-bold text-moko-violet">{t.title}</span>
                </div>
                <span className="text-sm text-moko-rose font-black">+{t.points} 🏅</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 城堡快览 + 快捷入口 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-moko bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">🏰 萌可城堡</h2>
            <Link href="/castle" className="text-sm font-bold text-moko-rose">进入 ›</Link>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">繁荣度</span>
            <div className="flex-1 h-3 rounded-full bg-white/70 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-moko-yellow to-moko-rose" style={{ width: `${Math.min(100, castle.prosperity * 4)}%` }} />
            </div>
            <span className="text-sm font-bold text-moko-violet">{castle.prosperity}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {castle.residents.slice(0, 6).map((r) => (
              <MokoAvatar key={r.key} img={r.img} emoji={r.emoji} name={r.name} size={48} className="rounded-full" />
            ))}
            {castle.residents.length === 0 && <span className="text-sm text-gray-500">还没有萌可入驻，快去打卡吧！</span>}
          </div>
          {castle.troublemakers.length > 0 && (
            <p className="text-sm text-red-500 font-semibold mb-2">⚠️ {castle.troublemakers.length} 只捣蛋萌可溜进城堡！快用魔法喷雾和乐美一起把它们捉回去～</p>
          )}
          <HarvestBtn />
        </div>

        <div className="card-moko">
          <h2 className="section-title mb-3">🚀 快捷入口</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/study" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-pink text-white font-black">📚 去学习</Link>
            <Link href="/games" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-blue text-white font-black">🎮 玩游戏</Link>
            <Link href="/castle" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-purple text-white font-black">🏰 城堡</Link>
            <Link href="/shop" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-gold text-white font-black">🛍️ 商城</Link>
            <Link href="/record" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-cyan text-white font-black col-span-2">🏆 看记录</Link>
            <Link href="/pinyin-blend" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-rose text-white font-black col-span-2">🀄 拼音拼读 · 拼读乐园</Link>
            <Link href="/story" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black col-span-2">📜 萌可剧情 · 捕捉萌可</Link>
            <Link href="/moko-house" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-purple text-white font-black col-span-2">🧸 萌可房间 · 和萌可互动</Link>
            <Link href="/badges" className="rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black col-span-2">🥇 勋章墙 · 看看我的成就</Link>
            <GuideModal
              className="col-span-2 rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center hover:scale-105 transition bg-moko-cyan text-white font-black cursor-pointer"
              trigger="📖 攻略说明 · 每日一练怎么玩"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
