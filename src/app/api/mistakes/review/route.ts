import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

function localDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 复习反馈：正确则按间隔重复推进（1→3→7→翻倍），错误则重置
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '只有孩子可以复习' }, { status: 403 });
  const { id, correct } = (await req.json()) as { id?: number; correct?: boolean };
  if (!id) return NextResponse.json({ error: '参数缺失' }, { status: 400 });
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM mistakes WHERE id = ? AND child_id = ?',
    args: [id, user.id],
  });
  if (!res.rows.length) return NextResponse.json({ error: '没找到这条记录' }, { status: 404 });
  const row = res.rows[0];
  const reps = Number(row.reps);
  if (correct) {
    const newReps = reps + 1;
    let interval = 1;
    if (newReps === 1) interval = 3;
    else if (newReps === 2) interval = 7;
    else interval = Math.min(30, (Number(row.interval_days) || 1) * 2);
    const resolved = newReps >= 4 ? 1 : 0;
    await db.execute({
      sql: 'UPDATE mistakes SET reps = ?, interval_days = ?, next_review = ?, resolved = ? WHERE id = ?',
      args: [newReps, interval, localDate(interval), resolved],
    });
  } else {
    await db.execute({
      sql: 'UPDATE mistakes SET reps = 0, interval_days = 1, next_review = ? WHERE id = ?',
      args: [localDate(1), id],
    });
  }
  return NextResponse.json({ ok: true });
}
