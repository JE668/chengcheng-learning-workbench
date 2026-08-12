import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { reviewMistake } from '@/lib/mistakes';

// 复习反馈：正确则按间隔重复推进（1→3→7→翻倍），错误则重置
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '只有孩子可以复习' }, { status: 403 });
  const { id, correct } = (await safeJson(req, {})) as { id?: number; correct?: boolean };
  if (!id) return NextResponse.json({ error: '参数缺失' }, { status: 400 });
  const ok = await reviewMistake(user.id, id, !!correct);
  if (!ok) return NextResponse.json({ ok: true, skipped: true });
  return NextResponse.json({ ok: true });
}
