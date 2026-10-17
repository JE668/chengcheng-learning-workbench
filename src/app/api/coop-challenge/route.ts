import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { dateStr } from '@/lib/date';
import { getTodayChallengeView } from '@/lib/coop-challenge';

export const dynamic = 'force-dynamic';

/**
 * 每日组队挑战（家长发起）：
 * GET  → 今日挑战 + 每个孩子的完成态（无挑战返回 null）
 * POST → 发起 { moduleKey, moduleLabel }。一天一条：已存在则 409（想换模块先等明天，
 *        或 DELETE 后重发——刻意保持简单，不给「改来改去」的口子）。
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  // 孩子/家长都可看（孩子端 co-op 页展示自己的完成态）
  const parentId = user.role === 'parent' ? user.id : null;
  let view = null;
  if (parentId) {
    view = await getTodayChallengeView(parentId);
  } else {
    // 孩子视角：从自己的 parent_id 反查
    const db = getDb();
    const p = await db.execute({
      sql: 'SELECT parent_id FROM users WHERE id = ?',
      args: [user.id],
    });
    const pid = Number(p.rows[0]?.parent_id ?? 0);
    if (pid) view = await getTodayChallengeView(pid);
  }
  return NextResponse.json({ challenge: view });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { moduleKey, moduleLabel } = await safeJson(req, {});
  if (typeof moduleKey !== 'string' || !moduleKey.trim()) {
    return NextResponse.json({ error: '请选择一个模块' }, { status: 400 });
  }
  const db = getDb();
  const day = dateStr();
  // 一日一条：已存在直接拒绝
  const existing = await db.execute({
    sql: 'SELECT 1 FROM coop_challenges WHERE day = ?',
    args: [day],
  });
  if (existing.rows.length) {
    return NextResponse.json({ error: '今天的挑战已经发过啦，明天再来新的～' }, { status: 409 });
  }
  await db.execute({
    sql: 'INSERT INTO coop_challenges (day, module_key, module_label, created_by) VALUES (?, ?, ?, ?)',
    args: [day, moduleKey.trim(), String(moduleLabel ?? moduleKey).slice(0, 30), user.id],
  });
  const view = await getTodayChallengeView(user.id);
  return NextResponse.json({ ok: true, challenge: view });
}
