import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getDb } from '@/lib/db-core';
import { ALGORITHM_GENERATORS, genPracticeSet } from '@/lib/algorithm/generators';

/** 关卡取值范围：与 [topicId]/client.tsx 的「10 个关卡」一致。 */
const MAX_ALGORITHM_LEVEL = 10;
/** 单条错题 ID 的最大长度（生成器产出的 ID 远短于此）。 */
const MAX_MISTAKE_ID_LEN = 64;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/algorithm-progress
 * 获取孩子的算法练习进度（按主题分组）
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const db = getDb();
  const res = await db.execute({
    sql: `SELECT topic_id, level, correct_count, total_count, best_stars, completed_at
          FROM algorithm_progress
          WHERE child_id = ?
          ORDER BY topic_id, level`,
    args: [childId],
  });

  // 按主题分组
  const byTopic: Record<string, Array<{
    level: number;
    correctCount: number;
    totalCount: number;
    bestStars: number;
    completedAt: string | null;
  }>> = {};

  for (const row of res.rows) {
    const topicId = String(row.topic_id);
    if (!byTopic[topicId]) byTopic[topicId] = [];
    byTopic[topicId].push({
      level: Number(row.level),
      correctCount: Number(row.correct_count),
      totalCount: Number(row.total_count),
      bestStars: Number(row.best_stars),
      completedAt: row.completed_at ? String(row.completed_at) : null,
    });
  }

  return NextResponse.json({ progress: byTopic });
}

/**
 * POST /api/algorithm-progress
 * 保存/更新关卡进度（包含错题记录）
 * Body: { topicId, level, correctCount, totalCount, mistakes: string[] }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  let body: {
    topicId?: string;
    level?: number;
    correctCount?: number;
    totalCount?: number;
    mistakes?: string[];
  };
  try {
    body = await safeJson(req, {});
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const { topicId, level, correctCount, mistakes } = body;
  if (!topicId || level === undefined || correctCount === undefined) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  // ---- 服务端校验：以下数值全部由客户端提供，必须逐项约束，否则可伪造星级 ----
  if (typeof topicId !== 'string' || !ALGORITHM_GENERATORS[topicId]) {
    return NextResponse.json({ error: '未知的算法主题' }, { status: 400 });
  }
  if (!Number.isInteger(level) || level < 1 || level > MAX_ALGORITHM_LEVEL) {
    return NextResponse.json({ error: '无效的关卡' }, { status: 400 });
  }
  const lv = level;

  // 题量以服务端生成的关卡题目为准，客户端上报的 totalCount 不参与星级计算。
  // 原实现直接用客户端的 totalCount，报 0 会让 ratio 变成 Infinity 从而直接拿 3 星。
  const expectedTotal = Math.max(genPracticeSet(topicId, lv).length, 1);

  const clientCorrect = Math.floor(Number(correctCount));
  if (!Number.isFinite(clientCorrect) || clientCorrect < 0) {
    return NextResponse.json({ error: '无效的答对题数' }, { status: 400 });
  }

  const mistakeIds = (
    Array.isArray(mistakes) ? mistakes : []
  ).filter(
    (m): m is string => typeof m === 'string' && m.length > 0 && m.length <= MAX_MISTAKE_ID_LEN
  );
  // 错题数不可能超过总题量；同时限制单次请求的写库条数，避免写放大。
  const cappedMistakes = mistakeIds.slice(0, expectedTotal);

  // 答对数不能超过「总题量 − 错题数」。取两者较小值：正常提交完全不受影响
  // （客户端保证 correct + mistakes 条数等于总题量），但伪造的 correctCount=999 会被压回。
  const effectiveCorrect = Math.min(
    clientCorrect,
    Math.max(expectedTotal - cappedMistakes.length, 0)
  );

  const db = getDb();

  // 计算星级：3⭐ ≥90% | 2⭐ ≥70% | 1⭐ ≥50% | 0 <50%
  const ratio = effectiveCorrect / expectedTotal;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;

  // 更新进度（UPSERT）
  await db.execute({
    sql: `INSERT INTO algorithm_progress (child_id, topic_id, level, correct_count, total_count, best_stars, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(child_id, topic_id, level) DO UPDATE SET
            correct_count = CASE WHEN excluded.correct_count > algorithm_progress.correct_count THEN excluded.correct_count ELSE algorithm_progress.correct_count END,
            best_stars = CASE WHEN excluded.best_stars > algorithm_progress.best_stars THEN excluded.best_stars ELSE algorithm_progress.best_stars END,
            completed_at = CURRENT_TIMESTAMP`,
    args: [childId, topicId, lv, effectiveCorrect, expectedTotal, stars, stars],
  });

  // 记录错题（答错的题）
  for (const qid of cappedMistakes) {
    await db.execute({
      sql: `INSERT INTO algorithm_mistakes (child_id, topic_id, level, question_id, wrong_count, last_wrong_at)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(child_id, topic_id, level, question_id) DO UPDATE SET
              wrong_count = wrong_count + 1,
              last_wrong_at = CURRENT_TIMESTAMP,
              is_mastered = 0`,
      args: [childId, topicId, lv, qid],
    });
  }

  // 标记已掌握：本关中之前有错题记录、但这次答对的题
  // 查询本关卡所有有错题记录的 question_id
  const prevMistakes = await db.execute({
    sql: `SELECT question_id FROM algorithm_mistakes WHERE child_id = ? AND topic_id = ? AND level = ?`,
    args: [childId, topicId, lv],
  });
  const prevIds = prevMistakes.rows.map((r) => String(r.question_id));
  // 找出不在这次 mistakes 中的（即答对的）
  const nowCorrect = prevIds.filter((id) => !cappedMistakes.includes(id));
  if (nowCorrect.length > 0) {
    await db.execute({
      sql: `UPDATE algorithm_mistakes
            SET is_mastered = 1, wrong_count = 0
            WHERE child_id = ? AND topic_id = ? AND level = ?
            AND question_id IN (${nowCorrect.map(() => '?').join(',')})`,
      args: [childId, topicId, lv, ...nowCorrect],
    });
  }

  return NextResponse.json({ stars, correctCount: effectiveCorrect, totalCount: expectedTotal });
}
