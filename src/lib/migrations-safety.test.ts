// @vitest-environment node
/**
 * 迁移安全性回归测试（对应 docs/评审修复计划与交接.md 第 7 节第 9 项）。
 *
 * 背景：migrations.ts 里原有 12 处 `try { ALTER TABLE ... } catch {}`，
 * 会把**真正的失败**（表不存在 / 库被锁 / 磁盘错误 / SQL 写错）一起吞掉，
 * 而 runMigrations() 仍把该版本记为 applied —— 结果是：
 *
 *   列永久缺失  +  没有任何日志  +  下次冷启动不会重试（版本号已跳过）
 *
 * 修复后只有「列已存在」被容忍，其余一律上抛（版本不被记录，下次会重试）。
 * 这些断言在修复前必然失败：对不存在的表执行 ADD COLUMN，旧代码静默返回、什么都没发生。
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient } from '@libsql/client';
import {
  MIGRATIONS,
  addColumnIfMissing,
  ensureMigrationTable,
  getCurrentVersion,
  runMigrations,
} from '@/lib/migrations';

/** vi.mock 工厂与测试共享的可变指针（ESM 命名空间只读，改不了导出的 getDb）。 */
const dbMockState: { client: unknown } = { client: null };

vi.mock('@/lib/db-core', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db-core')>('@/lib/db-core');
  return {
    ...actual,
    getDb: () => dbMockState.client ?? actual.getDb(),
  };
});

/** 极简 libsql Client 替身：只实现测试用到的 execute。 */
function fakeDb(
  onSql: (sql: string) => void,
  failWith?: string
): { execute: (arg: { sql: string; args?: unknown[] }) => Promise<unknown> } {
  return {
    async execute({ sql }) {
      onSql(sql);
      if (failWith) throw new Error(failWith);
      return { rows: [] };
    },
  };
}

/**
 * 取得一张「已建好全部表」的空库。
 *
 * 走真实的 `ensureSchema()`，而不是在本文件里复刻一份 CREATE TABLE：
 * 复刻会与 schema.ts 漂移 —— 实测复刻版缺 `moko_key` 等列，迁移立刻失败。
 *
 * 做法：把 `@/lib/db-core` 的 getDb 换成返回目标 client，再调 ensureSchema 建表
 * （ESM 命名空间只读，只能用 vi.mock 工厂，不能直接赋值）。
 * 真实顺序即 ensureSchema（建表）→ runMigrations（迁移），与生产一致。
 */
async function freshDbWithSchema() {
  const db = createClient({ url: 'file::memory:' });
  dbMockState.client = db;
  const schema = await import('@/lib/schema');
  await schema.ensureSchema();
  return db;
}

describe('迁移安全性 · 真实空库端到端', () => {
  it('空库上必须先建表再建表之外的对象 —— runMigrations 不再自行容忍缺表', async () => {
    // 本用例原先断言「空库上直接跑 runMigrations 必须成功」，那是在给一个**已失效的
    // 前提**背书：当时 runMigrations 确实先于建表执行，所以迁移要容忍
    // `no such table`。真实调用链（schema.ts）里 runMigrations 在建表批次**之后**（:256 vs :219），
    // 唯一生产入口就这一处。
    //
    // 保留该容忍的代价：表名拼错（moko_owns / moko_owned）同样命中 `no such table`，
    // 于是列永久缺失、无日志，版本还被记成 applied 不再重试 —— 本地库就真实卡死在这个洞上
    // （停在 v13，algorithm_progress / algorithm_mistakes / push_subscriptions 从未建出）。
    //
    // 因此现在的契约是：**缺表必须显式失败**，让部署立刻暴露问题，而不是静默损坏。
    const db = createClient({ url: 'file::memory:' });
    await ensureMigrationTable(db);
    await expect(runMigrations(db)).rejects.toThrow(/no such table/);
  });

  it('表齐备时 runMigrations 必须成功，且版本推进到最新', async () => {
    // 模拟真实顺序：先建表，再跑迁移。
    const db = await freshDbWithSchema();
    await expect(runMigrations(db)).resolves.toBeUndefined();
    const v = await getCurrentVersion(db);
    const max = Math.max(...MIGRATIONS.map((m) => m.version));
    expect(v).toBe(max);
  });

  it('重复执行必须幂等（第二次不抛错）', async () => {
    const db = await freshDbWithSchema();
    await runMigrations(db);
    await expect(runMigrations(db)).resolves.toBeUndefined();
  });

  it('中间版本记录丢失后必须能补跑（回归：MAX(version) 闸门会永久跳过）', async () => {
    const db = await freshDbWithSchema();
    await runMigrations(db);
    // 模拟记录损坏/丢失：中间两条没了，max 不变
    await db.execute({ sql: 'DELETE FROM schema_migrations WHERE version IN (2, 3)', args: [] });
    const vBefore = await getCurrentVersion(db);
    await expect(runMigrations(db)).resolves.toBeUndefined();
    const rows = await db.execute({
      sql: "SELECT version FROM schema_migrations WHERE status = 'applied' ORDER BY version",
      args: [],
    });
    const versions = rows.rows.map((r) => Number(r.version));
    expect(versions).toContain(2);
    expect(versions).toContain(3);
    expect(vBefore).toBe(Math.max(...MIGRATIONS.map((m) => m.version)));
  });

  it('迁移失败必须上抛且不记录为 applied（回归：曾静默吞掉 no such table）', async () => {
    const db = await freshDbWithSchema();
    // 人为制造一条必然失败的迁移：表名拼错（与历史缺陷 moko_owns 同型）
    const broken = {
      version: 9001,
      name: 'typo_table_for_test',
      up: async (c: { execute: (a: { sql: string; args?: unknown[] }) => Promise<unknown> }) => {
        await c.execute({ sql: 'CREATE INDEX idx_x ON moko_owns(id)' });
      },
    };
    const mod = await import('@/lib/migrations');
    const original = mod.MIGRATIONS;
    (mod.MIGRATIONS as unknown as { push: (m: unknown) => void }).push(broken);
    try {
      await expect(runMigrations(db)).rejects.toThrow(/moko_owns/);
      const row = await db.execute({
        sql: 'SELECT status FROM schema_migrations WHERE version = 9001',
        args: [],
      });
      // 要么根本没有记录，要么是 failed —— 绝不能是 applied
      expect(row.rows[0]?.status ?? 'failed').not.toBe('applied');
    } finally {
      (mod.MIGRATIONS as unknown as { pop: () => unknown }).pop();
      expect(mod.MIGRATIONS.length).toBe(original.length);
    }
  });
});

