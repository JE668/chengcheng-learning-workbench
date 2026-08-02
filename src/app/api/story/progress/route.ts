import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storyChapters, getChapterIndex } from '@/lib/story';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT chapter_id FROM story_progress WHERE child_id = ?',
    args: [user.id],
  });
  const captured = res.rows.map((r) => String(r.chapter_id));
  // 当前可解锁的章节 = 第一集，或上一集已捕捉的下一集
  let nextIndex = 0;
  while (nextIndex < storyChapters.length && captured.includes(storyChapters[nextIndex].id)) {
    nextIndex++;
  }
  // 捕捉券余额（剧情解锁下一集需消耗）
  const tk = await db.execute({
    sql: 'SELECT COALESCE(total,0) AS total, COALESCE(used,0) AS used FROM capture_tickets WHERE child_id = ?',
    args: [user.id],
  });
  const tickets = tk.rows.length ? Number(tk.rows[0].total) - Number(tk.rows[0].used) : 0;
  return NextResponse.json({
    captured,
    nextIndex,
    total: storyChapters.length,
    allDone: nextIndex >= storyChapters.length,
    tickets,
  });
}
