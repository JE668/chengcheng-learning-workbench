import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 与全站一致的本地日期格式（YYYY-MM-DD），用于「每个游戏每天仅计分一次」。
function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { gameId, score } = await req.json();
  const points = Math.max(0, Math.floor(Number(score) || 0));
  if (!gameId) return NextResponse.json({ error: '缺少游戏标识' }, { status: 400 });

  const db = getDb();
  const today = dateStr();
  // 防重放刷分：同一孩子同一游戏当天只计分一次。
  // 注意：created_at 是 UTC 的 CURRENT_TIMESTAMP，用 'localtime' 折算到服务器本地日期，
  // 与上文 today（本地日期）对齐，避免部署在 UTC 服务器时「每日一次」跨时区错位。
  const res = await db.execute({
    sql: `INSERT INTO completions (child_id, points, source)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM completions WHERE child_id = ? AND source = ? AND DATE(created_at, 'localtime') = ?)`,
    args: [user.id, points, String(gameId), user.id, String(gameId), today],
  });
  if (Number(res.rowsAffected ?? 0) === 0) {
    return NextResponse.json({ error: '今天已经玩过这个游戏啦，明天再来挑战！' }, { status: 409 });
  }
  const balance = await getChildPoints(user.id);
  return NextResponse.json({ ok: true, points: balance, message: `游戏完成，获得 ${points} 积分！` });
}
