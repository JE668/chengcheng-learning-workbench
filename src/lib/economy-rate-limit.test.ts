// @vitest-environment node
/**
 * 经济写接口限流回归测试。
 *
 * 背景（真实缺陷）：castle/grant、castle/gift-item、redeem 三条**改变经济状态**的路由
 * 原先都没有任何次数限制：
 *   · castle/grant     —— 单次 1-100 有限，但可无限循环调用
 *   · castle/gift-item —— SQL 是 `qty = qty + 1`，**连单次上限都没有**，循环即无限造沙漏
 * 对比：castle/buy 一直有 5 次/10 秒的限流，说明这是遗漏而非有意设计。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

let currentUser: { id: number; username: string; role: string; displayName?: string } | null = null;

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => currentUser),
  verifyPassword: vi.fn(() => true),
  resolveChildId: vi.fn(async () => currentUser?.id ?? null),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { POST as grantPOST } from '@/app/api/castle/grant/route';
import { POST as giftPOST } from '@/app/api/castle/gift-item/route';

const PARENT = 7601;
const CHILD = 7602;

function post(url: string, body: unknown): NextRequest {
  return new Request('http://l' + url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function resetResources() {
  const db = getDb();
  for (const t of [
    'inventory',
    'castle_state',
    'capture_tickets',
    'moko_owned',
    'daily_checkins',
    'completions',
    'growth_events',
    'redemptions',
  ]) {
    await db.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [CHILD] });
  }
}

beforeEach(async () => {
  await ensureSchema();
  await resetResources();
  await getDb().execute({ sql: 'DELETE FROM users WHERE id >= ?', args: [7600] });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, 'rlp', '', 'parent', '家长')`,
    args: [PARENT],
  });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, 'rlc', '', 'child', '娃', ?)`,
    args: [CHILD, PARENT],
  });
  await getDb().execute({
    sql: 'UPDATE users SET selected_child_id = ? WHERE id = ?',
    args: [CHILD, PARENT],
  });
  await resetResources();
  currentUser = { id: PARENT, username: 'rlp', role: 'parent', displayName: '家长' };
});

describe('经济写接口 · 限流', () => {
  it('castle/grant：连续调用最终被 429 拦下', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 40; i++) {
      const res = await grantPOST(post('/api/castle/grant', { resource: 'sunlight', amount: 1 }));
      statuses.push(res.status);
    }
    expect(statuses[0]).toBe(200);
    expect(statuses).toContain(429);
  });

  it('castle/gift-item：连续调用最终被 429 拦下', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 40; i++) {
      const res = await giftPOST(post('/api/castle/gift-item', { itemKey: 'timeglass' }));
      statuses.push(res.status);
    }
    expect(statuses[0]).toBe(200);
    expect(statuses).toContain(429);
  });

  it('限流按用户隔离：换家长账号后重新放行', async () => {
    for (let i = 0; i < 40; i++) {
      await giftPOST(post('/api/castle/gift-item', { itemKey: 'timeglass' }));
    }
    // 换成另一个家长 id → 独立的限流桶
    currentUser = { id: 7603, username: 'rlp2', role: 'parent', displayName: '家长2' };
    const res = await giftPOST(post('/api/castle/gift-item', { itemKey: 'timeglass' }));
    expect(res.status).not.toBe(429);
  });
});
