import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints, getChildId, withWriteLock } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDb();
  let rows;
  if (user.role === 'parent') {
    const childId = await getChildId(user);
    rows = await db.execute({
      sql: `SELECT r.*, u.display_name as child_name FROM redemptions r JOIN users u ON r.child_id = u.id WHERE r.child_id = ? ORDER BY r.created_at DESC`,
      args: [childId ?? -1],
    });
  } else {
    rows = await db.execute({
      sql: 'SELECT * FROM redemptions WHERE child_id = ? ORDER BY created_at DESC',
      args: [user.id],
    });
  }
  return NextResponse.json({ redemptions: rows.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'child' && user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });

  // 兑换会真实扣积分（余额由下方 withWriteLock 内的检查保证不透支），
  // 但**没有次数上限**。剧本可高频兑换，撑爆家长端的兑换记录列表，
  // 也会让「积分流水」变成噪声。与 castle/grant 同一档位。
  const limit = rateLimit(`redeem:${user.id}`, { windowSeconds: 60, maxRequests: 10 });
  if (!limit.ok) {
    return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  let rewardName: unknown;
  let cost: unknown;
  try {
    const body = await safeJson(req, {});
    rewardName = body?.rewardName;
    cost = body?.cost;
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  const numCost = Number(cost);
  if (!rewardName || typeof rewardName !== 'string' || !rewardName.trim()) {
    return NextResponse.json({ error: '请输入奖励名称' }, { status: 400 });
  }
  if (!Number.isInteger(numCost) || numCost <= 0) {
    return NextResponse.json({ error: '消耗积分必须为正整数' }, { status: 400 });
  }

  const db = getDb();
  // 孩子本人 → 自己；家长 → 选中的孩子（多娃隔离，避免直接信任客户端 childId）。
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  // 读余额 + 写入兑换必须在同一把写锁内，否则两个并发兑换都能通过余额检查导致透支。
  //
  // ⚠️ 写锁只解决**并发**，不解决**崩溃**：此前这里只有锁、没有事务，
  // 若进程在「读余额」与「写兑换记录」之间被杀/重启，余额检查与落库就不一致。
  // 这里补 BEGIN IMMEDIATE/COMMIT（与 castle.confirm / castle.buy 同一套做法）。
  return withWriteLock(async () => {
    await db.execute('BEGIN IMMEDIATE');
    try {
      const points = await getChildPoints(childId);
      if (points < numCost) {
        await db.execute('ROLLBACK');
        return NextResponse.json({ error: '积分不够' }, { status: 400 });
      }

      await db.execute({
        sql: 'INSERT INTO redemptions (child_id, reward_name, cost, created_by) VALUES (?, ?, ?, ?)',
        args: [childId, rewardName.trim(), numCost, user.id],
      });
      await db.execute('COMMIT');
      return NextResponse.json({ ok: true });
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const { id, status } = await safeJson(req, {});

  // ⚠️ status 必须白名单校验。原先直接拼进 SQL，可写入任意字符串：
  //   · 传 'approved' 能凭空批准申请；
  //   · 传任意非法值（如 'xxx'）会让这笔兑换**从余额扣减中消失** ——
  //     getChildPoints 只统计 status IN ('pending','approved')（lib/users.ts），
  //     写入别的值等于凭空退还积分，可反复套现。
  // 口径与姊妹路由 wishes / parent-cert-request 保持一致。
  const REDEMPTION_STATUSES = ['pending', 'approved', 'rejected'] as const;
  if (typeof status !== 'string' || !REDEMPTION_STATUSES.includes(status as never)) {
    return NextResponse.json(
      { error: `状态必须是 ${REDEMPTION_STATUSES.join(' / ')} 之一` },
      { status: 400 }
    );
  }
  const redemptionId = Number(id);
  if (!Number.isInteger(redemptionId) || redemptionId <= 0) {
    return NextResponse.json({ error: '无效的兑换记录 id' }, { status: 400 });
  }

  const db = getDb();
  // 越权防护：只能审批自己孩子的兑换申请（按 child_id 收敛，而非任意 id）
  const res = await db.execute({
    sql: 'UPDATE redemptions SET status = ? WHERE id = ? AND child_id = ?',
    args: [status, redemptionId, childId],
  });
  if (Number(res.rowsAffected ?? 0) === 0)
    return NextResponse.json({ error: '无权限或记录不存在' }, { status: 403 });
  return NextResponse.json({ ok: true });
}
