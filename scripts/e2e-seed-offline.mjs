// E2E 专用：为 /mistakes 准备一条今天到期的错题。
// 脚本在 standalone 服务启动前运行，因此这里必须自建用到的表，
// 避免 CI 中「服务端与种子脚本各建一个库」或「建表时序」造成红灯。
// 只操作 TURSO_URL 指定的测试库；不修改种子账号。
import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, ...(authToken ? { authToken } : {}) });

await db.batch(
  [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','child')),
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
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
      error_type TEXT,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
  ],
  'write'
);

async function childId() {
  const rows = await db.execute("SELECT id FROM users WHERE username = 'cara' LIMIT 1");
  if (!rows.rows.length) throw new Error(`seed: cara 不存在（${url}）`);
  return Number(rows.rows[0].id);
}

await db.execute({
  sql: 'DELETE FROM mistakes WHERE child_id = ? AND prompt = ? AND answer = ?',
  args: [await childId(), 'e2e-offline-seed-prompt', 'B'],
});
await db.execute({
  sql: `INSERT INTO mistakes
    (child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved)
    VALUES (?, '语文', 'e2e', 'e2e-offline-seed-prompt', 'B', 'A', date('now', 'localtime'), 1, 3, 2.3, 0)`,
  args: [await childId()],
});
console.log('offline-review seed ready');
