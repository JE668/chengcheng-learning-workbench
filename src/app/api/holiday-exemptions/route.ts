import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

/**
 * 节假日豁免管理（家长专用，迁移 v20）：
 * GET    列出全部豁免日（day 升序）
 * POST   添加豁免日 { day: 'YYYY-MM-DD', note? }（幂等：已存在则更新备注）
 * DELETE ?day= 移除豁免日
 *
 * 豁免的语义：settleCastle 结算时整天跳过——不加惩罚、不加连胜、不消耗冰冻。
 * 只对未来结算生效；已结算过的历史日补豁免不会追溯修改（游标单向推进）。
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const db = getDb();
  const rows = await db.execute({
    sql: 'SELECT day, note, created_at FROM holiday_exemptions ORDER BY day ASC',
    args: [],
  });
  return NextResponse.json({
    exemptions: rows.rows.map((r) => ({
      day: String(r.day),
      note: r.note == null ? '' : String(r.note),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { day, note } = await safeJson(req, {});
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: '日期格式不正确（需要 YYYY-MM-DD）' }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO holiday_exemptions (day, note) VALUES (?, ?)
          ON CONFLICT(day) DO UPDATE SET note = excluded.note`,
    args: [day, typeof note === 'string' ? note.slice(0, 60) : ''],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const day = req.nextUrl.searchParams.get('day');
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: '日期格式不正确' }, { status: 400 });
  }
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM holiday_exemptions WHERE day = ?', args: [day] });
  return NextResponse.json({ ok: true });
}
