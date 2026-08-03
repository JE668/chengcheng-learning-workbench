import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCastleState } from '@/lib/castle';
import { cleanupExpiredSessions } from '@/lib/auth';

// Vercel Cron 调用：对城堡做一次结算（捣蛋萌可捣乱/成长刷新）。多娃下遍历所有孩子。
export async function POST(req: Request) {
  const secret = req.headers.get('authorization') || new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }
  // 每日兜底清理过期会话（与 cookie 7 天 maxAge 对齐）
  await cleanupExpiredSessions().catch(() => {});
  const db = getDb();
  const all = await db.execute({ sql: "SELECT id FROM users WHERE role = ?", args: ['child'] });
  const children: { childId: number; prosperity: number; starCoins: number }[] = [];
  for (const row of all.rows) {
    const cid = Number(row.id);
    const state = await getCastleState(cid);
    children.push({ childId: cid, prosperity: state.prosperity, starCoins: state.starCoins });
  }
  return NextResponse.json({ ok: true, children });
}
