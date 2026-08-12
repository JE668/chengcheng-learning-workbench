import type { Client } from '@libsql/client';

/**
 * 轻量 Schema 迁移机制。
 *
 * 现状：ensureSchema() 已用「CREATE TABLE IF NOT EXISTS + ALTER TABLE … ADD COLUMN（try/catch 吞错）」
 * 做了幂等增量迁移，旧库每次启动都能补齐新表/新列。但它把「建表」和「迁移」混在一个大函数里，
 * 未来改动要么继续往里堆 IF NOT EXISTS，要么冒险改历史分支。
 *
 * 本模块提供一个**版本化**的迁移跑道，作为既有 bootstrap 之上的「未来迁移」入口：
 *   - schema_migrations(version, name, applied_at) 记录已应用的迁移；
 *   - MIGRATIONS 是按 version 升序的迁移数组；
 *   - runMigrations() 只执行「version > 已记录最大值」的迁移，且每条只跑一次。
 *
 * 用法：未来要加字段/索引/表，只需往 MIGRATIONS 追加一条 { version: N, name, up }，
 * 不要再去改 ensureSchema 的历史分支。既有库与全新库都会安全补齐（up 内请用 IF NOT EXISTS / 幂等写法）。
 */

export interface Migration {
  version: number;
  name: string;
  up: (db: Client) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    // 版本锚点：标记「迁移机制就绪」。既有 ensureSchema 已建好基线库，这里无需建表，
    // 仅占位记录 version=1，使后续迁移从 version=2 起算。
    version: 1,
    name: 'baseline_marker',
    up: async () => {},
  },
  {
    // 给结算/奖励热路径的查询补索引，降低每日结算（settleCastle）与连击统计的扫描成本。
    version: 2,
    name: 'idx_hot_query_columns',
    up: async (db) => {
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_daily_checkins_child_day ON daily_checkins(child_id, day)', args: [] });
      // completions 用 created_at（DATETIME）存时间，按天统计时由 DATE(created_at,'localtime') 派生，故索引落到 created_at
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_completions_child_created ON completions(child_id, created_at)', args: [] });
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_daily_practice_child_day ON daily_practice(child_id, day)', args: [] });
    },
  },
];

export async function ensureMigrationTable(db: Client): Promise<void> {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    args: [],
  });
}

/** 执行尚未应用的迁移，并在 schema_migrations 中记录。幂等：已记录的版本不会重跑。 */
export async function runMigrations(db: Client): Promise<void> {
  await ensureMigrationTable(db);
  const res = await db.execute({ sql: 'SELECT MAX(version) AS v FROM schema_migrations', args: [] });
  const max = Number(res.rows[0]?.v ?? 0);
  for (const m of MIGRATIONS) {
    if (m.version <= max) continue;
    await m.up(db);
    await db.execute({ sql: 'INSERT INTO schema_migrations (version, name) VALUES (?, ?)', args: [m.version, m.name] });
  }
}
