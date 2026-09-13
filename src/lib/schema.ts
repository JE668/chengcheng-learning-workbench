import bcrypt from 'bcryptjs';
import { getDb } from './db-core';
import { runMigrations } from './migrations';

/**
 * 初始化数据库 schema（幂等）。
 *
 * 职责已收口为三件事：
 *   1. 开启 WAL（启动时）；
 *   2. 主批次创建核心表（全部 CREATE TABLE IF NOT EXISTS）；
 *   3. 全新库账号种子（受 _schema_meta 守卫限制）。
 * 所有「增量表 / 增量列 / 历史数据回填」一律走 migrations.ts 的版本化迁移，
 * 不要在此文件里堆内联 ALTER。
 */
export async function ensureSchema() {
  const db = getDb();
  // NAS 自托管保护：开启 WAL 预写日志，避免断电/容器强杀导致 SQLite 损坏
  await db.execute({ sql: 'PRAGMA journal_mode=WAL', args: [] });
  await db.execute({ sql: 'PRAGMA synchronous=NORMAL', args: [] });

  // 轻量初始化守卫：已建表则跳过账号种子，省冷启动耗时。
  const guard = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='_schema_meta'",
    args: [],
  });
  const isNewDb = guard.rows.length === 0;

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

    // 🐷 愿望存钱罐：孩子写下想换的奖励，爸爸妈妈审核/实现
    `CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
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

    // 🏰 捣蛋萌可记录（帮乐美捕捉）
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
      easiness_factor REAL NOT NULL DEFAULT 2.5,
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

    // 🎟️ 捕捉券（剧情解锁需消耗；每日一练每确认一科发放 1 张）
    `CREATE TABLE IF NOT EXISTS capture_tickets (
      child_id INTEGER PRIMARY KEY,
      total INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
  ], 'write');

  // —— 以下仅全新库执行：账号种子 + 初始化标记（已部署旧库跳过，避免重复建账号）——
  if (isNewDb) {
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
    const parent = await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent'", args: [] });
    if (parent.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
        args: ['parent', bcrypt.hashSync('12345678', 10), 'parent', '爸爸妈妈'],
      });
    }

    // 多娃关联：把现存的孩子(cara)与其家长(parent)关联，并让家长默认选中该孩子。
    // 仅尚未关联时执行，存量孩子的城堡/打卡等数据全部保留。
    // （注意：旧库的存量关联由 migrations.ts 的 link_cara_to_parent 负责。）
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

    // 标记初始化完成（供守卫识别，避免每次冷启动重跑账号种子）
    await db.execute({ sql: 'CREATE TABLE IF NOT EXISTS _schema_meta (initialized INTEGER PRIMARY KEY DEFAULT 1)', args: [] });
    await db.execute({ sql: 'INSERT OR IGNORE INTO _schema_meta (initialized) VALUES (1)', args: [] });
  }

  // 版本化迁移跑道：增量表 / 增量列 / 历史数据回填的唯一入口（见 migrations.ts）。
  await runMigrations(db);
}