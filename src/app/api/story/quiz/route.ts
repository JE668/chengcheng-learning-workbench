import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import { getChapter } from '@/lib/story';

/** 提交剧情小问题答案：答对则记录「已答对」，解锁捕捉；答错温柔鼓励重试 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { chapterId, answer } = await safeJson(req, {});
  const chapter = getChapter(chapterId);
  if (!chapter || !chapter.quiz) return NextResponse.json({ error: '章节或题目不存在' }, { status: 404 });

  // 必须先读完故事，才能答题
  const db = getDb();
  const rd = await db.execute({
    sql: 'SELECT 1 FROM story_read WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (rd.rows.length === 0) {
    return NextResponse.json({
      ok: false,
      code: 'not_read',
      error: '先听完这一集的故事，再来回答问题哦～',
    }, { status: 409 });
  }

  const correct = Number(answer) === chapter.quiz.answer;
  if (!correct) {
    return NextResponse.json({
      ok: false,
      code: 'wrong',
      error: '再想想看，选另一个试试吧～', // 不剧透答案，鼓励孩子重试
    });
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO story_quiz (child_id, chapter_id) VALUES (?, ?)`,
    args: [user.id, chapterId],
  });

  return NextResponse.json({ ok: true, chapterId });
}
