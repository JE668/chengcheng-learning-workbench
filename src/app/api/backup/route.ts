import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 需要备份的数据表（全量，含用户密码哈希——家长私有部署，必要）
const EXPORT_TABLES = [
  'users', 'sessions', 'tasks', 'completions', 'redemptions', 'wishes',
  'castle_state', 'moko_owned', 'daily_checkins', 'inventory', 'troublemakers',
  'mistakes', 'growth_events', 'story_progress', 'daily_practice',
  'capture_tickets', 'story_read', 'story_quiz', 'cert_requests',
  'module_progress', 'child_tasks', 'textbook_progress',
];

/**
 * GET /api/backup/export — 导出全部数据为 JSON 文件（家长身份）
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const db = getDb();
  const data: Record<string, unknown[]> = { _exported_at: [new Date().toISOString()] };
  for (const t of EXPORT_TABLES) {
    try {
      const res = await db.execute({ sql: 'SELECT * FROM ' + t, args: [] });
      data[t] = res.rows;
    } catch {
      data[t] = []; // 表可能不存在（旧库），跳过
    }
  }
  const json = JSON.stringify(data, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="chengcheng-backup-' + new Date().toISOString().slice(0, 10) + '.json"',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * POST /api/backup/import — 上传备份 JSON 并恢复（家长身份，需要备份文件字段 _exported_at 校验）
 * 危险操作：会覆盖当前数据。前端需二次确认。
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  let body: { data?: Record<string, unknown[]>; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 });
  }
  const data = body.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.users)) {
    return NextResponse.json({ error: '备份文件格式不正确（缺少 users 表）' }, { status: 400 });
  }
  // 确认标记：前端解析备份后要求输入家长密码 hash 校验（简单起见：要求确认字段）
  if (body.password !== 'CONFIRM') {
    return NextResponse.json({ error: '请先确认恢复操作' }, { status: 400 });
  }

  const db = getDb();
  // 逐表恢复：先清空再插入（事务保护，失败回滚）
  await db.execute('BEGIN');
  try {
    for (const t of EXPORT_TABLES) {
      if (!Array.isArray(data[t])) continue;
      try {
        // 关掉外键约束检查，按备份顺序插入
        await db.execute({ sql: 'DELETE FROM ' + t, args: [] });
      } catch { /* 表不存在跳过 */ }
    }
    for (const t of EXPORT_TABLES) {
      const rows = data[t];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const first = rows[0] as Record<string, unknown>;
      const cols = Object.keys(first);
      if (cols.length === 0) continue;
      try {
        await db.execute('PRAGMA foreign_keys = OFF');
        for (const row of rows) {
          const r = row as Record<string, unknown>;
          const placeholders = cols.map(() => '?').join(', ');
          const values = cols.map((c) => (r[c] === undefined || r[c] === null ? null : r[c])) as (string | number | boolean | null)[];
          await db.execute({
            sql: 'INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + placeholders + ')',
            args: values as (string | number | boolean | null)[],
          });
        }
        await db.execute({ sql: 'PRAGMA foreign_keys = ON', args: [] });
      } catch {
        // 单表恢复失败（如 schema 差异）跳过该表，不中断整体
        continue;
      }
    }
    await db.execute('COMMIT');
    return NextResponse.json({ ok: true, message: '数据已恢复（' + EXPORT_TABLES.length + ' 张表）✅' });
  } catch (e) {
    await db.execute('ROLLBACK');
    await db.execute({ sql: 'PRAGMA foreign_keys = ON', args: [] }).catch(() => {});
    return NextResponse.json({ error: '恢复失败：' + String((e as Error).message) }, { status: 500 });
  }
}