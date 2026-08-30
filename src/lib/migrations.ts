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
  description?: string;
  up: (db: Client) => Promise<void>;
  down?: (db: Client) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    // 版本锚点：标记「迁移机制就绪」。既有 ensureSchema 已建好基线库，这里无需建表，
    // 仅占位记录 version=1，使后续迁移从 version=2 起算。
    version: 1,
    name: 'baseline_marker',
    up: async () => {},
    down: async () => {},
  },
  {
    // 给结算/奖励热路径的查询补索引，降低每日结算（settleCastle）与连击统计的扫描成本。
    version: 2,
    name: 'idx_hot_query_columns',
    description: '给热门查询补索引：daily_checkins、completions、daily_practice',
    up: async (db) => {
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_daily_checkins_child_day ON daily_checkins(child_id, day)', args: [] });
      // completions 用 created_at（DATETIME）存时间，按天统计时由 DATE(created_at,'localtime') 派生，故索引落到 created_at
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_completions_child_created ON completions(child_id, created_at)', args: [] });
      await db.execute({ sql: 'CREATE INDEX IF NOT EXISTS idx_daily_practice_child_day ON daily_practice(child_id, day)', args: [] });
    },
    down: async (db) => {
      await db.execute({ sql: 'DROP INDEX IF EXISTS idx_daily_checkins_child_day', args: [] });
      await db.execute({ sql: 'DROP INDEX IF EXISTS idx_completions_child_created', args: [] });
      await db.execute({ sql: 'DROP INDEX IF EXISTS idx_daily_practice_child_day', args: [] });
    },
  },
  {
    version: 3,
    name: 'add_learning_streak_table',
    description: '新增 learning_streak 表：记录连续学习天数',
    up: async (db) => {
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS learning_streak (
          child_id INTEGER NOT NULL,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_study_day TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (child_id)
        )`,
        args: [],
      });
    },
    down: async (db) => {
      await db.execute({ sql: 'DROP TABLE IF EXISTS learning_streak', args: [] });
    },
  },
  {
    version: 4,
    name: 'add_speech_scores_table',
    description: '新增 speech_scores 表：存储语音评分记录',
    up: async (db) => {
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS speech_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          recognized_text TEXT,
          accuracy INTEGER,
          fluency INTEGER,
          completeness INTEGER,
          total_score INTEGER,
          duration_ms INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        args: [],
      });
    },
    down: async (db) => {
      await db.execute({ sql: 'DROP TABLE IF EXISTS speech_scores', args: [] });
    },
  },
  {
    version: 5,
    name: 'add_moko_owned_rarity_column',
    description: '给 moko_owned 增加 rarity 稀有度列',
    up: async (db) => {
      // 幂等：列已存在时 ALTER 抛 "duplicate column"，直接忽略
      try {
        await db.execute({
          sql: `ALTER TABLE moko_owned ADD COLUMN rarity TEXT DEFAULT 'common'`,
          args: [],
        });
      } catch { /* 列已存在时忽略 */ }
    },
    down: async (db) => {
      // SQLite 不支持 DROP COLUMN，需要重建表
      await db.execute({
        sql: `CREATE TABLE moko_owned_new AS SELECT id, child_id, moko_key, subject, acquired_at, stage, stage_at, mood, status, last_harvest_day FROM moko_owned`,
        args: [],
      });
      await db.execute({ sql: 'DROP TABLE moko_owned', args: [] });
      await db.execute({ sql: 'ALTER TABLE moko_owned_new RENAME TO moko_owned', args: [] });
    },
  },
];

export async function ensureMigrationTable(db: Client): Promise<void> {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'applied',
      error TEXT,
      duration_ms INTEGER DEFAULT 0
    )`,
    args: [],
  });
  // 迁移：旧版 schema_migrations 表可能缺少多列，逐个补齐（幂等 try-catch）
  for (const col of [
    'description TEXT',
    'status TEXT DEFAULT \'applied\'',
    'error TEXT',
    'duration_ms INTEGER DEFAULT 0',
  ]) {
    try {
      await db.execute({ sql: `ALTER TABLE schema_migrations ADD COLUMN ${col}`, args: [] });
    } catch { /* 列已存在时忽略 */ }
  }
}

/** 执行尚未应用的迁移，并在 schema_migrations 中记录。幂等：已记录的版本不会重跑。 */
export async function runMigrations(db: Client): Promise<void> {
  await ensureMigrationTable(db);
  const res = await db.execute({ sql: 'SELECT MAX(version) AS v FROM schema_migrations WHERE status = \'applied\'', args: [] });
  const max = Number(res.rows[0]?.v ?? 0);
  for (const m of MIGRATIONS) {
    if (m.version <= max) continue;
    await m.up(db);
    await db.execute({ sql: 'INSERT INTO schema_migrations (version, name, description, applied_at, status) VALUES (?, ?, ?, CURRENT_TIMESTAMP, \'applied\')', args: [m.version, m.name, m.description ?? ''] });
  }
}

/** 获取当前已应用的最大版本 */
export async function getCurrentVersion(db: Client): Promise<number> {
  await ensureMigrationTable(db);
  const res = await db.execute({ sql: 'SELECT MAX(version) AS v FROM schema_migrations WHERE status = \'applied\'', args: [] });
  return Number(res.rows[0]?.v ?? 0);
}

/** 获取所有迁移记录 */
export async function getMigrationHistory(db: Client): Promise<Array<{
  version: number;
  name: string;
  appliedAt: string;
  status: string;
  error?: string;
  durationMs: number;
}>> {
  await ensureMigrationTable(db);
  const res = await db.execute({ 
    sql: 'SELECT version, name, applied_at, status, error, duration_ms FROM schema_migrations ORDER BY version', 
    args: [] 
  });
  return res.rows.map(r => ({
    version: Number(r.version),
    name: String(r.name),
    appliedAt: String(r.applied_at),
    status: String(r.status),
    error: r.error ? String(r.error) : undefined,
    durationMs: Number(r.duration_ms ?? 0),
  }));
}

/** 回滚最后一次迁移 */
export async function rollbackLast(db: Client): Promise<void> {
  await ensureMigrationTable(db);
  const res = await db.execute({ sql: 'SELECT MAX(version) AS v FROM schema_migrations WHERE status = \'applied\'', args: [] });
  const currentVersion = Number(res.rows[0]?.v ?? 0);
  if (currentVersion <= 1) {
    throw new Error('Cannot rollback baseline migration');
  }
  // Find the migration to rollback
  const migration = MIGRATIONS.find(m => m.version === currentVersion);
  if (!migration || !migration.down) {
    throw new Error('Migration has no down function, cannot rollback');
  }
  await migration.down(db);
  await db.execute({ sql: 'DELETE FROM schema_migrations WHERE version = ?', args: [currentVersion] });
}