import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const raw = createClient({ url, ...(authToken ? { authToken } : {}) });
    // 包装 execute：未传 args 时自动补空数组，避免 libSQL 在
    // stmtToHrana 中对 undefined args 调用 Object.entries 抛错。
    // 其余方法（如 batch）绑定回 raw client，保证私有字段可访问。
    client = new Proxy(raw, {
      get(target, prop) {
        if (prop === 'execute') {
          return (stmt: string | { sql: string; args?: unknown[]; namedArgs?: Record<string, unknown> }) => {
            const s = typeof stmt === 'string' ? { sql: stmt } : { ...stmt };
            if (s.args === undefined && s.namedArgs === undefined) s.args = [];
            return target.execute(s as Parameters<Client['execute']>[0]);
          };
        }
        const val = Reflect.get(target, prop, target);
        if (typeof val === 'function') return val.bind(target);
        return val;
      },
    }) as unknown as Client;
  }
  return client;
}

export async function ensureSchema() {
  const db = getDb();
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','child')),
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL DEFAULT 5,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      child_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      reward_name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 萌可城堡：单个孩子的城堡资源
    `CREATE TABLE IF NOT EXISTS castle_state (
      child_id INTEGER PRIMARY KEY,
      sunlight INTEGER NOT NULL DEFAULT 0,
      star_coins INTEGER NOT NULL DEFAULT 0,
      prosperity INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_settled_day TEXT,
      shield_equipped INTEGER NOT NULL DEFAULT 0,
      last_stolen INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 已入驻的萌可（含成长阶段与心情值）
    `CREATE TABLE IF NOT EXISTS moko_owned (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      moko_key TEXT NOT NULL,
      subject TEXT,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stage TEXT NOT NULL DEFAULT 'obtained',
      stage_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mood INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'resident',
      last_harvest_day TEXT DEFAULT '',
      UNIQUE(child_id, moko_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🌟 学习↔城堡：每日三科打卡
    `CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      child_done_at DATETIME,
      confirmed_at DATETIME,
      UNIQUE(child_id, day, subject),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 道具背包
    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      UNIQUE(child_id, item_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 捣蛋萌可入侵记录
    `CREATE TABLE IF NOT EXISTS troublemakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      moko_key TEXT NOT NULL,
      day TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 📝 错词本 / 错题本（间隔重复复习）
    `CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      kind TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      wrong TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      next_review TEXT NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      reps INTEGER NOT NULL DEFAULT 0,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
  ], 'write');

  // 账号迁移：确保 child 用户为 cara / 0000。
  // 遗留的 cheng 自动改名并重置密码，users.id 不变，城堡/打卡等关联数据全部保留。
  const cara = await db.execute({ sql: "SELECT id FROM users WHERE username = 'cara'", args: [] });
  if (cara.rows.length === 0) {
    const cheng = await db.execute({ sql: "SELECT id FROM users WHERE username = 'cheng'", args: [] });
    if (cheng.rows.length > 0) {
      await db.execute({
        sql: "UPDATE users SET username = 'cara', password_hash = ?, display_name = '程程' WHERE username = 'cheng'",
        args: [bcrypt.hashSync('0000', 10)],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
        args: ['cara', bcrypt.hashSync('0000', 10), 'child', '程程'],
      });
    }
  }
}

/** 取第一个孩子 id（本工作台默认单孩子） */
export async function getChildId(): Promise<number | null> {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT id FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  return res.rows.length ? Number(res.rows[0].id) : null;
}

export async function getChildPoints(childId: number): Promise<number> {
  const db = getDb();
  const earned = await db.execute({
    sql: 'SELECT COALESCE(SUM(points),0) AS total FROM completions WHERE child_id = ?',
    args: [childId],
  });
  const spent = await db.execute({
    sql: 'SELECT COALESCE(SUM(cost),0) AS total FROM redemptions WHERE child_id = ? AND status = ?',
    args: [childId, 'approved'],
  });
  return Number(earned.rows[0]?.total ?? 0) - Number(spent.rows[0]?.total ?? 0);
}
