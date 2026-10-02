import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getModuleProgressAll, getModuleProgress, upsertModuleProgress } from '@/lib/progress-store';
import { STUDY_MODULES } from '@/lib/study-modules';

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

  // 白名单校验：只接受 STUDY_MODULES 里真实存在的 (subject, moduleKey)，
  // 否则客户端可以往 module_progress 里写任意行。
  const modules = STUDY_MODULES[subject as keyof typeof STUDY_MODULES];
  if (!Array.isArray(modules) || !modules.some((m) => m.key === moduleKey)) {
    return NextResponse.json({ error: '未知的学习模块' }, { status: 400 });
  }

  const starsNum = Number(body.stars ?? 0);
  // Number('abc') 得到 NaN，会被 Math.round 原样写进库；这里显式拒绝。
  if (!Number.isFinite(starsNum)) {
    return NextResponse.json({ error: '无效的星级' }, { status: 400 });
  }
  const stars = Math.max(0, Math.min(3, Math.round(starsNum)));
  const row = await upsertModuleProgress(childId, subject, moduleKey, stars);
  return NextResponse.json(row);
}
