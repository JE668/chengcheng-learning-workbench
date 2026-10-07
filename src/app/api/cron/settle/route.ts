import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { settleCastle } from '@/lib/castle-penalty';
import { dateStr } from '@/lib/date';
import { cleanupExpiredSessions } from '@/lib/auth';
import { isCronAuthorized } from '@/lib/cron-auth';

// Vercel Cron 调用：对城堡做一次结算（捣蛋萌可捣乱/成长刷新）。多娃下遍历所有孩子。
export async function POST(req: Request) {
  // 只认 Authorization 头，恒定时间比较（见 lib/cron-auth）
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }
  // 每日兜底清理过期会话（与 cookie 7 天 maxAge 对齐）
  await cleanupExpiredSessions().catch(() => {});
  const db = getDb();
  const today = dateStr();
  const all = await db.execute({ sql: 'SELECT id FROM users WHERE role = ?', args: ['child'] });
  const ids = all.rows.map((r) => Number(r.id));
  // 结算后一次性读回全部城堡状态，取代原来「每个孩子结算完再单独 SELECT 一次」——
  // settleCastle 本身已持有并更新了该行，这个 SELECT 是纯浪费，还把 N 次查询
  // 摊进了 N 次 await（多娃时线性变慢）。
  const children: { childId: number; prosperity: number; starCoins: number }[] = [];
  for (const cid of ids) {
    // 显式结算：不再依赖 getCastleState 的副作用，职责清晰且避免读取整套城堡视图。
    await settleCastle(cid, today);
  }
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const st = await db.execute({
      sql:
        'SELECT child_id, prosperity, star_coins FROM castle_state WHERE child_id IN (' +
        placeholders +
        ')',
      args: ids,
    });
    const byId = new Map(st.rows.map((r) => [Number(r.child_id), r]));
    for (const cid of ids) {
      const r = byId.get(cid);
      children.push({
        childId: cid,
        prosperity: Number(r?.prosperity ?? 0),
        starCoins: Number(r?.star_coins ?? 0),
      });
    }
  }
  return NextResponse.json({ ok: true, children });
}
