import type { Client } from '@libsql/client';

/**
 * 轻量 Schema 迁移机制（唯一迁移入口）。
 *
 * 约定：
 *   - ensureSchema() 只负责「初始建核心表 + 账号种子」，然后调用 runMigrations()；
 *   - 所有增量表 / 增量列 / 历史数据回填，一律以版本化迁移追加到下方 MIGRATIONS；
 *   - 每条 up 必须幂等（CREATE TABLE IF NOT EXISTS / 列存在检查 / 数据条件更新），
 *     因为全新库（主批次建表已含部分新列）与已部署旧库都会跑同一份迁移。
 *
 * 不要再往 ensureSchema 里堆内联 ALTER —— 那是历史包袱，已在此轮重构中收口。
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
    // 版本锚点：标记「迁移机制就绪」。
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
  {
    // 增量表：剧情已读/已答对、奖状申请、模块关卡进度、萌可任务、电子课本进度。
    // 原 ensureSchema 中「每次启动都跑」的 CREATE IF NOT EXISTS，收敛到此（跑一次即可，天然幂等）。
    version: 6,
    name: 'create_incremental_tables',
    description: 'create story_read / story_quiz / cert_requests / module_progress / child_tasks / textbook_progress',
    up: async (db) => {
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS story_read (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          chapter_id TEXT NOT NULL,
          read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(child_id, chapter_id),
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS story_quiz (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          chapter_id TEXT NOT NULL,
          passed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(child_id, chapter_id),
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS cert_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          decided_at DATETIME,
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS module_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          subject TEXT NOT NULL,
          module_key TEXT NOT NULL,
          stars INTEGER NOT NULL DEFAULT 0,
          rounds INTEGER NOT NULL DEFAULT 0,
          last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(child_id, subject, module_key),
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS child_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          task_key TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(child_id, task_key),
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS textbook_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          child_id INTEGER NOT NULL,
          book_key TEXT NOT NULL,
          chapter_idx INTEGER NOT NULL DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(child_id, book_key),
          FOREIGN KEY(child_id) REFERENCES users(id)
        )`,
        args: [],
      });
    },
  },
  {
    // 旧库 cert_requests 可能缺 status 列（CREATE IF NOT EXISTS 不会补列）。
    version: 7,
    name: 'add_cert_requests_status',
    description: '为旧 cert_requests 表补 status 列',
    up: async (db) => {
      const cols = await db.execute({ sql: 'PRAGMA table_info(cert_requests)', args: [] });
      const hasStatus = cols.rows.some((r: any) => r.name === 'status');
      if (!hasStatus) {
        await db.execute({
          sql: `ALTER TABLE cert_requests ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`,
          args: [],
        });
      }
    },
  },
  {
    // 一次性历史数据回填：旧版本打卡把爱心/正正/唱唱写成 heartping/courageping/singping，
    // 与剧情捕捉写入的 col_01_*_render 重复，导致收集数多算。新写入已统一走 col_ key（见 moko.ts subjectMokoKey），
    // 此处只需把存量旧 key 归一：已有 col_ 版则删旧 key，否则改名。
    version: 8,
    name: 'merge_subject_moko_keys',
    description: '把旧 heartping/courageping/singping 归属 key 归一为 col_01_*',
    up: async (db) => {
      const merges: [string, string][] = [
        ['heartping', 'col_01_爱心萌可_render'],
        ['courageping', 'col_01_正正萌可_render'],
        ['singping', 'col_01_唱唱萌可_render'],
      ];
      for (const [oldKey, newKey] of merges) {
        await db.execute({
          sql: `DELETE FROM moko_owned WHERE moko_key = ? AND child_id IN (SELECT child_id FROM moko_owned WHERE moko_key = ?)`,
          args: [oldKey, newKey],
        });
        await db.execute({
          sql: `UPDATE moko_owned SET moko_key = ? WHERE moko_key = ?`,
          args: [newKey, oldKey],
        });
      }
    },
  },
  {
    version: 9,
    name: 'add_mistakes_source_columns',
    description: 'mistakes 增加 source_module / chapter 列',
    up: async (db) => {
      try { await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN source_module TEXT', args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN chapter TEXT', args: [] }); } catch { /* 已存在 */ }
    },
  },
  {
    version: 10,
    name: 'add_users_parentage',
    description: 'users 增加 parent_id / selected_child_id 列（多娃扩展）',
    up: async (db) => {
      try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN parent_id INTEGER', args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN selected_child_id INTEGER', args: [] }); } catch { /* 已存在 */ }
    },
  },
  {
    // 存量旧库的 cara 未关联 parent：一次性把 cara 挂到 parent 并让 parent 默认选中 cara。
    // 全新库由 ensureSchema 的种子逻辑完成关联，此迁移主要用于已部署旧库。
    version: 11,
    name: 'link_cara_to_parent',
    description: '把存量 cara 关联到 parent 并设为默认选中',
    up: async (db) => {
      const linkCheck = await db.execute({
        sql: "SELECT id FROM users WHERE username = 'cara' AND parent_id IS NULL LIMIT 1",
        args: [],
      });
      if (linkCheck.rows.length) {
        const childId = Number(linkCheck.rows[0].id);
        const pRow = (await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent' LIMIT 1", args: [] })).rows;
        if (pRow.length) {
          const parentId = Number(pRow[0].id);
          await db.execute({ sql: 'UPDATE users SET parent_id = ? WHERE id = ?', args: [parentId, childId] });
          await db.execute({ sql: 'UPDATE users SET selected_child_id = ? WHERE id = ?', args: [childId, parentId] });
        }
      }
    },
  },
  {
    version: 12,
    name: 'add_status_columns',
    description: 'redemptions / wishes / moko_owned / daily_checkins 补 status 列',
    up: async (db) => {
      try { await db.execute({ sql: `ALTER TABLE redemptions ADD COLUMN status TEXT DEFAULT 'pending'`, args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: `ALTER TABLE wishes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`, args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: `ALTER TABLE moko_owned ADD COLUMN status TEXT NOT NULL DEFAULT 'resident'`, args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: `ALTER TABLE daily_checkins ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`, args: [] }); } catch { /* 已存在 */ }
    },
  },
  {
    version: 13,
    name: 'add_castle_and_user_extras',
    description: 'castle_state 补 skin 列、users 补 cert_pref 列',
    up: async (db) => {
      try { await db.execute({ sql: "ALTER TABLE castle_state ADD COLUMN skin TEXT NOT NULL DEFAULT 'default'", args: [] }); } catch { /* 已存在 */ }
      try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN cert_pref TEXT', args: [] }); } catch { /* 已存在 */ }
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