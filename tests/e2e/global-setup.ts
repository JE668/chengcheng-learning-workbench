import { createClient } from '@libsql/client';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const dbURL = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbURL) {
  throw new Error('e2e global setup: TURSO_URL is required');
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/login`);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`e2e global setup: server unavailable at ${baseURL}`, {
    cause: lastError,
  });
}

async function ensureSeedAccounts() {
  const response = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'cara', password: '0000' }),
  });
  if (!response.ok) {
    throw new Error(`e2e global setup: cara login failed (HTTP ${response.status})`);
  }
}

async function seedOfflineReview() {
  const db = createClient({ url: dbURL, ...(authToken ? { authToken } : {}) });
  try {
    const childResult = await db.execute({
      sql: "SELECT id FROM users WHERE username = 'cara' LIMIT 1",
      args: [],
    });
    const childId = childResult.rows[0]?.id;
    if (childId == null) throw new Error('e2e global setup: cara account not found');

    await db.execute({
      sql: 'DELETE FROM mistakes WHERE child_id = ? AND prompt = ? AND answer = ?',
      args: [childId, 'e2e-offline-seed-prompt', 'B'],
    });
    await db.execute({
      sql: `INSERT INTO mistakes
        (child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved)
        VALUES (?, '语文', 'e2e', 'e2e-offline-seed-prompt', 'B', 'A', date('now', 'localtime'), 1, 3, 2.3, 0)`,
      args: [childId],
    });
  } finally {
    db.close();
  }
}

export default async function globalSetup() {
  await waitForServer();
  await ensureSeedAccounts();
  await seedOfflineReview();
}
