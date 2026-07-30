import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { gameId, score } = await req.json();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO completions (child_id, points, source) VALUES (?, ?, ?)',
    args: [user.id, Math.max(0, Number(score) || 0), String(gameId)],
  });
  const points = await getChildPoints(user.id);
  return NextResponse.json({ ok: true, points, message: `游戏完成，获得 ${score} 积分！` });
}
