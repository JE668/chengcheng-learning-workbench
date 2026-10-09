import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getTodayPractice, submitPractice } from '@/lib/daily-practice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const childId = await resolveChildId(user);
    if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
    const data = await getTodayPractice(childId, true);
    return NextResponse.json(data);
  } catch (e) {
    // ⚠️ 必须显式打日志：本路由原来没有 try/catch，失败时只在客户端表现为
    // 「题目加载失败（HTTP 500）」，服务端堆栈混在 next dev 的通用错误里，
    // 很难定位（CI 上排查过一轮，最终是靠上传 dev.log 才看到真因）。
    // 细节只写日志、不回传客户端，避免泄露内部表名/驱动信息。
    console.error('[api/daily-practice] GET 失败:', e instanceof Error ? e.stack || e.message : e);
    return NextResponse.json({ error: '练习加载失败，请稍后重试' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  let body: { answers?: number[] };
  try {
    body = await safeJson(req, {});
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  if (!Array.isArray(body.answers))
    return NextResponse.json({ error: '缺少答案' }, { status: 400 });
  const res = await submitPractice(childId, body.answers as number[]);
  return NextResponse.json(res);
}
