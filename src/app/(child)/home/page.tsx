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
    { label: '我的积分', value: points, icon: '🏅', color: 'bg-moko-rose', href: '/record' },
    { label: '阳光能量', value: castle.sunlight, icon: '☀️', color: 'bg-moko-yellow', href: '/castle' },
    { label: '星星币', value: castle.starCoins, icon: '⭐', color: 'bg-moko-gold', href: '/shop' },
    { label: '萌可图鉴', value: `${totalMoko} 种`, icon: '🧸', color: 'bg-moko-purple', href: '/castle' },
    { label: '城堡繁荣度', value: castle.prosperity, icon: '🏰', color: 'bg-moko-blue', href: '/castle' },
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
          <Link key={s.label} href={s.href} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white hover:scale-105 active:scale-95 transition cursor-pointer`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black leading-tight">{s.value}</div>
            <div className="text-xs opacity-90 mt-1">{s.label} ›</div>
          </Link>
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
          <HarvestBtn
            info={{
              harvestableStars: castle.harvestableStars,
              friendTotal: castle.friendTotal,
              friendHarvestedToday: castle.friendHarvestedToday,
            }}
          />
        </div>

        <div className="card-moko">
          <h2 className="section-title mb-1">🚀 按顺序做，资源越来越多！</h2>
          <p className="text-xs text-gray-400 mb-3">从上往下点，每一步都能攒到东西～</p>
          <div className="space-y-2">
            {/* ① 今日一练：积分+阳光+捕捉券+萌可 */}
            <Link href="/daily-practice" className="flex items-center gap-3 rounded-2xl p-3 shadow border-2 border-moko-gold/30 bg-moko-gold/5 hover:border-moko-gold transition active:scale-95">
              <span className="text-2xl">①🎯</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet">做今日一练</div>
                <div className="text-xs text-gray-500">积分 +10/科 · 阳光 +1/科 · 捕捉券 +1/科 · 萌可入驻</div>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            {/* ② 学习：模块星 */}
            <Link href="/study" className="flex items-center gap-3 rounded-2xl p-3 shadow border-2 border-moko-pink/30 bg-moko-pink/5 hover:border-moko-pink transition active:scale-95">
              <span className="text-2xl">②📚</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet">去学习</div>
                <div className="text-xs text-gray-500">做模块练习拿 ⭐学习星（解锁萌可剧情）</div>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            {/* ③ 游戏：积分 */}
            <Link href="/games" className="flex items-center gap-3 rounded-2xl p-3 shadow border-2 border-moko-blue/30 bg-moko-blue/5 hover:border-moko-blue transition active:scale-95">
              <span className="text-2xl">③🎮</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet">玩游戏</div>
                <div className="text-xs text-gray-500">得分就是积分，每天每款 1 次</div>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            {/* ④ 捕捉萌可：积分+城堡萌可 */}
            <Link href="/story" className="flex items-center gap-3 rounded-2xl p-3 shadow border-2 border-moko-yellow/30 bg-moko-yellow/5 hover:border-moko-yellow transition active:scale-95">
              <span className="text-2xl">④📜</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet">捕捉萌可</div>
                <div className="text-xs text-gray-500">积分 +10/只 · 萌可入驻城堡（第 2 集起耗捕捉券）</div>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            {/* ⑤ 城堡收获：星星币 */}
            <Link href="/castle" className="flex items-center gap-3 rounded-2xl p-3 shadow border-2 border-moko-purple/30 bg-moko-purple/5 hover:border-moko-purple transition active:scale-95">
              <span className="text-2xl">⑤🏰</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet">城堡收获</div>
                <div className="text-xs text-gray-500">好朋友萌可每天送 ⭐星星币 +5/只</div>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            {/* ⑥ 兑换：花资源 */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/shop" className="flex items-center gap-2 rounded-2xl p-3 shadow border-2 border-moko-gold/30 bg-white hover:border-moko-gold transition active:scale-95">
                <span className="text-xl">🛍️</span>
                <div className="min-w-0">
                  <div className="font-bold text-moko-violet text-sm">花星星币</div>
                  <div className="text-[10px] text-gray-400">去商城</div>
                </div>
              </Link>
              <Link href="/record" className="flex items-center gap-2 rounded-2xl p-3 shadow border-2 border-moko-cyan/30 bg-white hover:border-moko-cyan transition active:scale-95">
                <span className="text-xl">📊</span>
                <div className="min-w-0">
                  <div className="font-bold text-moko-violet text-sm">资源明细</div>
                  <div className="text-[10px] text-gray-400">看怎么来的</div>
                </div>
              </Link>
            </div>
            {/* 攻略说明 */}
            <GuideModal
              className="w-full rounded-2xl p-3 shadow border-2 border-moko-cyan/30 bg-moko-cyan/5 hover:border-moko-cyan transition active:scale-95 text-center text-moko-cyan font-bold text-sm cursor-pointer"
              trigger="📖 看攻略：积分/星星币怎么攒？花在哪里？"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
