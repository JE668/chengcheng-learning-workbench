import { NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getChildTasks, setChildTask, getModuleProgressAll } from '@/lib/progress-store';
import { getDb } from '@/lib/db-core';
import { MOKO_TASKS } from '@/lib/moko-tasks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 计算每条萌可小任务是否已「解锁完成按钮」：
 * 模块类看 module_progress 是否 ≥1 星，游戏类看 completions 里有没有该游戏的完成记录。
 */
async function computeUnlocked(childId: number): Promise<Record<string, boolean>> {
  const progress = await getModuleProgressAll(childId);
  const starred = new Set(
    progress.filter((p) => p.stars >= 1).map((p) => `${p.subject}:${p.moduleKey}`),
  );

  const gameIds = MOKO_TASKS.map((t) => t.req.game).filter((g): g is string => !!g);
  const playedGames = new Set<string>();
  if (gameIds.length) {
    const db = getDb();
    const placeholders = gameIds.map(() => '?').join(',');
    const res = await db.execute({
      sql: `SELECT DISTINCT source FROM completions WHERE child_id = ? AND source IN (${placeholders})`,
      args: [childId, ...gameIds],
    });
    res.rows.forEach((r) => playedGames.add(String(r.source)));
  }

  const unlocked: Record<string, boolean> = {};
  for (const t of MOKO_TASKS) {
    if (t.req.module) unlocked[t.key] = starred.has(`${t.req.module.subject}:${t.req.module.key}`);
    else if (t.req.game) unlocked[t.key] = playedGames.has(t.req.game);
    else unlocked[t.key] = true;
  }
  return unlocked;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
  const [done, unlocked] = await Promise.all([getChildTasks(childId), computeUnlocked(childId)]);
  return NextResponse.json({ done, unlocked });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const childId = await resolveChildId(user);
  if (!childId) return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });

  let body: { key?: string; done?: boolean };
  try {
    body = await safeJson(req, {});
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
  if (!body.key) return NextResponse.json({ error: '缺少 key' }, { status: 400 });
  // 白名单校验：key 必须属于已知萌可小任务，防止写入任意脏数据
  if (!MOKO_TASKS.some((t) => t.key === body.key)) {
    return NextResponse.json({ error: '未知任务' }, { status: 400 });
  }

  // 服务端二次校验：没达成学习凭证就不许标记完成（前端按钮禁用只是第一道防线）
  const task = MOKO_TASKS.find((t) => t.key === body.key);
  if (task && body.done) {
    const unlocked = await computeUnlocked(childId);
    if (!unlocked[task.key]) {
      return NextResponse.json({ error: task.lockHint, locked: true }, { status: 403 });
    }
  }

  await setChildTask(childId, body.key, !!body.done);
  return NextResponse.json({ ok: true });
}
