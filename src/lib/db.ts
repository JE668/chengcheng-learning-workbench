import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { User } from './types';

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
      parent_id INTEGER,
      selected_child_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES users(id),
      FOREIGN KEY(selected_child_id) REFERENCES users(id)
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

    // 📔 萌可成长日记（里程碑事件流，由联动动作埋点写入）
    `CREATE TABLE IF NOT EXISTS growth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      type TEXT NOT NULL,
      emoji TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 📜 萌可剧情捕捉进度（每集捕捉一只萌可，顺序解锁）
    `CREATE TABLE IF NOT EXISTS story_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🎯 每日一练（合并到三科打卡：做完且全对 = 三科自动打卡完成）
    `CREATE TABLE IF NOT EXISTS daily_practice (
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      questions TEXT,
      completed_at DATETIME,
      streak_rewarded INTEGER NOT NULL DEFAULT 0,
      UNIQUE(child_id, day),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
  ], 'write');

  // 迁移：castle_state 增加 skin 字段（城堡皮肤切换）
  // 幂等：列已存在时 ALTER 抛 "duplicate column"，直接忽略。
  try {
    await db.execute({ sql: "ALTER TABLE castle_state ADD COLUMN skin TEXT NOT NULL DEFAULT 'default'", args: [] });
  } catch { /* 列已存在或不可迁移时忽略，不影响主流程 */ }

  // 迁移：users 增加 cert_pref（奖状自定义，JSON: {"mokoKey","theme"}）
  // 孩子端存云端，家长端打印统一读取；幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN cert_pref TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }

  // 迁移：mistakes 增加 source_module / chapter（错题来源模块与章节，便于家长端联动「去练习」）
  // 幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN source_module TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }
  try {
    await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN chapter TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }

  // 迁移：users 增加 parent_id / selected_child_id（多娃扩展），幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN parent_id INTEGER', args: [] });
  } catch { /* 列已存在时忽略 */ }
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN selected_child_id INTEGER', args: [] });
  } catch { /* 列已存在时忽略 */ }

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

  // 全新部署兜底：确保家长账号 parent / 12345678 存在（幂等，已有则跳过）。
  // 避免未执行 seed 脚本时家长端无法登录、被锁死。
  const parent = await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent'", args: [] });
  if (parent.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
      args: ['parent', bcrypt.hashSync('12345678', 10), 'parent', '爸爸妈妈'],
    });
  }

  // 多娃关联：把现存的孩子(cara)与其家长(parent)关联起来，并把家长默认选中该孩子。
  // 仅在尚未关联时执行，存量孩子的城堡/打卡等数据全部保留。
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
}

/** 取某个家长名下的所有孩子（按 id 升序）。 */
export async function getChildrenOfParent(parentId: number): Promise<User[]> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT id, username, role, display_name FROM users WHERE parent_id = ? ORDER BY id',
    args: [parentId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    username: String(r.username),
    role: 'child' as const,
    displayName: String(r.display_name),
  }));
}

/** 取家长当前选中的孩子 id；若无选中或选中无效，回退到名下第一个孩子。 */
export async function getSelectedChildId(parentId: number): Promise<number | null> {
  const db = getDb();
  const p = await db.execute({ sql: 'SELECT selected_child_id FROM users WHERE id = ?', args: [parentId] });
  const sel = p.rows.length ? p.rows[0].selected_child_id : null;
  const children = await getChildrenOfParent(parentId);
  if (!children.length) return null;
  if (sel != null && children.some((c) => c.id === Number(sel))) return Number(sel);
  return children[0].id;
}

/**
 * 解析「当前要操作的孩子 id」：
 * - 传入 child 用户 → 自己；
 * - 传入 parent 用户 → 其选中的孩子（多娃切换支点）；
 * - 未传用户（旧调用兜底）→ 全局第一个孩子。
 * 所有按孩子隔离的查询都应走这里，多娃扩展只改本函数即可全站生效。
 */
export async function getChildId(user?: User | null): Promise<number | null> {
  if (user && user.role === 'child') return user.id;
  if (user && user.role === 'parent') return getSelectedChildId(user.id);
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
