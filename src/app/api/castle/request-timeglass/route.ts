import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db';

/**
 * 孩子发起时光沙漏申请（写入 wishes 表，供家长审批）。
 * 复用 wishes 表，text 以 ⏳ 前缀标记为沙漏申请。
 * 可选 day 参数：指定要补打卡的日期，如 "2026-08-18"。
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') {
    return NextResponse.json({ error: '只有孩子才能申请时光沙漏' }, { status: 403 });
  }
  const db = getDb();

  // 解析可选的 day 参数
  let day: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day)) {
      day = body.day;
    }
  } catch { /* 忽略解析错误 */ }

  // 构建申请文本：带日期的更明确，家长能直接看到要补哪一天
  const wishText = day ? `⏳ 申请时光沙漏（补 ${day.slice(5).replace('-', '月')}日）` : '⏳ 申请时光沙漏';

  // 检查是否已有待审批的沙漏申请（同一天避免重复）
  const existing = await db.execute({
    sql: "SELECT id FROM wishes WHERE child_id = ? AND text = ? AND status = 'pending'",
    args: [user.id, wishText],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json({ ok: true, message: day ? `这一天已经申请过了，等爸爸妈妈审批吧～` : '已经申请过了，等爸爸妈妈审批吧～' });
  }

  await db.execute({
    sql: 'INSERT INTO wishes (child_id, text, status) VALUES (?, ?, ?)',
    args: [user.id, wishText, 'pending'],
  });

  const msg = day
    ? `已向爸爸妈妈申请时光沙漏，补 ${day.slice(5).replace('-', '月')}日，等他们审批吧 ⏳`
    : '已向爸爸妈妈申请时光沙漏，等他们审批吧 ⏳';
  return NextResponse.json({ ok: true, message: msg });
}

/**
 * 家长查看待审批的时光沙漏申请。
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const db = getDb();
  const rows = await db.execute({
    sql: "SELECT id, child_id, text, created_at FROM wishes WHERE child_id = ? AND text LIKE '⏳%' AND status = 'pending' ORDER BY created_at DESC",
    args: [childId],
  });
  return NextResponse.json({
    requests: rows.rows.map((r) => ({
      id: Number(r.id),
      childId: Number(r.child_id),
      text: String(r.text),
      createdAt: String(r.created_at ?? ''),
    })),
  });
}
