import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getTodayPractice, submitPractice } from '@/lib/daily-practice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const data = await getTodayPractice(childId, true);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  let body: { answers?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  if (!Array.isArray(body.answers)) return NextResponse.json({ error: '缺少答案' }, { status: 400 });
  const res = await submitPractice(childId, body.answers as number[]);
  return NextResponse.json(res);
}
