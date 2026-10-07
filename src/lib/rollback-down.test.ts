// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@libsql/client';

const dbMockState: { client: unknown } = { client: null };
vi.mock('@/lib/db-core', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db-core')>('@/lib/db-core');
  return { ...actual, getDb: () => dbMockState.client ?? actual.getDb() };
});

import { MIGRATIONS, ensureMigrationTable, runMigrations, rollbackLast } from '@/lib/migrations';

async function freshDb() {
  const db = createClient({ url: 'file::memory:' });
  dbMockState.client = db;
  const schema = await import('@/lib/schema');
  await schema.ensureSchema();
  await ensureMigrationTable(db);
  await runMigrations(db);
  return db;
}

describe('rollbackLast · 每条迁移都必须有可解释的 down', () => {
  it('没有 down 实现的迁移数为 0', async () => {
    const missing = MIGRATIONS.filter((m) => typeof m.down !== 'function');
    expect(missing.map((m) => 'v' + m.version)).toEqual([]);
  });

  it('最新一条迁移可回滚', async () => {
    const db = await freshDb();
    const before = await db.execute(
      "SELECT MAX(version) v FROM schema_migrations WHERE status='applied'"
    );
    const v = Number(before.rows[0].v);
    await rollbackLast(db);
    const after = await db.execute(
      "SELECT MAX(version) v FROM schema_migrations WHERE status='applied'"
    );
    expect(Number(after.rows[0].v)).toBeLessThan(v);
  });

  it('不可逆迁移的 down 会抛出带原因的错误（而不是含糊的 no down function）', async () => {
    const v6 = MIGRATIONS.find((m) => m.version === 6)!;
    const v8 = MIGRATIONS.find((m) => m.version === 8)!;
    await expect(v6.down!(await freshDb())).rejects.toThrow(/学习记录/);
    await expect(v8.down!(await freshDb())).rejects.toThrow(/重复行/);
  });

  it('列迁移的 down 真的把列删掉（v9）', async () => {
    const db = await freshDb();
    const m = MIGRATIONS.find((x) => x.version === 9)!;
    await m.down!(db);
    const cols = await db.execute({ sql: 'PRAGMA table_info(mistakes)', args: [] });
    expect(cols.rows.map((r: any) => r.name)).not.toContain('source_module');
    expect(cols.rows.map((r: any) => r.name)).not.toContain('chapter');
  });
});
