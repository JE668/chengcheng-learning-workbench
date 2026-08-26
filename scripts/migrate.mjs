#!/usr/bin/env node
/**
 * 数据库迁移脚本
 * 基于 Kysely 运行 schema 迁移
 */

import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_URL = process.env.TURSO_URL || 'file:local.db';
const DB_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function runMigrations() {
  console.log('🔄 开始数据库迁移...');
  console.log(`📍 数据库: ${DB_URL}`);

  const client = createClient({
    url: DB_URL,
    ...(DB_AUTH_TOKEN ? { authToken: DB_AUTH_TOKEN } : {}),
  });

  try {
    // 启用 WAL 模式
    await client.execute('PRAGMA journal_mode=WAL');
    await client.execute('PRAGMA synchronous=NORMAL');
    console.log('✅ WAL 模式已启用');

    // 读取 schema.sql
    const schemaPath = resolve(__dirname, '../src/lib/schema.sql');
    let schemaSql = '';

    try {
      schemaSql = readFileSync(schemaPath, 'utf-8');
    } catch {
      // 如果没有独立 schema.sql，从 schema.ts 生成（简化版）
      console.log('⚠️ 未找到 schema.sql，使用内置建表语句');
      schemaSql = getBuiltinSchema();
    }

    // 分割并执行语句
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
      if (!stmt) continue;
      try {
        await client.execute(stmt);
      } catch (e: any) {
        // 忽略 "already exists" 错误
        if (e.message?.includes('already exists') || e.message?.includes('duplicate column')) {
          console.log(`  ⏭️  跳过已存在: ${stmt.slice(0, 50)}...`);
        } else {
          throw e;
        }
      }
    }

    console.log('✅ 迁移完成');

    // 验证表
    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `);
    console.log('\n📋 现有表:');
    tables.rows.forEach((t: any) => console.log(`  - ${t.name}`));

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

function getBuiltinSchema(): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','child')),
      display_name TEXT NOT NULL,
      parent_id INTEGER,
      selected_child_id INTEGER,
      cert_pref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES users(id),
      FOREIGN KEY(selected_child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL DEFAULT 5,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      child_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      reward_name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS castle_state (
      child_id INTEGER PRIMARY KEY,
      sunlight INTEGER NOT NULL DEFAULT 0,
      star_coins INTEGER NOT NULL DEFAULT 0,
      prosperity INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_settled_day TEXT,
      shield_equipped INTEGER NOT NULL DEFAULT 0,
      last_stolen INTEGER NOT NULL DEFAULT 0,
      skin TEXT NOT NULL DEFAULT 'default',
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS moko_owned (
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
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      child_done_at DATETIME,
      confirmed_at DATETIME,
      UNIQUE(child_id, day, subject),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      UNIQUE(child_id, item_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS troublemakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      moko_key TEXT NOT NULL,
      day TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mistakes (
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
      source_module TEXT,
      chapter TEXT,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS growth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      type TEXT NOT NULL,
      emoji TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS story_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS daily_practice (
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
    );

    CREATE TABLE IF NOT EXISTS capture_tickets (
      child_id INTEGER PRIMARY KEY,
      total INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS story_read (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS story_quiz (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      passed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cert_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      decided_at DATETIME,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS module_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      module_key TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 0,
      rounds INTEGER NOT NULL DEFAULT 0,
      last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, subject, module_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS child_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      task_key TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, task_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS textbook_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      book_key TEXT NOT NULL,
      chapter_idx INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, book_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );
  `;
}

runMigrations();