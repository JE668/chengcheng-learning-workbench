import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { runMigrations } from './migrations';

describe('轻量 Schema 迁移机制', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    // 清空迁移记录，模拟「尚未迁移」的全新库，验证 runMigrations 会补齐
    await getDb().execute({ sql: 'DELETE FROM schema_migrations', args: [] });
  });

  it('runMigrations 补齐所有迁移并记录到 schema_migrations', async () => {
    await runMigrations(getDb());
    const r = await getDb().execute({ sql: 'SELECT version, name FROM schema_migrations ORDER BY version', args: [] });
    const rows = r.rows.map((x) => ({ version: Number(x.version), name: String(x.name) }));
    expect(rows).toContainEqual({ version: 1, name: 'baseline_marker' });
    expect(rows.some((x) => x.version === 2 && x.name === 'idx_hot_query_columns')).toBe(true);
  });

  it('v2 索引被创建，且重复运行幂等（不重复记录/不报错）', async () => {
    await runMigrations(getDb());
    const idx = await getDb().execute({
      sql: "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_daily_checkins_child_day'",
      args: [],
    });
    expect(Number(idx.rows.length)).toBe(1);

    // 再跑一次：已记录的版本不重跑，仍只有 2 条记录
    await runMigrations(getDb());
    const r = await getDb().execute({ sql: 'SELECT COUNT(*) AS n FROM schema_migrations', args: [] });
    expect(Number(r.rows[0]?.n)).toBe(2);
  });

  it('ensureSchema 内含迁移跑道，全新/旧库均可安全执行', async () => {
    // 直接调 ensureSchema（其内部已调 runMigrations），不应抛错
    await expect(ensureSchema()).resolves.toBeUndefined();
    const r = await getDb().execute({ sql: 'SELECT COUNT(*) AS n FROM schema_migrations', args: [] });
    expect(Number(r.rows[0]?.n)).toBeGreaterThanOrEqual(1);
  });
});
