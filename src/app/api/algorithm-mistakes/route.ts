import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db-core';
import { ALGORITHM_TOPICS } from '@/lib/algorithm/topics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface MistakeItem {
  id: number;
  topicId: string;
  topicName: string;
  level: number;
  questionId: string;
  wrongCount: number;
  lastWrongAt: string;
  isMastered: boolean;
}

/**
 * GET /api/algorithm-mistakes
 * 获取孩子的错题列表
 * Query: ?topicId=&mastered=0|1|all
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const url = new URL(req.url);
  const topicFilter = url.searchParams.get('topicId');
  const masteredFilter = url.searchParams.get('mastered'); // '0', '1', or 'all'

  const db = getDb();
  let sql = `SELECT id, topic_id, level, question_id, wrong_count, last_wrong_at, is_mastered
             FROM algorithm_mistakes WHERE child_id = ?`;
  const args: (number | string | null)[] = [childId];

  if (topicFilter) {
    sql += ' AND topic_id = ?';
    args.push(topicFilter);
  }
  if (masteredFilter === '0') {
    sql += ' AND is_mastered = 0';
  } else if (masteredFilter === '1') {
    sql += ' AND is_mastered = 1';
  }

  sql += ' ORDER BY topic_id, level, id';

  const res = await db.execute({ sql, args });

  // 构建 topic 名称映射
  const topicMap = new Map(ALGORITHM_TOPICS.map((t) => [t.id, t.name]));

  const mistakes: MistakeItem[] = res.rows.map((row) => ({
    id: Number(row.id),
    topicId: String(row.topic_id),
    topicName: topicMap.get(String(row.topic_id)) ?? '未知',
    level: Number(row.level),
    questionId: String(row.question_id),
    wrongCount: Number(row.wrong_count),
    lastWrongAt: String(row.last_wrong_at),
    isMastered: Number(row.is_mastered) === 1,
  }));

  return NextResponse.json({ mistakes });
}

/**
 * POST /api/algorithm-mistakes
 * 批量标记错题状态
 * Body: { ids: number[], mastered: boolean }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  let body: { ids?: number[]; mastered?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: '缺少 ids' }, { status: 400 });
  }
  if (typeof body.mastered !== 'boolean') {
    return NextResponse.json({ error: '缺少 mastered' }, { status: 400 });
  }

  // 限制批量大小并做整数校验：未加限制时客户端可以传上万个 id，
  // 拼出超长 IN (...) 语句（超出 SQLite 变量上限会直接 500，也是写放大手段）。
  const MAX_BATCH = 200;
  const ids = body.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids 无效' }, { status: 400 });
  }
  const cappedIds = ids.slice(0, MAX_BATCH);

  const db = getDb();
  const placeholders = cappedIds.map(() => '?').join(',');
  const res = await db.execute({
    sql: `UPDATE algorithm_mistakes SET is_mastered = ?, wrong_count = CASE WHEN ? THEN 0 ELSE wrong_count END
          WHERE child_id = ? AND id IN (${placeholders})`,
    args: [body.mastered ? 1 : 0, body.mastered ? 1 : 0, childId, ...cappedIds],
  });

  // 返回真正被更新的条数，而不是客户端上报的个数
  return NextResponse.json({ updated: Number(res.rowsAffected ?? 0) });
}