describe('迁移安全性 · addColumnIfMissing', () => {
  it('列不存在时正常执行 ALTER', async () => {
    const seen: string[] = [];
    const db = fakeDb((sql) => seen.push(sql));
    await addColumnIfMissing(db as never, 'users', 'cert_pref TEXT');
    expect(seen).toEqual(['ALTER TABLE users ADD COLUMN cert_pref TEXT']);
  });

  it('列已存在（duplicate column name）时静默忽略 —— 这是唯一的幂等豁免', async () => {
    const db = fakeDb(() => {}, 'duplicate column name: cert_pref');
    // 不抛错即通过：重复运行迁移必须安全
    await expect(
      addColumnIfMissing(db as never, 'users', 'cert_pref TEXT')
    ).resolves.toBeUndefined();
  });

  it('表尚未建出时静默跳过 —— 全新库的正常路径', async () => {
    // 关键背景：全新库上 ensureSchema() 里的 runMigrations() 先于建表执行
    // （schema.ts 第 75 行 vs 第 197 行），此时 8 张目标表都还不存在。
    // 历史行为靠「静默吞掉」让全新部署跑通；一旦改成严格上抛，全新库直接无法初始化
    // （这个回归真实发生过：CI e2e 登录后停在 /login，因为数据库初始化抛错）。
    const db = fakeDb(() => {}, 'SQLITE_ERROR: no such table: moko_owned');
    await expect(
      addColumnIfMissing(db as never, 'moko_owned', 'rarity TEXT')
    ).resolves.toBeUndefined();
  });

  it('「no such table」只放行这一种，不能顺带吞掉别的错误', async () => {
    // 库被锁与「表不存在」长得不像，必须照旧上抛
    const db = fakeDb(() => {}, 'SQLITE_ERROR: database is locked');
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /ALTER TABLE mistakes ADD COLUMN chapter/
    );
  });

  it('库被锁 / 磁盘错误等真失败必须上抛，且保留原始原因', async () => {
    const db = fakeDb(() => {}, 'database is locked');
    await expect(addColumnIfMissing(db as never, 'users', 'parent_id INTEGER')).rejects.toThrow(
      /database is locked/
    );
  });

  it('错误信息带上表名与列名，便于定位是哪个迁移失败了', async () => {
    // 用「磁盘 I/O 错误」这类真失败验证错误包装
    // （no such table 已是合法跳过项，不能用它当"真失败"的例子）
    const db = fakeDb(() => {}, 'SQLITE_IOERR: disk I/O error');
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /ALTER TABLE mistakes ADD COLUMN chapter/
    );
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /disk I\/O error/
    );
  });

  it('非 Error 类型的异常也要包裹上抛（不吞、不裸传）', async () => {
    const db = {
      execute: async () => {
        throw 'plain string failure';
      },
    };
    await expect(addColumnIfMissing(db as never, 'users', 'cert_pref TEXT')).rejects.toThrow(
      /plain string failure/
    );
  });

  it('带 NOT NULL DEFAULT 的完整列定义原样传给 ALTER（不能只取列名）', async () => {
    const seen: string[] = [];
    const db = fakeDb((sql) => seen.push(sql));
    await addColumnIfMissing(db as never, 'wishes', "status TEXT NOT NULL DEFAULT 'pending'");
    expect(seen[0]).toBe("ALTER TABLE wishes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  });
});
