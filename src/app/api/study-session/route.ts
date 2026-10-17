import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, withWriteLock } from '@/lib/db';
import { dateStr } from '@/lib/date';
import { safeJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

/**
 * 学习时长心跳（2026-10-17）：孩子端 layout 每分钟 POST 一次（页面在前台），
 * 服务端把 (child_id, today) 的分钟数 +1。页面切到后台/关掉时心跳自然停止
 * ——「前台可见分钟数」就是家长想知道的「今天学了多久」。
 *
 * 防灌水：单日上限 600 分钟（10 小时，远超儿童正常使用），到顶不再累加。
 * 失败静默：时长统计是锦上添花，绝不影响孩子端任何功能。
 */
const MAX_MINUTES_PER_DAY = 600;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child')
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  let minutes = 1;
  try {
    const body = await safeJson(req, {});
    const n = Number(body?.minutes);
    if (Number.isFinite(n) && n >= 1 && n <= 5) minutes = Math.floor(n);
  } catch {
    /* 默认 1 分钟 */
  }
  const db = getDb();
  const day = dateStr();
  try {
    await withWriteLock(async () => {
      await db.execute({
        sql: `INSERT INTO study_sessions (child_id, day, minutes, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(child_id, day) DO UPDATE SET
                minutes = MIN(minutes + ?, ${MAX_MINUTES_PER_DAY}),
                updated_at = CURRENT_TIMESTAMP`,
        args: [user.id, day, minutes, minutes],
      });
    });
  } catch {
    /* 旧库未跑迁移（study_sessions 不存在）——静默，不打断心跳方 */
  }
  return NextResponse.json({ ok: true });
}
