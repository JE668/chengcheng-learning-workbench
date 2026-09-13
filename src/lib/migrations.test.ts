import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { runMigrations, getCurrentVersion, getMigrationHistory, MIGRATIONS } from './migrations';

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

    // 再跑一次：已记录的版本不重跑，记录数不变
    await runMigrations(getDb());
    const r = await getDb().execute({ sql: 'SELECT COUNT(*) AS n FROM schema_migrations', args: [] });
    expect(Number(r.rows[0]?.n)).toBe(MIGRATIONS.length);
  });

  it('ensureSchema 内含迁移跑道，全新/旧库均可安全执行', async () => {
    // 直接调 ensureSchema（其内部已调 runMigrations），不应抛错
    await expect(ensureSchema()).resolves.toBeUndefined();
    const r = await getDb().execute({ sql: 'SELECT COUNT(*) AS n FROM schema_migrations', args: [] });
    expect(Number(r.rows[0]?.n)).toBeGreaterThanOrEqual(1);
  });

  it('getCurrentVersion 返回正确的版本号', async () => {
    await runMigrations(getDb());
    const version = await getCurrentVersion(getDb());
    expect(version).toBeGreaterThanOrEqual(2);
  });

  it('getMigrationHistory 返回完整的迁移历史', async () => {
    await runMigrations(getDb());
    const history = await getMigrationHistory(getDb());
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].version).toBe(1);
    expect(history[0].name).toBe('baseline_marker');
    expect(history[0].status).toBe('applied');
  });

  it('全新库 ensureSchema 后增量表与增量列全部就位', async () => {
    await ensureSchema();
    const tableNames = (await getDb().execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      args: [],
    })).rows.map((r) => String(r.name));

    for (const t of ['story_read', 'story_quiz', 'cert_requests', 'module_progress', 'child_tasks', 'textbook_progress', 'learning_streak', 'speech_scores']) {
      expect(tableNames).toContain(t);
    }

    const colCheck = async (table: string, col: string) => {
      const cols = (await getDb().execute({ sql: `PRAGMA table_info(${table})`, args: [] })).rows;
      return cols.some((c: any) => c.name === col);
    };
    expect(await colCheck('users', 'parent_id')).toBe(true);
    expect(await colCheck('users', 'cert_pref')).toBe(true);
    expect(await colCheck('mistakes', 'source_module')).toBe(true);
    expect(await colCheck('castle_state', 'skin')).toBe(true);
    expect(await colCheck('redemptions', 'status')).toBe(true);
    expect(await colCheck('moko_owned', 'rarity')).toBe(true);
  });
});