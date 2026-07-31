import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildrenOfParent } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 家长切换「当前查看的孩子」（持久化到家长账号的 selected_child_id）
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const targetId = Number(params.id);
  if (!Number.isInteger(targetId)) return NextResponse.json({ error: '参数错误' }, { status: 400 });

  // 校验目标孩子确实属于该家长，防止越权切到别人的孩子
  const mine = await getChildrenOfParent(user.id);
  if (!mine.some((c) => c.id === targetId)) return NextResponse.json({ error: '不是你的孩子' }, { status: 403 });

  await getDb().execute({ sql: 'UPDATE users SET selected_child_id = ? WHERE id = ?', args: [targetId, user.id] });
  return NextResponse.json({ ok: true, selectedId: targetId });
}
