// @vitest-environment node
/**
 * 错题去重的并发回归测试。
 *
 * 背景（真实缺陷）：POST /api/mistakes 原先是「先 SELECT 再 INSERT/UPDATE」，
 * 两步之间没有事务也没有唯一约束。孩子连点两次提交同一道错题（前端重试、
 * 多标签页）时，两个并发请求都会查到「没有未解决记录」，于是各插一条 ——
 * 同一道题在复习列表里出现两次。
 *
 * 为什么不能直接加 UNIQUE(child_id, subject, prompt, answer)：
 * 查询条件含 resolved=0，而 UNIQUE 不带条件会挡住「复习完又错、应当新开一条」的场景。
 * 因此用 withWriteLock + BEGIN IMMEDIATE 把「查 + 写」收成临界区。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = { id: 7801, username: 'm-child', role: 'child' as const, displayName: '娃' };
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => mockUser),
  resolveChildId: vi.fn(async () => mockUser.id),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { POST } from '@/app/api/mistakes/route';

const CHILD = 7801;

function req(body: unknown) {
  return new Request('http://l/api/mistakes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(async () => {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'm-child', '', 'child', '娃')`,
    args: [CHILD],
  });
  await getDb().execute({ sql: 'DELETE FROM mistakes WHERE child_id = ?', args: [CHILD] });
});

async function unresolvedCount(): Promise<number> {
  const r = await getDb().execute({
    sql: 'SELECT COUNT(*) n FROM mistakes WHERE child_id = ? AND resolved = 0',
    args: [CHILD],
  });
  return Number(r.rows[0]?.n ?? 0);
}

describe('POST /api/mistakes · 去重必须原子', () => {
  it('同一道题重复提交只留一条', async () => {
    await POST(req({ subject: '数学', kind: 'calc', prompt: '1+1', answer: '2' }));
    await POST(req({ subject: '数学', kind: 'calc', prompt: '1+1', answer: '2' }));
    expect(await unresolvedCount()).toBe(1);
  });

  it('⚠️ 并发提交同一道错题也只留一条（修复前会插入多行）', async () => {
    const body = { subject: '数学', kind: 'calc', prompt: '3+5', answer: '8' };
    await Promise.all([POST(req(body)), POST(req(body)), POST(req(body))]);
    expect(await unresolvedCount(), '并发提交同一道错题产生了重复行').toBe(1);
  });

  it('不同题目各留一条', async () => {
    await POST(req({ subject: '数学', prompt: '1+1', answer: '2' }));
    await POST(req({ subject: '语文', prompt: '春天', answer: '春' }));
    expect(await unresolvedCount()).toBe(2);
  });
});
