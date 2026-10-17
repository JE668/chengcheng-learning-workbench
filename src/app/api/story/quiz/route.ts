import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getChapter, getChapterQuiz } from '@/lib/story';

export const dynamic = 'force-dynamic';

/**
 * GET ?chapterId=：按当前孩子取该章节的题目（多娃差异化，2026-10-17）。
 * 远征章节（自动出题）的种子混入了 childId——每个孩子各出一版，
 * 二宝没法照抄大宝背好的答案。主线章节全局同题。
 * ⚠️ 客户端展示与 POST 验证必须同源走 getChapterQuiz，否则答案对不上。
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const chapterId = req.nextUrl.searchParams.get('chapterId');
  if (!chapterId) return NextResponse.json({ error: '缺少 chapterId' }, { status: 400 });
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });
  const quiz = getChapterQuiz(chapterId, childId);
  if (!quiz) return NextResponse.json({ error: '该章节没有题目' }, { status: 404 });
  // ⚠️ 只回题目与选项，绝不回 answer——答案只存在于 POST 验证路径
  return NextResponse.json({ chapterId, q: quiz.q, options: quiz.options, type: quiz.type ?? null });
}

/** 提交剧情小问题答案：答对则记录「已答对」，解锁捕捉；答错温柔鼓励重试 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { chapterId, answer } = await safeJson(req, {});
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });

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

  // 多娃差异化：题目按 childId 生成，验证也必须同源——
  // 用全局 chapter.quiz 会验证错题（孩子看到的是「自己的」题）。
  const quiz = getChapterQuiz(chapterId, user.id);
  if (!quiz) return NextResponse.json({ error: '章节或题目不存在' }, { status: 404 });

  const correct = Number(answer) === quiz.answer;
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
