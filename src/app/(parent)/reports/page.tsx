import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildId } from '@/lib/db';
import { getBadges, getMokoProgress } from '@/lib/castle';
import { dateStr, mondayOf, LOCAL_DAY_COL } from '@/lib/date';
import PrintButton from '@/components/PrintButton';
import Certificate from '@/components/Certificate';
import { ChildSwitcher } from '@/components/ChildSwitcher';

// 解析 users.cert_pref（JSON 字符串），非法/为空时返回 null
function parsePref(raw: unknown): { mokoKey: string; theme: string } | null {
  if (raw == null) return null;
  try {
    const o = JSON.parse(String(raw));
    if (o && typeof o.mokoKey === 'string') {
      return { mokoKey: o.mokoKey, theme: typeof o.theme === 'string' ? o.theme : 'violet' };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') redirect('/home');
  const childId0 = await getChildId(user);
  const db = getDb();
  const childRows = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [childId0 ?? -1] });
  const c = childRows.rows[0];
  const childId = c ? Number(c.id) : 0;
  const childName = c ? String(c.display_name) : '小朋友';
  const initialPref = parsePref(c?.cert_pref ?? null);

  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const ws = dateStr(weekStart);
  const we = dateStr(weekEnd);

  const daily = c ? await db.execute({
    sql: `SELECT ${LOCAL_DAY_COL} as day, SUM(c.points) as total
          FROM completions c WHERE c.child_id = ? AND ${LOCAL_DAY_COL} BETWEEN ? AND ?
          GROUP BY ${LOCAL_DAY_COL} ORDER BY day DESC`,
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

  const mokoProgress = c ? await getMokoProgress(childId) : { owned: 0, total: 0, percent: 0 };
  const mokoCount = mokoProgress.owned;

  // 薄弱点：按学科 + 题型聚合错题（未掌握优先）
  const weakRows = c
    ? await db.execute({
        sql: `SELECT subject, kind, COUNT(*) n,
                     SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) as unsolved
              FROM mistakes WHERE child_id = ? GROUP BY subject, kind ORDER BY unsolved DESC`,
        args: [childId],
      })
    : { rows: [] };
  const KIND_LABEL: Record<string, string> = {
    pinyin: '拼音', math: '数学', english: '英语', char: '识字', poem: '古诗', other: '其他',
  };
  const SUBJECT_HINT: Record<string, string> = {
    语文: '多做「拼音拼读乐园」「象形字」「古诗填空」',
    数学: '多做「每日一练」数学题和「分与合」',
    英语: '多听 RAZ 绘本和英语单词点读',
  };
  const weakness = weakRows.rows
    .map((r) => ({
      subject: String(r.subject),
      kind: String(r.kind),
      n: Number(r.n),
      unsolved: Number(r.unsolved ?? 0),
    }))
    .filter((w) => w.unsolved > 0);

  const badges = c ? await getBadges(childId) : [];
  const earnedBadges = badges.filter((b) => b.earned);

  const weekLabel = `${ws} ~ ${we}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="text-3xl font-black text-moko-violet">学习报告 📈</h1>
          <ChildSwitcher />
        </div>

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
          <h2 className="text-xl font-bold text-moko-violet mb-3">🔍 薄弱点分析</h2>
          {weakness.length === 0 ? (
            <p className="text-gray-500">暂时没有未掌握的错题，孩子的掌握情况很棒！继续保持～</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {weakness.map((w) => (
                  <span
                    key={`${w.subject}-${w.kind}`}
                    className="px-3 py-1.5 rounded-full bg-moko-rose/15 text-moko-rose font-bold text-sm"
                  >
                    {w.subject}·{KIND_LABEL[w.kind] ?? w.kind} <span className="opacity-80">({w.unsolved} 道待练)</span>
                  </span>
                ))}
              </div>
              <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
                {weakness.slice(0, 4).map((w) => (
                  <li key={`${w.subject}-${w.kind}-tip`}>
                    {w.subject}的{KIND_LABEL[w.kind] ?? w.kind}出现 {w.unsolved} 道还没掌握，建议：{SUBJECT_HINT[w.subject] ?? '针对性多练一练'}。
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">提示：错题本里的题目会按遗忘曲线自动回炉，点「错题复习」就能练。</p>
            </>
          )}
        </div>

        <div className="card-moko mb-6">
          <h2 className="text-xl font-bold text-moko-violet mb-3">🐰 萌可收集进度</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">已收集 {mokoProgress.owned} / {mokoProgress.total} 只萌可</span>
            <span className="font-black text-moko-cyan">{Math.round(mokoProgress.percent * 100)}%</span>
          </div>
          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-moko-pink to-moko-cyan transition-all"
              style={{ width: `${Math.min(100, Math.round(mokoProgress.percent * 100))}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            图鉴共 {mokoProgress.total} 种萌可，按「唯一角色」去重统计（爱心/正正/唱唱等既来自打卡也来自剧情，只算 1 只）。
          </p>
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

      {/* 🏆 可打印奖状（真实萌可图案 + 孩子自选定制，选择存于云端 users.cert_pref） */}
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
          date: dateStr(now),
        }}
        editable={false}
        initialPref={initialPref}
      />
    </div>
  );
}
