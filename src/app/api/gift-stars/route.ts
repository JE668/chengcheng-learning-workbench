import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, withWriteLock } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { logGrowthEvent } from '@/lib/castle';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** 单次赠送上限：防误操作/防刷（孩子发起的经济写操作必须有上限） */
const MAX_GIFT = 50;

/**
 * ⭐ 星星币互赠（2026-10-17，二胎分享教育）：
 * 孩子用自己的星星币送礼物给**同家长名下**的兄妹。
 * - 限流：每孩子 6 次/分钟（防脚本刷接口）
 * - 校验：收款方必须同 parent_id 且非自己；余额充足；金额 1~50
 * - 原子性：单事务内「扣我 + 加你」，崩溃整体回滚
 * - 双方 growth_events + 收款方推送
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '只有孩子可以赠送星星币' }, { status: 403 });

  const limit = rateLimit(`gift-stars:${user.id}`, { windowSeconds: 60, maxRequests: 6 });
  if (!limit.ok)
    return NextResponse.json({ error: '送得太快啦，休息一下再送～' }, { status: 429 });

  const { toChildId, amount } = await safeJson(req, {});
  const to = Number(toChildId);
  const n = Number(amount);
  if (!Number.isInteger(to) || to <= 0)
    return NextResponse.json({ error: '请选择要送礼物的小朋友' }, { status: 400 });
  if (to === user.id)
    return NextResponse.json({ error: '不能送给自己哦～' }, { status: 400 });
  if (!Number.isInteger(n) || n < 1 || n > MAX_GIFT)
    return NextResponse.json({ error: `一次只能送 1~${MAX_GIFT} 颗星星币` }, { status: 400 });

  const db = getDb();
  // 收款方必须是同家长名下的孩子（防跨家庭转账/IDOR）
  const target = await db.execute({
    sql: "SELECT id, display_name, parent_id FROM users WHERE id = ? AND role = 'child'",
    args: [to],
  });
  if (!target.rows.length)
    return NextResponse.json({ error: '找不到这个小朋友' }, { status: 404 });
  const meRow = await db.execute({
    sql: 'SELECT parent_id FROM users WHERE id = ?',
    args: [user.id],
  });
  if (Number(target.rows[0].parent_id) !== Number(meRow.rows[0]?.parent_id)) {
    return NextResponse.json({ error: '只能送给自己的兄弟姐妹哦' }, { status: 403 });
  }
  const toName = String(target.rows[0].display_name ?? '');

  return withWriteLock(async () => {
    await db.execute('BEGIN IMMEDIATE');
    try {
      // 原子扣款：余额不足 rowsAffected=0
      const dec = await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins - ? WHERE child_id = ? AND star_coins >= ?',
        args: [n, user.id, n],
      });
      if (Number(dec.rowsAffected ?? 0) === 0) {
        throw new Error('__insufficient');
      }
      await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?',
        args: [n, to],
      });
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      if (e instanceof Error && e.message === '__insufficient') {
        return NextResponse.json({ error: '星星币不够啦，先去收获一些吧～' }, { status: 400 });
      }
      throw e;
    }

    // 事件与推送（事务外，失败不影响转账本身）
    await logGrowthEvent(
      user.id,
      'gift-out',
      '🎁',
      `送给${toName} ${n} 颗星星币`,
      '把星星币分享给家人，萌可为你骄傲！'
    );
    await logGrowthEvent(
      to,
      'gift-in',
      '🎁',
      `${user.displayName}送来 ${n} 颗星星币`,
      '收到了来自家人的礼物，好开心！'
    );
    void import('@/lib/push-notifications').then(({ notifyChildSubscribers }) =>
      notifyChildSubscribers(to, {
        title: '🎁 收到星星币礼物',
        body: `${user.displayName}送给你 ${n} 颗星星币！`,
        data: { type: 'gift-stars', from: user.id, amount: n },
      })
    );

    return NextResponse.json({ ok: true, message: `已送给${toName} ${n} 颗星星币 🎁` });
  });
}
