/**
 * 奖励防伪回归测试（对应 docs/评审修复计划与交接.md 的 P0 批次）。
 *
 * 目的：证明「客户端上报的分数 / 星级」无法被用来伪造奖励。
 * 这些断言在修复前必然失败：
 *   - 游戏积分：POST score 为 1e9 曾可凭空造出十亿积分；
 *   - 模块星级：未知 moduleKey 曾可写入任意行，stars 为 'abc' 曾会写入 NaN。
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// 路由内部通过 @/lib/auth 取用户；测试里固定成一个孩子账号。
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 9001,
    username: 'guard-child',
    role: 'child',
    displayName: '测试娃',
  })),
  resolveChildId: vi.fn(async () => 9001),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { POST as gameCompletePOST } from '@/app/api/tasks/game-complete/route';
import { POST as moduleProgressPOST } from '@/app/api/module-progress/route';

const CHILD_ID = 9001;

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

/**
 * 建库并补一条孩子账号。
 *
 * 注意：libsql 的原生 sqlite3 后端**默认开启外键约束**（不像 sqlite3 CLI 默认关闭），
 * 所以 completions / module_progress 里 child_id 必须指向真实存在的 users 行，
 * 否则写入会直接抛 SQLITE_CONSTRAINT_FOREIGNKEY。
 */
async function prepareDb() {
  await ensureSchema();
  await getDb().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')",
    args: [CHILD_ID, 'guard-child'],
  });
}

describe('奖励防伪 · 游戏积分', () => {
  beforeAll(async () => {
    await prepareDb();
  });

  beforeEach(async () => {
    await getDb().execute({ sql: 'DELETE FROM completions', args: [] });
  });

  it('拒绝未知 gameId（防止用任意字符串刷记录）', async () => {
    const res = await gameCompletePOST(
      jsonRequest('http://localhost/api/tasks/game-complete', {
        gameId: 'not-a-real-game',
        score: 10,
      })
    );
    expect(res.status).toBe(400);
  });

  it('把伪造的超大分数钳制到服务端上限 500', async () => {
    const res = await gameCompletePOST(
      jsonRequest('http://localhost/api/tasks/game-complete', {
        gameId: 'math-challenge',
        score: 1e9,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.gained).toBe(500);

    const row = await getDb().execute({
      sql: 'SELECT points FROM completions WHERE child_id = ?',
      args: [CHILD_ID],
    });
    expect(Number(row.rows[0]?.points)).toBe(500);
  });

  it('合法分数按原值入账（不削减正常奖励）', async () => {
    const res = await gameCompletePOST(
      jsonRequest('http://localhost/api/tasks/game-complete', {
        gameId: 'make-ten',
        score: 42,
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).gained).toBe(42);
  });
});

describe('奖励防伪 · 模块星级', () => {
  beforeAll(async () => {
    await prepareDb();
  });

  beforeEach(async () => {
    await getDb().execute({ sql: 'DELETE FROM module_progress', args: [] });
  });

  it('拒绝未知学习模块', async () => {
    const res = await moduleProgressPOST(
      jsonRequest('http://localhost/api/module-progress', {
        subject: 'chinese',
        moduleKey: 'not-a-module',
        stars: 3,
      })
    );
    expect(res.status).toBe(400);
  });

  it('拒绝非数字星级（原先会写入 NaN）', async () => {
    const res = await moduleProgressPOST(
      jsonRequest('http://localhost/api/module-progress', {
        subject: 'chinese',
        moduleKey: 'pinyin',
        stars: 'abc',
      })
    );
    expect(res.status).toBe(400);
  });

  it('合法模块正常写入', async () => {
    const res = await moduleProgressPOST(
      jsonRequest('http://localhost/api/module-progress', {
        subject: 'chinese',
        moduleKey: 'pinyin',
        stars: 2,
      })
    );
    expect(res.status).toBe(200);
    const row = await getDb().execute({
      sql: 'SELECT stars FROM module_progress WHERE child_id = ? AND subject = ? AND module_key = ?',
      args: [CHILD_ID, 'chinese', 'pinyin'],
    });
    expect(Number(row.rows[0]?.stars)).toBe(2);
  });
});
