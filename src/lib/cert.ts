import { getDb } from './db';
import { getBadges } from './castle';
import { dateStr, mondayOf, LOCAL_DAY_COL } from './date';
import type { CertData } from '@/components/Certificate';

/** 计算孩子本周的奖状数据（孩子端预览与家长端审批共用，保证一致） */
export async function getCertData(childId: number, childName: string): Promise<CertData> {
  const db = getDb();
  // 优先用孩子自定义的名字（存于 cert_pref.name），否则回退到账号显示名
  let certName = childName;
  try {
    const prefRes = await db.execute({ sql: 'SELECT cert_pref FROM users WHERE id = ?', args: [childId] });
    const raw = prefRes.rows[0]?.cert_pref;
    if (raw != null) {
      const o = JSON.parse(String(raw));
      if (o && typeof o.name === 'string' && o.name.trim()) certName = o.name.trim();
    }
  } catch {
    /* ignore */
  }
  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const ws = dateStr(weekStart);
  const we = dateStr(weekEnd);

  const daily = await db.execute({
    sql: `SELECT ${LOCAL_DAY_COL} as day, SUM(c.points) as total
          FROM completions c WHERE c.child_id = ? AND ${LOCAL_DAY_COL} BETWEEN ? AND ?
          GROUP BY ${LOCAL_DAY_COL} ORDER BY day DESC`,
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

  return {
    childName: certName,
    weekLabel: `${ws} ~ ${we}`,
    pointsWeek,
    fullDays,
    activeDays: checkinRows.rows.length,
    resolvedCount,
    mokoCount,
    earnedBadges,
    date: dateStr(now),
  };
}

/** 取孩子当前有效奖状申请状态：pending / approved / rejected / null（无） */
export async function getCertRequestStatus(childId: number): Promise<'pending' | 'approved' | 'rejected' | null> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT status FROM cert_requests WHERE child_id = ? ORDER BY id DESC LIMIT 1',
    args: [childId],
  });
  if (!res.rows.length) return null;
  return res.rows[0].status as 'pending' | 'approved' | 'rejected';
}

/** 家长端：列出该孩子的奖状申请（按时间倒序） */
export async function getCertRequests(childId: number) {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT id, status, created_at FROM cert_requests WHERE child_id = ? ORDER BY id DESC',
    args: [childId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    status: String(r.status) as 'pending' | 'approved' | 'rejected',
    createdAt: String(r.created_at),
  }));
}
