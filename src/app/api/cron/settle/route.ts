import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { settleCastle } from '@/lib/castle-penalty';
import { dateStr } from '@/lib/date';
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
  const today = dateStr();
  const all = await db.execute({ sql: "SELECT id FROM users WHERE role = ?", args: ['child'] });
  const children: { childId: number; prosperity: number; starCoins: number }[] = [];
  for (const row of all.rows) {
    const cid = Number(row.id);
    // 显式结算：不再依赖 getCastleState 的副作用，职责清晰且避免读取整套城堡视图。
    await settleCastle(cid, today);
    const st = await db.execute({ sql: 'SELECT prosperity, star_coins FROM castle_state WHERE child_id = ?', args: [cid] });
    const r = st.rows[0];
    children.push({ childId: cid, prosperity: Number(r?.prosperity ?? 0), starCoins: Number(r?.star_coins ?? 0) });
  }
  return NextResponse.json({ ok: true, children });
}
