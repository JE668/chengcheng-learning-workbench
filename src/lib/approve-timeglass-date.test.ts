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
import { addDays, dateStr } from '@/lib/date';

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

  it('⚠️ 批准成功的文案里日期不得重复拼接、也不得出现两次', async () => {
    // 真实缺陷（家长端反馈）：原实现是
    //   day.slice(5).replace('-','月') + '月' + day.slice(8) + '日'
    // 而 slice(5).replace 本身已是「09月26」，于是显示成
    //   ✅ 已批准！09月26月26日 补打卡成功，09月26月26日 语文、数学、英语 已补打卡…
    // 既错（月26月26）又重复（日期出现两遍）。
    const day = addDays(dateStr(), -1); // 昨天，必定落在 30 天窗口内
    const mm = day.slice(5, 7);
    const dd = day.slice(8, 10);
    const label = `${mm}月${dd}日`;

    const wishId = await seedWish(`⏳ 申请时光沙漏（补 ${label}）`);
    const res = await POST(req({ wishId, action: 'approve' }));
    const body = await res.json();
    console.log('  approve -> status=' + res.status + ' ' + String(body.message).slice(0, 120));

    expect(res.status).toBe(200);
    const msg = String(body.message);
    expect(msg).toContain(label);
    expect(msg, '月份被重复拼接').not.toContain(`${mm}月${dd}月`);
    // 日期只应出现一次（原先句首一次、科目列表前又一次）
    expect(msg.split(label).length - 1, `日期出现了多次：${msg}`).toBe(1);
  });
});
