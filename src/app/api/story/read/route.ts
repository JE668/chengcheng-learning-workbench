import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import { getChapter } from '@/lib/story';

/** 标记某一集剧情已读完（捕捉萌可前必须先读完故事） */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { chapterId } = await safeJson(req, {});
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });

  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO story_read (child_id, chapter_id) VALUES (?, ?)`,
    args: [user.id, chapterId],
  });

  return NextResponse.json({ ok: true, chapterId });
}
