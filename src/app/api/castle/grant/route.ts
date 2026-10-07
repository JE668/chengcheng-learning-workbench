import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';
import { grantResource } from '@/lib/castle';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 家长端：直接给孩子发放资源（阳光/星星币/捕捉券） */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  // ⚠️ 必须限流。单个请求有 1-100 的数量上限，但**没有次数上限**，
  // 家长账号被盗（或被 CSRF 借力）时可被脚本无限循环造币。
  // 档位取「1 分钟 20 次」：家长正常操作是偶尔发一次奖励，连续调 20 次已经
  // 不像人；但相比 castle/buy（10 秒 5 次）宽得多，不会打断正常使用。
  const limit = rateLimit(`castle-grant:${user.id}`, { windowSeconds: 60, maxRequests: 20 });
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  const { resource, amount } = await req.json();
  if (!['sunlight', 'starCoins', 'tickets'].includes(resource)) {
    return NextResponse.json({ error: '未知资源类型' }, { status: 400 });
  }
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 100) {
    return NextResponse.json({ error: '数量必须是 1-100 的数字' }, { status: 400 });
  }
  const res = await grantResource(childId, resource, numAmount);
  return NextResponse.json(res);
}
