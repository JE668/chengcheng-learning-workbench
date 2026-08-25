import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import { logGrowthEvent } from '@/lib/castle';
import { POINTS_PER_CAPTURE } from '@/lib/economy';
import { storyChapters, getChapter, getChapterIndex, resolveChapterMokoKey } from '@/lib/story';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  const { chapterId } = await safeJson(req, {});
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: 'chapter not found' }, { status: 404 });

  const idx = getChapterIndex(chapterId);
  const db = getDb();

  // Pre-checks (read-only, can be concurrent)
  // Must read story first
  const rd = await db.execute({
    sql: 'SELECT 1 FROM story_read WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (rd.rows.length === 0) {
    return NextResponse.json({
      ok: false, code: 'not_read',
      error: 'Please read the story first before capturing!'
    }, { status: 409 });
  }

  // Must answer quiz
  const qz = await db.execute({
    sql: 'SELECT 1 FROM story_quiz WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (qz.rows.length === 0) {
    return NextResponse.json({
      ok: false, code: 'not_quiz',
      error: 'Please answer the quiz first!'
    }, { status: 409 });
  }

  // Sequential unlock check
  if (idx > 0) {
    const prev = await db.execute({
      sql: 'SELECT 1 FROM story_progress WHERE child_id = ? AND chapter_id = ?',
      args: [user.id, storyChapters[idx - 1].id],
    });
    if (prev.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Please capture previous chapter first' }, { status: 409 });
    }
  }

  const mokoKey = chapter.mokoKey ?? resolveChapterMokoKey(chapter.mokoName);
  if (!mokoKey) return NextResponse.json({ error: 'moko data missing' }, { status: 500 });

  // Atomic idempotent capture (transaction)
  await db.execute('BEGIN IMMEDIATE');
  try {
    // 1) Record progress (unique constraint child_id + chapter_id)
    const progressResult = await db.execute({
      sql: `INSERT OR IGNORE INTO story_progress (child_id, chapter_id) VALUES (?, ?)`,
      args: [user.id, chapterId],
    });
    const isNewCapture = Number(progressResult.rowsAffected ?? 0) > 0;
    if (!isNewCapture) {
      await db.execute('COMMIT');
      return NextResponse.json({ ok: false, code: 'already', error: 'Already captured!' }, { status: 409 });
    }

    // 2) Consume capture ticket for chapters after first
    if (idx > 0) {
      await db.execute({
        sql: `INSERT INTO capture_tickets (child_id, total, used) VALUES (?, 0, 0)
              ON CONFLICT(child_id) DO NOTHING`,
        args: [user.id],
      });
      const dec = await db.execute({
        sql: 'UPDATE capture_tickets SET used = used + 1 WHERE child_id = ? AND used < total',
        args: [user.id],
      });
      if (Number(dec.rowsAffected ?? 0) === 0) {
        await db.execute('ROLLBACK');
        return NextResponse.json({
          ok: false, code: 'no_ticket',
          error: 'Need capture ticket! Do practice to earn tickets.'
        }, { status: 409 });
      }
    }

    // 3) Moko moves into castle
    await db.execute({
      sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
            VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
            ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
      args: [user.id, mokoKey],
    });

    // 4) Growth log
    await logGrowthEvent(
      user.id, 'story_capture', chapter.emoji,
      `Captured ${chapter.mokoName}!`,
      `Followed story "${chapter.title}" to bring ${chapter.mokoName} home.`,
    );

    // 5) Capture points (only for new captures)
    await db.execute({
      sql: 'INSERT INTO completions (child_id, points, source) VALUES (?, ?, ?)',
      args: [user.id, POINTS_PER_CAPTURE, `story:${chapterId}`]
    });

    await db.execute('COMMIT');
    return NextResponse.json({ ok: true, mokoName: chapter.mokoName, chapterId });
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }
}