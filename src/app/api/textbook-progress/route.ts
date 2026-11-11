import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getTextbookProgress, setTextbookProgress } from '@/lib/progress-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  return NextResponse.json({ progress: await getTextbookProgress(childId) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  let body: { bookKey?: string; chapterIdx?: number };
  try {
    body = await safeJson(req, {});
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  if (!body.bookKey) return NextResponse.json({ error: '缺少 bookKey' }, { status: 400 });

  const chapterIdx = Number(body.chapterIdx ?? 0);
  // NaN/负数/非整数直接拒绝：透传给 SQL 参数会抛 RangeError → 裸 500
  if (!Number.isInteger(chapterIdx) || chapterIdx < 0) {
    return NextResponse.json({ error: 'chapterIdx 无效' }, { status: 400 });
  }

  await setTextbookProgress(childId, body.bookKey, chapterIdx);
  return NextResponse.json({ ok: true });
}
