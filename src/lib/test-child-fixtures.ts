/**
 * 测试用的子账号夹具（仅供 *.test.ts 引用，生产代码不导入）。
 *
 * ## 为什么需要它
 * libsql 的原生 sqlite3 后端**默认开启外键约束**（不同于 sqlite3 CLI）。
 * 只要 users 行被任何 `FOREIGN KEY(child_id) REFERENCES users(id)` 的表引用，
 * `DELETE FROM users` 就会抛 SQLITE_CONSTRAINT_FOREIGNKEY。
 *
 * schema 里这样的子表共 **16 张**，逐个手写清理列表极易漏 —— 漏哪张就在
 * 下一个用例里炸出来，且报错信息与真正原因相距很远（本次连续踩了 3 次：
 * castle_state → capture_tickets → inventory）。
 *
 * 这里直接从 schema 源文件解析出完整列表，避免手工维护。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getDb, ensureSchema } from '@/lib/db';

/**
 * 从 src/lib/schema.ts 解析出所有「带 child_id 且外键指向 users(id)」的子表名。
 *
 * ⚠️ 两个过滤条件缺一不可：
 *   ① 排除 users 自身 —— 它是 `parent_id REFERENCES users(id)`，没有
 *      child_id 列，按 child_id 去删会报 "no such column: child_id"；
 *   ② 只保留真正含 child_id 列的表 —— sessions 以 token 为主键，
 *      同样没有 child_id。
 */
export function childFkTables(): string[] {
  const schemaPath = path.resolve(process.cwd(), 'src/lib/schema.ts');
  const src = readFileSync(schemaPath, 'utf8');
  const blocks = [...src.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\`,/g)];
  return blocks
    .filter(([, name, body]) => /REFERENCES\s+users\(id\)/i.test(body) && /child_id/.test(body))
    .map(([, name]) => name)
    .filter((n) => n !== 'users');
}

/**
 * 重建一个干净的测试子账号：清空其所有子表数据、删除并重建 users 行。
 *
 * @param id       子账号 id
 * @param username 用户名（重建 users 行时用）
 * @param parentId 归属家长 id；不传则为无家长的独立账号
 */
export async function seedChild(id: number, username: string, parentId?: number): Promise<void> {
  await ensureSchema();
  const db = getDb();
  // 顺序要求：先删所有引用 users 的子表，最后才能删 users 行本身
  for (const t of childFkTables()) {
    await db.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [id] });
  }
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
  await db.execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, ?, '', 'child', ?, ?)`,
    args: [id, username, username, parentId ?? null],
  });
}

/** 同样用于家长账号。 */
export async function seedParent(id: number, username: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  for (const t of childFkTables()) {
    await db.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [id] });
  }
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
  await db.execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'parent', ?)`,
    args: [id, username, username],
  });
}
