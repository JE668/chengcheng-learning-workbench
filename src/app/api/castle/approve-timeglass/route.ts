import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db';

/**
 * 家长审批时光沙漏申请。
 * 批准后：1) 更新 wish 状态为 fulfilled；2) 向孩子背包发放 1 个时光沙漏。
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  const { wishId, action } = await req.json();
  if (!wishId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  const db = getDb();

  // 越权防护：只能操作自己孩子的沙漏申请（支持带日期的新格式）
  const wish = await db.execute({
    sql: "SELECT id, child_id, status FROM wishes WHERE id = ? AND child_id = ? AND text LIKE '⏳%'",
    args: [wishId, childId],
  });
  if (!wish.rows.length) {
    return NextResponse.json({ error: '申请不存在或已处理' }, { status: 404 });
  }
  if (String(wish.rows[0].status) !== 'pending') {
    return NextResponse.json({ error: '该申请已被处理过了' }, { status: 400 });
  }

  if (action === 'approve') {
    // 批准：发放时光沙漏到孩子背包
    await db.execute({
      sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
      args: [childId, 'timeglass'],
    });
    await db.execute({
      sql: "UPDATE wishes SET status = 'fulfilled' WHERE id = ?",
      args: [wishId],
    });
    // 记录成长事件
    await db.execute({
      sql: "INSERT INTO growth_events (child_id, day, type, emoji, title, desc) VALUES (?, date('now','localtime'), 'gift', '⏳', '爸爸妈妈批准了时光沙漏申请', '收到 1 个时光沙漏，快去补打卡吧！')",
      args: [childId],
    });
    return NextResponse.json({ ok: true, message: '已批准，时光沙漏已发放到孩子背包 ✅' });
  } else {
    // 拒绝
    await db.execute({
      sql: "UPDATE wishes SET status = 'rejected' WHERE id = ?",
      args: [wishId],
    });
    return NextResponse.json({ ok: true, message: '已拒绝该申请' });
  }
}
