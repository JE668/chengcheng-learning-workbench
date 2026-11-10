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
  } catch {
    /* 忽略解析错误 */
  }

  // 构建申请文本：带日期的更明确，家长能直接看到要补哪一天
  const wishText = day
    ? `⏳ 申请时光沙漏（补 ${day.slice(5).replace('-', '月')}日）`
    : '⏳ 申请时光沙漏';

  // 检查是否已有待审批的沙漏申请（同一天避免重复）。
  //
  // ⚠️ 2026-11-10 第三轮审查：原来只按「完全相同的文本」去重——孩子可以对 30 个
  // 不同日期各发一条 pending（每条文本都不同），把家长审批列表灌满。沙漏是
  // 「家长逐条审批」的异步流程，同一孩子同时只应有一件待审批的沙漏申请，
  // 所以改为按前缀查「任意 pending 沙漏申请」。
  const existing = await db.execute({
    sql: "SELECT id, text FROM wishes WHERE child_id = ? AND text LIKE '⏳%' AND status = 'pending'",
    args: [user.id],
  });
  if (existing.rows.length > 0) {
    // 申请的日期与已有 pending 相同 → 视为重复；不同日期 → 请家长先处理完手头这条
    const prevText = String(existing.rows[0].text);
    const sameDay = day && prevText === wishText;
    return NextResponse.json({
      ok: true,
      message: sameDay
        ? `这一天已经申请过了，等爸爸妈妈审批吧～`
        : '你已经有一条等待审批的沙漏申请啦，等爸爸妈妈处理完再申请新的吧～',
    });
  }

  await db.execute({
    sql: 'INSERT INTO wishes (child_id, text, status) VALUES (?, ?, ?)',
    args: [user.id, wishText, 'pending'],
  });

  // 家长推送：申请已写库，通知是锦上添花——失败不影响响应（内部已兜底）。
  // 沙漏是「异步等审批」的典型场景：家长不看板就不知道孩子申请了。
  import('@/lib/push-notifications').then(({ notifyChildSubscribers }) =>
    notifyChildSubscribers(user.id, {
      title: '⏳ 时光沙漏申请',
      body: `${user.displayName}申请了时光沙漏${day ? `（补 ${day.slice(5).replace('-', '月')}日）` : ''}，去审批一下吧`,
      data: { type: 'timeglass-request', childId: user.id, day },
    })
  );

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
