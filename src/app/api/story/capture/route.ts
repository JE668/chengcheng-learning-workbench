import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logGrowthEvent } from '@/lib/castle';
import { storyChapters, getChapter, getChapterIndex, resolveChapterMokoKey } from '@/lib/story';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { chapterId } = await req.json();
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });

  const idx = getChapterIndex(chapterId);
  const db = getDb();

  // 顺序解锁：第一集直接可捕捉；其余需上一集已捕捉
  if (idx > 0) {
    const prev = await db.execute({
      sql: 'SELECT 1 FROM story_progress WHERE child_id = ? AND chapter_id = ?',
      args: [user.id, storyChapters[idx - 1].id],
    });
    if (prev.rows.length === 0) {
      return NextResponse.json({ error: '请先捕捉上一集的萌可哦', ok: false }, { status: 409 });
    }
  }

  const mokoKey = chapter.mokoKey ?? resolveChapterMokoKey(chapter.mokoName);
  if (!mokoKey) return NextResponse.json({ error: '萌可数据缺失' }, { status: 500 });

  // 记录剧情进度（幂等）
  await db.execute({
    sql: `INSERT OR IGNORE INTO story_progress (child_id, chapter_id) VALUES (?, ?)`,
    args: [user.id, chapterId],
  });

  // 把萌可入驻城堡（moko_owned），与图鉴/城堡联动
  await db.execute({
    sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
          VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
          ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
    args: [user.id, mokoKey],
  });

  await logGrowthEvent(
    user.id,
    'story_capture',
    chapter.emoji,
    `捕捉到${chapter.mokoName}！`,
    `跟随剧情《${chapter.title}》把${chapter.mokoName}接回了城堡`,
  );

  return NextResponse.json({ ok: true, mokoName: chapter.mokoName, chapterId });
}
