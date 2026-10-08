// @vitest-environment node
/**
 * push/subscribe · push/unsubscribe 的端到端行为（真实 DB，不 mock 数据层）。
 *
 * ## 这条路由此前是**完全坏的**
 * 原 SQL 写的是 `ON CONFLICT(endpoint)`，但表上真实的唯一约束是
 * `UNIQUE(child_id, endpoint)`（见 migrations 的 create_push_subscriptions_table）。
 * SQLite 在**准备语句时**就会拒绝不匹配的 conflict target：
 *
 *   SQLITE_ERROR: ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint
 *
 * 也就是说 POST /api/push/subscribe **每次调用都 500**，Web Push 订阅从未成功过 ——
 * 这正是「路由层没有测试」的代价：整条功能死掉也没人知道。
 *
 * 另外原 SQL 还写 `updated_at = CURRENT_TIMESTAMP`，而该表没有 updated_at 列。
 *
 * 所以本文件**刻意不 mock getDb**，直接打真实 schema —— 只有这样才能发现
 * 「SQL 与表结构不匹配」这类问题。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 8801, role: 'child' } as null | { id: number; role: string },
  childId: 8802 as number | null,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  resolveChildId: vi.fn(async () => h.childId),
}));
// 推送前端 SDK 不参与本测试；只要 isPushConfigured 为真即可走到写库
vi.mock('@/lib/push-notifications', () => ({
  isPushConfigured: true,
  getVapidPublicKey: () =>
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  sendPushNotification: vi.fn(async () => {}),
}));

import { POST as subscribe } from '@/app/api/push/subscribe/route';
import { POST as unsubscribe } from '@/app/api/push/unsubscribe/route';
import { getDb, ensureSchema } from '@/lib/db';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc-123';

function req(body: unknown): NextRequest {
  return new Request('http://l/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function sub(p256dh = 'key-1', auth = 'auth-1') {
  return { subscription: { endpoint: ENDPOINT, keys: { p256dh, auth } } };
}

async function rows() {
  const r = await getDb().execute({
    sql: 'SELECT child_id, endpoint, p256dh, auth FROM push_subscriptions WHERE child_id = ?',
    args: [8802],
  });
  return r.rows;
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: 8801, role: 'child' };
  h.childId = 8802;
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (8801,'push-p','x','parent','p')",
    args: [],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (8802,'push-c','x','child','c',8801)",
    args: [],
  });
  await db.execute({ sql: 'DELETE FROM push_subscriptions WHERE child_id = ?', args: [8802] });
});

describe('push/subscribe · 订阅写入（打真实 schema）', () => {
  it('⚠️ 正常订阅必须成功落库（原实现因 ON CONFLICT 不匹配而必然 500）', async () => {
    const res = await subscribe(req(sub()));
    const body = await res.json();
    console.log('  subscribe -> status=' + res.status + ' ' + JSON.stringify(body));
    expect(res.status, '订阅写入失败：SQL 与表结构不匹配？').toBe(200);
    expect(body.ok).toBe(true);
    const r = await rows();
    expect(r.length).toBe(1);
    expect(String(r[0].p256dh)).toBe('key-1');
  });

  it('⚠️ 同一孩子+同一 endpoint 重复订阅 → 更新密钥而非报错、也不产生第二行', async () => {
    expect((await subscribe(req(sub('key-1', 'auth-1')))).status).toBe(200);
    const res2 = await subscribe(req(sub('key-2', 'auth-2')));
    expect(res2.status, '重复订阅（走 ON CONFLICT 分支）失败').toBe(200);
    const r = await rows();
    expect(r.length, '产生了重复行').toBe(1);
    expect(String(r[0].p256dh)).toBe('key-2');
    expect(String(r[0].auth)).toBe('auth-2');
  });

  it('未登录 → 401，且不落库', async () => {
    h.user = null;
    expect((await subscribe(req(sub()))).status).toBe(401);
    expect((await rows()).length).toBe(0);
  });

  it('没有孩子账号 → 404', async () => {
    h.childId = null;
    expect((await subscribe(req(sub()))).status).toBe(404);
  });

  it('订阅信息不完整 → 400，且不落库', async () => {
    for (const bad of [{}, { subscription: {} }, { subscription: { endpoint: ENDPOINT } }]) {
      const res = await subscribe(req(bad));
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
    expect((await rows()).length).toBe(0);
  });

  it('endpoint 不是安全地址 → 400（复用 push-endpoint 的校验）', async () => {
    const res = await subscribe(
      req({ subscription: { endpoint: 'https://.', keys: { p256dh: 'k', auth: 'a' } } })
    );
    expect(res.status).toBe(400);
    expect((await rows()).length).toBe(0);
  });
});

describe('push/unsubscribe', () => {
  it('取消订阅只删自己孩子的该 endpoint', async () => {
    await subscribe(req(sub()));
    const res = await unsubscribe(req({ endpoint: ENDPOINT }));
    expect(res.status).toBe(200);
    expect((await rows()).length).toBe(0);
  });

  it('缺 endpoint → 400', async () => {
    expect((await unsubscribe(req({}))).status).toBe(400);
  });

  it('未登录 → 401', async () => {
    h.user = null;
    expect((await unsubscribe(req({ endpoint: ENDPOINT }))).status).toBe(401);
  });

  it('删别人的 endpoint 无副作用（作用域按 child_id）', async () => {
    await subscribe(req(sub()));
    const before = (await rows()).length;
    // 换一个孩子身份来删同一个 endpoint
    h.childId = 8803;
    const res = await unsubscribe(req({ endpoint: ENDPOINT }));
    expect(res.status).toBe(200);
    h.childId = 8802;
    expect((await rows()).length, '删到了别的孩子的订阅').toBe(before);
  });
});
