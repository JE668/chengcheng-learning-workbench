import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';
import { getDb } from '@/lib/db-core';
import { logGrowthEvent } from '@/lib/castle';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 家长端：给孩子发放道具（当前仅支持时光沙漏）。
 * 不消耗孩子的任何资源——家长直接赠送。
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  // ⚠️ 这条路由原先**既无限流也无数量上限**：SQL 是 `qty = qty + 1`，
  // 一次请求只加 1，但没有次数限制 → 脚本循环即可无限造时光沙漏。
  // 档位与 castle/grant 一致（1 分钟 20 次）：正常家长偶尔送一个，
  // 连续 20 次已不像人；不会打断正常使用。
  const limit = rateLimit(`castle-gift:${user.id}`, { windowSeconds: 60, maxRequests: 20 });
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  const { itemKey } = await req.json();
  if (itemKey !== 'timeglass') {
    return NextResponse.json({ error: '暂不支持该道具' }, { status: 400 });
  }

  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
    args: [childId, 'timeglass'],
  });
  await logGrowthEvent(
    childId,
    'gift',
    '⏳',
    '收到爸爸妈妈送的时光沙漏！',
    '可以用来补打卡漏做的日期哦～'
  );
  return NextResponse.json({ ok: true, message: '已送给孩子 1 个时光沙漏，去城堡背包查看吧～' });
}
