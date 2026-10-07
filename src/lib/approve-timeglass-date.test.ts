// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({ id: 9001, username: 'p', role: 'parent' })),
  verifyPassword: vi.fn(() => true),
  resolveChildId: vi.fn(async () => 9002),
}));

import { POST } from '@/app/api/castle/approve-timeglass/route';
import { getDb, ensureSchema } from '@/lib/db';

function req(body: unknown): NextRequest {
  return new Request('http://l/api/castle/approve-timeglass', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function seedWish(text: string): Promise<number> {
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (9001,'p','x','parent','爸妈')",
    args: [],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (9002,'c2','x','child','娃',9001)",
    args: [],
  });
  const r = await db.execute({
    sql: "INSERT INTO wishes (child_id, text, status) VALUES (9002, ?, 'pending')",
    args: [text],
  });
  const rows = await db.execute({ sql: 'SELECT last_insert_rowid() AS id', args: [] });
  return Number(rows.rows[0].id);
}

describe('approve-timeglass · 孩子可控文案不得直接用于补卡', () => {
  beforeEach(async () => {
    await ensureSchema();
  });

  it('攻击：申请「补 12月31日」（未来日期）必须被拒', async () => {
    const wishId = await seedWish('⏳ 申请时光沙漏（补 12月31日）');
    const res = await POST(req({ wishId, action: 'approve' }));
    const body = await res.json();
    console.log('  future -> status=' + res.status + ' ' + JSON.stringify(body).slice(0, 140));
    expect(res.status).toBe(400);
  });

  it('攻击：申请「补 01月01日」（今年年初，通常远超 30 天）必须被拒', async () => {
    const wishId = await seedWish('⏳ 申请时光沙漏（补 01月01日）');
    const res = await POST(req({ wishId, action: 'approve' }));
    const body = await res.json();
    console.log('  old -> status=' + res.status + ' ' + JSON.stringify(body).slice(0, 140));
    expect(res.status).toBe(400);
  });

  it('无日期的旧申请走兼容分支（发沙漏），不报错', async () => {
    const wishId = await seedWish('⏳ 申请时光沙漏');
    const res = await POST(req({ wishId, action: 'approve' }));
    const body = await res.json();
    console.log('  no-date -> status=' + res.status + ' ' + JSON.stringify(body).slice(0, 140));
    expect(res.status).toBe(200);
  });
});
