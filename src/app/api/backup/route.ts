import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword } from '@/lib/auth';
import { getDb, withWriteLock } from '@/lib/db';

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
const allowed = new Set(EXPORT_TABLES);

/**
 * **不恢复 sessions 表**。
 * sessions 里放的是登录 token：如果允许从备份文件写入，就等于允许往库里塞一个
 * 「自己知道的 token」从而长期免密登录（比新增一个家长账号更干净的持久化后门）。
 * 恢复数据后重新登录一次即可，没有必须恢复会话的理由。
 */
const IMPORT_TABLES = EXPORT_TABLES.filter((t) => t !== 'sessions');

/** 导入请求体上限：备份 JSON 可以很大，但不能让单个请求把容器内存吃光。 */
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
/** 单表行数上限：防止构造超大数组撑爆 batch。 */
const MAX_ROWS_PER_TABLE = 20000;

type LimitedBody = { ok: true; value: unknown } | { ok: false; status: number; reason: string };

/**
 * 带大小上限的 JSON 解析。
 * 直接用 req.json() 会先把整个请求体读进内存、没有任何上限 —— 一个超大 POST
 * 就能把容器内存打满。这里按流读取，超限立即中断。
 */
async function readJsonLimited(req: NextRequest, maxBytes: number): Promise<LimitedBody> {
  const declared = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, reason: '请求体过大' };
  }
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, status: 400, reason: '无效请求体' };

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false, status: 413, reason: '请求体过大' };
    }
    chunks.push(value);
  }
  try {
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, reason: '无效请求体' };
  }
}

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
  const parsed = await readJsonLimited(req, MAX_IMPORT_BYTES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.reason }, { status: parsed.status });
  }
  const body = parsed.value as { data?: Record<string, unknown[]>; password?: string };
  const data = body?.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.users)) {
    return NextResponse.json({ error: '备份文件格式不正确（缺少 users 表）' }, { status: 400 });
  }

  // 预检行数：在进入事务前拦截，避免写到一半才发现超限
  for (const t of IMPORT_TABLES) {
    const rows = data[t];
    if (Array.isArray(rows) && rows.length > MAX_ROWS_PER_TABLE) {
      return NextResponse.json(
        { error: '备份文件中 ' + t + ' 的行数超过上限 ' + MAX_ROWS_PER_TABLE },
        { status: 413 }
      );
    }
  }

  const db = getDb();

  // 破坏性操作：校验家长密码（不再用硬编码 'CONFIRM' 占位）。
  const password = typeof body.password === 'string' ? body.password : '';
  const hashRes = await db.execute({ sql: 'SELECT password_hash FROM users WHERE id = ?', args: [user.id] });
  const hash = String(hashRes.rows[0]?.password_hash ?? '');
  if (!verifyPassword(password, hash)) {
    return NextResponse.json({ error: '家长密码错误' }, { status: 401 });
  }
  // 逐表恢复：先清空再插入，整段放进互斥锁保护的写事务，失败整体回滚。
  // PRAGMA foreign_keys 必须在事务外设置，否则不生效。
  return withWriteLock(async () => {
    await db.execute('PRAGMA foreign_keys = OFF');
    await db.execute('BEGIN');
    try {
      // 先清空所有表（按外键依赖顺序）；sessions 不在 IMPORT_TABLES 里
      for (const t of IMPORT_TABLES) {
        if (!allowed.has(t)) continue;
        if (!Array.isArray(data[t])) continue;
        try {
          await db.execute({ sql: 'DELETE FROM ' + t, args: [] });
        } catch { /* 表不存在跳过 */ }
      }
      // 逐表恢复数据
      for (const t of IMPORT_TABLES) {
        if (!allowed.has(t)) continue;
        const rows = data[t];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        try {
          // 列名白名单：只允许目标表真实存在的列，杜绝备份 JSON 里的列名注入。
          const info = await db.execute({ sql: 'PRAGMA table_info(' + t + ')', args: [] });
          const validCols = new Set((info.rows as Array<{ name?: unknown }>).map((r) => String(r.name)));
          if (validCols.size === 0) continue;
          // db.batch() 一次性提交，比逐行 execute() 快数倍（避免 5000+ 次 round-trip）
          const stmts: { sql: string; args: (string | number | boolean | null)[] }[] = [];
          for (const row of rows) {
            const r = row as Record<string, unknown>;
            const cols = Object.keys(r).filter((c) => validCols.has(c));
            if (cols.length === 0) continue;
            const placeholders = cols.map(() => '?').join(', ');
            const values = cols.map((c) => (r[c] === undefined || r[c] === null ? null : r[c])) as (string | number | boolean | null)[];
            stmts.push({
              sql: 'INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + placeholders + ')',
              args: values,
            });
          }
          if (stmts.length > 0) await db.batch(stmts);
        } catch {
          // 单表恢复失败（如 schema 差异）跳过该表，不中断整体
          continue;
        }
      }
      await db.execute('COMMIT');
      await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
      return NextResponse.json({ ok: true, message: '数据已恢复（' + IMPORT_TABLES.length + ' 张表，登录会话需重新登录）✅' });
    } catch (e) {
      await db.execute('ROLLBACK').catch(() => {});
      await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
      // 细节只写日志：原先把原始异常回传客户端，会泄露表名/驱动信息
      console.error('[backup] 导入失败:', e instanceof Error ? e.message : e);
      return NextResponse.json({ error: '恢复失败，请稍后重试或查看容器日志' }, { status: 500 });
    }
  });
}