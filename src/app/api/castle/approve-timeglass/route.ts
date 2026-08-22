import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { restoreDay } from '@/lib/castle';

/**
 * 家长审批时光沙漏申请。
 *
 * 行为变化（2026-08-22 优化）：
 *   - 带日期的申请（"⏳ 申请时光沙漏（补 08-18日）"）：批准时直接调用 restoreDay
 *     补该日打卡，无需再给沙漏让孩子自己用
 *   - 无日期的旧申请（"⏳ 申请时光沙漏"）：兼容旧逻辑，发给 1 个沙漏
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
    sql: "SELECT id, child_id, text, status FROM wishes WHERE id = ? AND child_id = ? AND text LIKE '⏳%'",
    args: [wishId, childId],
  });
  if (!wish.rows.length) {
    return NextResponse.json({ error: '申请不存在或已处理' }, { status: 404 });
  }
  if (String(wish.rows[0].status) !== 'pending') {
    return NextResponse.json({ error: '该申请已被处理过了' }, { status: 400 });
  }

  const wishText = String(wish.rows[0].text);
  // 提取补打卡日期：格式 "⏳ 申请时光沙漏（补 08-18日）"
  const dayMatch = wishText.match(/补\s*(\d{2})-(\d{2})日/);
  const day = dayMatch
    ? `${new Date().getFullYear()}-${dayMatch[1]}-${dayMatch[2]}`
    : null;

  if (action === 'approve') {
    if (day) {
      // 新逻辑：直接补打卡，无需库存
      const result = await restoreDay(childId, day);
      if (!result.ok) {
        return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
      }
      const dayLabel = day.slice(5).replace('-', '月') + '月' + day.slice(8) + '日';
      const subjectMsg = result.restored.length > 0 ? `，${dayLabel} ${result.restored.join('、')} 已补打卡` : '';
      const coinMsg = result.coinsReturned > 0 ? `，找回被藏星星币 ${result.coinsReturned} 颗` : '';
      await db.execute({
        sql: "UPDATE wishes SET status = 'fulfilled' WHERE id = ?",
        args: [wishId],
      });
      return NextResponse.json({
        ok: true,
        message: `✅ 已批准！${dayLabel} 补打卡成功${subjectMsg}${coinMsg}，连续天数已恢复！`,
      });
    } else {
      // 旧逻辑：发给 1 个时光沙漏
      await db.execute({
        sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
        args: [childId, 'timeglass'],
      });
      await db.execute({
        sql: "UPDATE wishes SET status = 'fulfilled' WHERE id = ?",
        args: [wishId],
      });
      await db.execute({
        sql: "INSERT INTO growth_events (child_id, day, type, emoji, title, desc) VALUES (?, date('now','localtime'), 'gift', '⏳', '爸爸妈妈批准了时光沙漏申请', '收到 1 个时光沙漏，快去补打卡吧！')",
        args: [childId],
      });
      return NextResponse.json({ ok: true, message: '已批准，时光沙漏已发放到孩子背包 ✅' });
    }
  } else {
    // 拒绝
    await db.execute({
      sql: "UPDATE wishes SET status = 'rejected' WHERE id = ?",
      args: [wishId],
    });
    return NextResponse.json({ ok: true, message: '已拒绝该申请' });
  }
}
