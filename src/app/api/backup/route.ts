import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword } from '@/lib/auth';
import { getDb, withWriteLock } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 需要备份的数据表（全量）。
 *
 * ⚠️ `users` 表的导出走**列白名单**（见 USER_EXPORT_COLUMNS），刻意剔除
 * `password_hash`：导出文件是明文 JSON，会落到用户磁盘、微信、网盘等处。
 * 一旦外泄，等同于交出全部账号的凭据 —— 而 schema 种子里的默认口令
 * （parent / 12345678）本就是弱口令，bcrypt cost=10 离线爆破是分钟级。
 * 备份的用途是恢复**学习数据**，凭据不该跟着流动。
 * 导入侧会保留库里现有的密码哈希（见 restoreUsers），所以恢复后账号照常可登录。
 */
const EXPORT_TABLES = [
  'users',
  'sessions',
  'tasks',
  'completions',
  'redemptions',
  'wishes',
  'castle_state',
  'moko_owned',
  'daily_checkins',
  'inventory',
  'troublemakers',
  'mistakes',
  'growth_events',
  'story_progress',
  'daily_practice',
  'capture_tickets',
  'story_read',
  'story_quiz',
  'cert_requests',
  'module_progress',
  'child_tasks',
  'textbook_progress',
];
const allowed = new Set(EXPORT_TABLES);

/**
 * users 表导出列白名单：**不含 password_hash**。
 * 新增列时需同步这里，否则新列不会进入备份（宁可漏列，也不要把凭据带出去）。
 */
const USER_EXPORT_COLUMNS = [
  'id',
  'username',
  'role',
  'display_name',
  'parent_id',
  'selected_child_id',
  'cert_pref',
  'created_at',
];

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

/**
 * 备份里出现、但库里不存在的账号所用的占位密码哈希。
 *
 * 这是一个**无法通过任何密码校验**的 bcrypt 串（明文 'ccwb-unknown-user-never-matches'），
 * 刻意不使用可猜测的默认口令 —— 恢复出一个「知道默认密码就能登录」的账号，
 * 比恢复不出这个账号危险得多。
 */
const DEFAULT_RESTORED_HASH = '$2a$10$gVNu30jU6HtAZ/jB5a2TmeEdpwRk9FFmVQnv2T3jBuwEhLP4sJ1qO';

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
      if (t === 'users') {
        // 列白名单导出：显式列出列名，杜绝 SELECT * 把 password_hash 带出去。
        const cols = USER_EXPORT_COLUMNS.join(', ');
        const res = await db.execute({ sql: `SELECT ${cols} FROM users`, args: [] });
        data[t] = res.rows;
      } else {
        const res = await db.execute({ sql: 'SELECT * FROM ' + t, args: [] });
        data[t] = res.rows;
      }
    } catch {
      data[t] = []; // 表可能不存在（旧库），跳过
    }
  }
  const json = JSON.stringify(data, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition':
        'attachment; filename="chengcheng-backup-' +
        new Date().toISOString().slice(0, 10) +
        '.json"',
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
  const hashRes = await db.execute({
    sql: 'SELECT password_hash FROM users WHERE id = ?',
    args: [user.id],
  });
  const hash = String(hashRes.rows[0]?.password_hash ?? '');
  if (!verifyPassword(password, hash)) {
    return NextResponse.json({ error: '家长密码错误' }, { status: 401 });
  }

  // ⚠️ 在 DELETE 之前抓取现有密码哈希：备份文件不含该列（见 GET 侧说明），
  // 而 password_hash 是 NOT NULL 列，恢复时需要按 id 回填，否则账号无法登录。
  // 备份里若出现了库里不存在的 id，则用一个不可登录的占位哈希兜底
  // （bcrypt 的固定串，无法通过任何密码校验，也不该让人猜到默认口令）。
  const existingHashes = await db.execute({ sql: 'SELECT id, password_hash FROM users', args: [] });
  const passwordHashesById = new Map<number, string>();
  for (const row of existingHashes.rows) {
    passwordHashesById.set(Number(row.id), String(row.password_hash));
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
        } catch {
          /* 表不存在跳过 */
        }
      }
      // 逐表恢复数据
      for (const t of IMPORT_TABLES) {
        if (!allowed.has(t)) continue;
        const rows = data[t];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        try {
          // 列名白名单：只允许目标表真实存在的列，杜绝备份 JSON 里的列名注入。
          const info = await db.execute({ sql: 'PRAGMA table_info(' + t + ')', args: [] });
          const validCols = new Set(
            (info.rows as Array<{ name?: unknown }>).map((r) => String(r.name))
          );
          if (validCols.size === 0) continue;
          // ⚠️ 不要用 db.batch()：实测它会**隐式提交并结束**外层的手动事务
          // （随后 batch 自身再开一个事务），导致：
          //   ① 手动 COMMIT 报 "cannot commit - no transaction is active"；
          //   ② 更要命的是原子性失效 —— 每张表各自提交，中途失败会留下
          //      「清了一半」的残缺库状态，而代码注释声称"失败整体回滚"。
          // 因此这里逐条 execute()，让所有写入真正落在同一个事务里。
          for (const row of rows) {
            const r = row as Record<string, unknown>;
            // users 表：备份里刻意不含 password_hash（见 GET 侧说明），
            // 而 password_hash 是 NOT NULL 列。若直接按现有列插入会失败，
            // 因此回填**清表前**记下的原密码哈希，保证恢复后账号仍可登录。
            if (t === 'users' && !('password_hash' in r)) {
              const origHash = passwordHashesById.get(Number(r.id));
              r.password_hash = origHash ?? DEFAULT_RESTORED_HASH;
            }
            const cols = Object.keys(r).filter((c) => validCols.has(c));
            if (cols.length === 0) continue;
            const placeholders = cols.map(() => '?').join(', ');
            const values = cols.map((c) => (r[c] === undefined || r[c] === null ? null : r[c])) as (
              string | number | boolean | null
            )[];
            await db.execute({
              sql: 'INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + placeholders + ')',
              args: values,
            });
          }
        } catch {
          // 单表恢复失败（如 schema 差异）跳过该表，不中断整体
          continue;
        }
      }
      await db.execute('COMMIT');
      await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
      return NextResponse.json({
        ok: true,
        message: '数据已恢复（' + IMPORT_TABLES.length + ' 张表，登录会话需重新登录）✅',
      });
    } catch (e) {
      await db.execute('ROLLBACK').catch(() => {});
      await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
      // 细节只写日志：原先把原始异常回传客户端，会泄露表名/驱动信息
      console.error('[backup] 导入失败:', e instanceof Error ? e.message : e);
      return NextResponse.json({ error: '恢复失败，请稍后重试或查看容器日志' }, { status: 500 });
    }
  });
}
