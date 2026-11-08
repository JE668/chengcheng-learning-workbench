// E2E 专用：为 /mistakes 准备一条今天到期的错题。
// 前提：pnpm seed 已初始化测试库和 cara 账号。
// 只操作 TURSO_URL 指定的测试库；不修改种子账号。
import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL || 'file:local.db';
const db = createClient({ url });

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
