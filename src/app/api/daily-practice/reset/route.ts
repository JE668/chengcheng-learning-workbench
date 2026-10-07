import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateQuestions } from '@/lib/daily-practice';
import { dateStr } from '@/lib/date';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 使用时光沙漏重置今天的每日一练（让孩子可以再做一次）。
 * 前提：孩子有时光沙漏（前端检查），当天已完成（completed=1）。
 * 重置：completed=0 + 重新生成题目 + 扣 1 个沙漏。
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '无权限' }, { status: 403 });

  const db = getDb();
  const today = dateStr();

  // 检查时光沙漏
  const inv = await db.execute({
    sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
    args: [user.id, 'timeglass'],
  });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) {
    return NextResponse.json(
      { ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' },
      { status: 400 }
    );
  }

  // 检查今天是否已完成
  const row = await db.execute({
    sql: 'SELECT completed FROM daily_practice WHERE child_id = ? AND day = ?',
    args: [user.id, today],
  });
  if (!row.rows.length || Number(row.rows[0].completed) !== 1) {
    return NextResponse.json(
      { ok: false, message: '今天还没做完一练呢，先去做完吧～' },
      { status: 400 }
    );
  }

  // 重新生成题目，重置 completed=0
  //
  // ⚠️ 扣沙漏与重置必须**原子**。原实现先扣沙漏、再调 generateQuestions()
  // 再 UPDATE，两步之间任何失败都会让孩子的沙漏白扣（实测：mock 让生成
  // 抛错，起始 1 个沙漏直接变 0，而重置并未成功）。
  //
  // 另外扣减语句原本缺少 `AND qty > 0`：上面的检查与扣减之间存在时间窗，
  // 并发请求（同一秒连点两次、或多标签页）会双双通过检查后各扣一次，
  // 把 qty 扣成负数（实测：起始 1，连扣 3 次得 -2）。负数 qty 会让后续
  // 所有 `qty > 0` 判断失效，等于凭空刷道具。
  //
  // 顺序：先生成题目（最可能失败且无副作用），再开事务做扣减+重置。
  const qs = await generateQuestions(user.id);

  await db.execute({ sql: 'BEGIN IMMEDIATE', args: [] });
  try {
    const deducted = await db.execute({
      // AND qty > 0 是并发下的**最后一道闸门**：让扣减本身成为原子操作，
      // 即使前面的检查已过时，也不会把 qty 扣成负数。
      sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ? AND qty > 0',
      args: [user.id, 'timeglass'],
    });
    if (Number(deducted.rowsAffected ?? 0) === 0) {
      await db.execute({ sql: 'ROLLBACK', args: [] });
      return NextResponse.json(
        { ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' },
        { status: 400 }
      );
    }

    await db.execute({
      sql: 'UPDATE daily_practice SET completed = 0, correct = 0, total = ?, questions = ? WHERE child_id = ? AND day = ?',
      args: [qs.length, JSON.stringify(qs), user.id, today],
    });
    await db.execute({ sql: 'COMMIT', args: [] });
  } catch (e) {
    // 失败必须回滚，否则沙漏已扣但题目没重置 —— 孩子白损失道具
    await db.execute({ sql: 'ROLLBACK', args: [] }).catch(() => {});
    throw e;
  }

  return NextResponse.json({ ok: true, message: '⏳ 时光沙漏生效！今天可以再做一次每日一练啦～' });
}
