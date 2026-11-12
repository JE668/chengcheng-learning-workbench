// @vitest-environment node
/**
 * /api/client-error 路由：错误聚合落库的校验与幂等。
 *
 * 风险面：
 *  - source 白名单（client/server 之外的拒绝）；
 *  - message 截断 300 字符、每请求最多 10 条；
 *  - 同 (day, source, message) 聚合 +1 而不是新行；
 *  - 未登录也允许上报（错误常发生在登录态异常时）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  user: null as null | { id: number; role: string },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
}));

vi.mock('@/lib/db', () => {
  const rows: { sql: string; args: unknown[] }[] = [];
  const upserts: Record<string, number> = {};
  return {
    getDb: () => ({
      execute: async ({ sql, args }: { sql: string; args: unknown[] }) => {
        rows.push({ sql, args });
        if (sql.includes('INSERT INTO app_error_log')) {
          const key = String(args[0]) + '|' + String(args[1]) + '|' + String(args[2]);
          upserts[key] = (upserts[key] ?? 0) + 1;
        }
        return { rows: [] };
      },
    }),
    __debug: { rows, upserts },
  };
});

import { POST } from '@/app/api/client-error/route';
import * as dbMod from '@/lib/db';

const debug = (
  dbMod as unknown as {
    __debug: { rows: { sql: string; args: unknown[] }[]; upserts: Record<string, number> };
  }
).__debug;

function req(body: unknown) {
  return new Request('http://l/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  h.user = null;
  debug.rows.length = 0;
  for (const k of Object.keys(debug.upserts)) delete debug.upserts[k];
});

describe('POST /api/client-error', () => {
  it('拒绝空 items / 非数组 / 坏 json', async () => {
    expect((await POST(req({ items: [] }))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    const bad = new Request('http://l/api/client-error', {
      method: 'POST',
      body: 'not json',
    });
    expect((await POST(bad)).status).toBe(400);
  });

  it('source 白名单：未知来源整条拒绝', async () => {
    const res = await POST(
      req({
        items: [
          { source: 'client', message: 'boom' },
          { source: 'hacker', message: 'nope' },
          { message: 'no source' },
        ],
      })
    );
    const json = (await res.json()) as { accepted: number };
    expect(json.accepted).toBe(1);
    expect(debug.rows.filter((r) => r.sql.includes('INSERT INTO app_error_log')).length).toBe(1);
  });

  it('message 截断 300 字符 + 每请求最多 10 条', async () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      source: 'client',
      message: `err-${i}-` + 'x'.repeat(400),
    }));
    const res = await POST(req({ items }));
    const json = (await res.json()) as { accepted: number };
    expect(json.accepted).toBe(10);
    const inserts = debug.rows.filter((r) => r.sql.includes('INSERT INTO app_error_log'));
    expect(inserts.length).toBe(10);
    expect(String(inserts[0].args[2]).length).toBe(300);
  });

  it('同 (day, source, message) 聚合为同一 key 重复 upsert，不膨胀', async () => {
    await POST(req({ items: [{ source: 'client', message: 'same' }] }));
    await POST(req({ items: [{ source: 'client', message: 'same' }] }));
    await POST(req({ items: [{ source: 'client', message: 'same' }] }));
    expect(Object.keys(debug.upserts).length).toBe(1);
    expect(Object.values(debug.upserts)[0]).toBe(3);
  });

  it('未登录也可上报；登录后消息里的自身 id 被抹除', async () => {
    await POST(req({ items: [{ source: 'client', message: 'anon crash #7702' }] }));
    h.user = { id: 7702, role: 'child' };
    await POST(req({ items: [{ source: 'client', message: 'crash for user #7702' }] }));
    const inserts = debug.rows.filter((r) => r.sql.includes('INSERT INTO app_error_log'));
    expect(String(inserts[0].args[2])).toBe('anon crash #7702'); // 未登录不抹
    expect(String(inserts[1].args[2])).toContain('#<self>'); // 登录后抹 id
    expect(String(inserts[1].args[2])).not.toContain('#7702');
  });
});
