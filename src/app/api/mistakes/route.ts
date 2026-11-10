import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getChildId, getDb, withWriteLock } from '@/lib/db';
import { dateStr, addDays } from '@/lib/date';

// 本地日统一走 lib/date.ts（此前这里手写 localDate 副本，正是历史时区 bug 的温床）。

// 取当前孩子待复习 + 未解决总数。
// ?count=1（2026-11-10 第三轮审查）：徽标等轻量消费方只需要「今天要复习几个」，
// 完整响应会把全部 due 行（含 answer/wrong 等列）拉给客户端，孩子每天首屏
// 白传几 KB～几十 KB JSON。count 模式只回 COUNT，两个数字一条 SQL。
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = user.role === 'child' ? user.id : await getChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const db = getDb();
  if (req.nextUrl.searchParams.get('count')) {
    const dueCount = await db.execute({
      sql: 'SELECT COUNT(*) as n FROM mistakes WHERE child_id = ? AND resolved = 0 AND next_review <= ?',
      args: [childId, dateStr()],
    });
    return NextResponse.json({ dueCount: Number(dueCount.rows[0]?.n ?? 0) });
  }
  const due = await db.execute({
    sql: 'SELECT * FROM mistakes WHERE child_id = ? AND resolved = 0 AND next_review <= ? ORDER BY next_review',
    args: [childId, dateStr()],
  });
  const total = await db.execute({
    sql: 'SELECT COUNT(*) as n FROM mistakes WHERE child_id = ? AND resolved = 0',
    args: [childId],
  });
  return NextResponse.json({ due: due.rows, total: Number(total.rows[0]?.n ?? 0) });
}

// 记录一次错题 / 错词（孩子端）
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '只有孩子可以记录' }, { status: 403 });
  const body = await safeJson(req, {});
  const { subject, kind, prompt, answer, wrong, source_module, chapter, error_type } = body as {
    subject?: string;
    kind?: string;
    prompt?: string;
    answer?: string;
    wrong?: string;
    source_module?: string;
    chapter?: string;
    error_type?: string;
  };
  if (!subject || !prompt || answer === undefined) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 });
  }
  const db = getDb();
  // 同一道题若已存在未解决记录，则刷新为「明天再复习」并重置间隔。
  //
  // ⚠️ 「先 SELECT 再 INSERT/UPDATE」在并发下会重复插入：孩子连点两次提交同一道错题
  // （或前端重试、多标签页），两个请求都查到「没有未解决记录」，于是各插一条 ——
  // 复习列表里同一道题出现两次。本仓其他地方已经改用原子写法
  // （progress-store.ts:82 的 UPSERT、castle.ts:73 的 ON CONFLICT DO NOTHING），
  // 这里用 withWriteLock + BEGIN IMMEDIATE 把「查 + 写」收成一段临界区。
  //
  // 注：resolved 参与查询条件，无法直接建 UNIQUE(child_id,subject,prompt,answer)
  // 约束（会挡住「复习完又错、应当新开一条」的场景），所以用事务串行化。
  return withWriteLock(async () => {
    await db.execute('BEGIN IMMEDIATE');
    try {
      const exist = await db.execute({
        sql: 'SELECT id FROM mistakes WHERE child_id = ? AND subject = ? AND prompt = ? AND answer = ? AND resolved = 0 LIMIT 1',
        args: [user.id, subject, prompt, String(answer)],
      });
      if (exist.rows.length) {
        await db.execute({
          sql: 'UPDATE mistakes SET wrong = ?, next_review = ?, interval_days = 1, reps = 0, source_module = ?, chapter = ?, error_type = COALESCE(?, error_type) WHERE id = ?',
          args: [
            wrong ?? null,
            addDays(dateStr(), 1),
            source_module ?? null,
            chapter ?? null,
            error_type ?? null,
            Number(exist.rows[0].id),
          ],
        });
      } else {
        await db.execute({
          sql: 'INSERT INTO mistakes (child_id, subject, kind, prompt, answer, wrong, source_module, chapter, error_type, next_review, interval_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          args: [
            user.id,
            subject,
            kind || '',
            prompt,
            String(answer),
            wrong ?? null,
            source_module ?? null,
            chapter ?? null,
            error_type ?? null,
            addDays(dateStr(), 1),
          ],
        });
      }
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
    return NextResponse.json({ ok: true });
  });
}
