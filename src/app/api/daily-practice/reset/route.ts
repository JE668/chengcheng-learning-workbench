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
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const db = getDb();
  const today = dateStr();

  // 检查时光沙漏
  const inv = await db.execute({
    sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
    args: [user.id, 'timeglass'],
  });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) {
    return NextResponse.json({ ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' }, { status: 400 });
  }

  // 检查今天是否已完成
  const row = await db.execute({
    sql: 'SELECT completed FROM daily_practice WHERE child_id = ? AND day = ?',
    args: [user.id, today],
  });
  if (!row.rows.length || Number(row.rows[0].completed) !== 1) {
    return NextResponse.json({ ok: false, message: '今天还没做完一练呢，先去做完吧～' }, { status: 400 });
  }

  // 扣沙漏
  await db.execute({
    sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?',
    args: [user.id, 'timeglass'],
  });

  // 重新生成题目，重置 completed=0
  const qs = await generateQuestions(user.id);
  await db.execute({
    sql: 'UPDATE daily_practice SET completed = 0, correct = 0, total = ?, questions = ? WHERE child_id = ? AND day = ?',
    args: [qs.length, JSON.stringify(qs), user.id, today],
  });

  return NextResponse.json({ ok: true, message: '⏳ 时光沙漏生效！今天可以再做一次每日一练啦～' });
}
