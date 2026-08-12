import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getModuleProgressAll, getModuleProgress, upsertModuleProgress } from '@/lib/progress-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const url = new URL(req.url);
  const subject = url.searchParams.get('subject');
  const moduleKey = url.searchParams.get('moduleKey');
  if (subject && moduleKey) {
    const row = await getModuleProgress(childId, subject, moduleKey);
    return NextResponse.json(
      row ?? { subject, moduleKey, stars: 0, best: 0, rounds: 0, lastPlayed: 0 },
    );
  }

  const items = await getModuleProgressAll(childId);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  let body: { subject?: string; moduleKey?: string; stars?: number };
  try {
    body = await safeJson(req, {});
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  const { subject, moduleKey } = body;
  if (!subject || !moduleKey) return NextResponse.json({ error: '缺少 subject/moduleKey' }, { status: 400 });

  const stars = Math.max(0, Math.min(3, Math.round(Number(body.stars ?? 0))));
  const row = await upsertModuleProgress(childId, subject, moduleKey, stars);
  return NextResponse.json(row);
}
