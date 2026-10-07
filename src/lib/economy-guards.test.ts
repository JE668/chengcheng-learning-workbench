// @vitest-environment node
/**
 * 积分经济系统的入参校验回归测试（对应全量审查发现的 S-2 / S-3）。
 *
 * 覆盖两个「同库姊妹路由已实现、唯独此处遗漏」的校验缺口：
 *
 * - **S-3 任务积分无上界**：`Number(points) || 5` 只拦 falsy 值，
 *   负数 / 1e9 / 小数全部穿透（实测 -999999、1e9、3.5 原样入库），
 *   孩子一键领走十亿积分，或余额被做成负数。
 *
 * - **S-2 兑换状态无白名单**：PATCH 的 status 直接拼进 SQL，
 *   写入任意值会让该笔兑换**从余额扣减中消失**（getChildPoints 只统计
 *   status IN ('pending','approved')），可反复套现积分。
 *
 * 这些断言在修复前必然失败。
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 7001,
    username: 'econ-parent',
    role: 'parent',
    displayName: '家长',
  })),
  resolveChildId: vi.fn(async () => 7002),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { parseTaskPoints, parseTaskTitle } from '@/lib/tasks-validation';
import { POST as tasksPOST } from '@/app/api/tasks/route';
import { PATCH as redeemPATCH } from '@/app/api/redeem/route';

const PARENT_ID = 7001;
const CHILD_ID = 7002;

function req(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function setup() {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'econ-parent', '', 'parent', '家长')`,
    args: [PARENT_ID],
  });
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, 'econ-child', '', 'child', '娃', ?)`,
    args: [CHILD_ID, PARENT_ID],
  });
}

describe('parseTaskPoints · 任务积分区间校验（单元）', () => {
  it('拒绝负数 / 超大值 / 非数字 / NaN', () => {
    // 修复前这些值会原样穿透 Number(points) || 5
    expect(parseTaskPoints(-999999)).toBeNull();
    expect(parseTaskPoints(1e9)).toBeNull();
    expect(parseTaskPoints(101)).toBeNull();
    expect(parseTaskPoints('abc')).toBeNull();
    expect(parseTaskPoints(Infinity)).toBeNull();
    expect(parseTaskPoints(NaN)).toBeNull();
  });

  it('接受 1~100 的整数，小数向下取整', () => {
    expect(parseTaskPoints(1)).toBe(1);
    expect(parseTaskPoints(100)).toBe(100);
    expect(parseTaskPoints(3.9)).toBe(3);
  });

  it('未传时给默认 5', () => {
    expect(parseTaskPoints(undefined)).toBe(5);
    expect(parseTaskPoints(null)).toBe(5);
    expect(parseTaskPoints('')).toBe(5);
  });
});

describe('parseTaskTitle · 任务名校验', () => {
  it('拒绝空串/纯空白/超长/非字符串', () => {
    expect(parseTaskTitle('')).toBeNull();
    expect(parseTaskTitle('   ')).toBeNull();
    expect(parseTaskTitle('x'.repeat(101))).toBeNull();
    expect(parseTaskTitle(123)).toBeNull();
  });

  it('去除首尾空白后放行', () => {
    expect(parseTaskTitle('  读课文  ')).toBe('读课文');
  });
});

describe('POST /api/tasks · 积分不可越界（S-3 回归）', () => {
  beforeAll(setup);

  beforeEach(async () => {
    await getDb().execute({ sql: 'DELETE FROM tasks', args: [] });
  });

  it('拒绝 points=1e9（修复前会入库）', async () => {
    const res = await tasksPOST(
      req('http://localhost/api/tasks', { title: 'x', subject: '语文', points: 1e9 })
    );
    expect(res.status).toBe(400);
    const rows = await getDb().execute({ sql: 'SELECT * FROM tasks', args: [] });
    expect(rows.rows.length).toBe(0);
  });

  it('拒绝负积分（否则孩子余额会被做成负数）', async () => {
    const res = await tasksPOST(
      req('http://localhost/api/tasks', { title: 'x', subject: '语文', points: -999999 })
    );
    expect(res.status).toBe(400);
  });

  it('合法积分正常入库', async () => {
    const res = await tasksPOST(
      req('http://localhost/api/tasks', { title: '读课文', subject: '语文', points: 20 })
    );
    expect(res.status).toBe(200);
    const row = await getDb().execute({ sql: 'SELECT points FROM tasks', args: [] });
    expect(Number(row.rows[0].points)).toBe(20);
  });
});

describe('PATCH /api/redeem · status 白名单（S-2 回归）', () => {
  let redemptionId: number;

  beforeAll(setup);

  beforeEach(async () => {
    await getDb().execute({ sql: 'DELETE FROM redemptions', args: [] });
    const ins = await getDb().execute({
      sql: "INSERT INTO redemptions (child_id, reward_name, cost, created_by) VALUES (?, '棒棒糖', 30, ?)",
      args: [CHILD_ID, PARENT_ID],
    });
    redemptionId = Number(ins.lastInsertRowid);
  });

  it('拒绝任意非法 status（修复前可写入，使该兑换从余额扣减中消失）', async () => {
    const res = await redeemPATCH(
      req('http://localhost/api/redeem', { id: redemptionId, status: 'whatever' })
    );
    expect(res.status).toBe(400);
    const row = await getDb().execute({
      sql: 'SELECT status FROM redemptions WHERE id = ?',
      args: [redemptionId],
    });
    // 状态必须仍是 pending，未被改成能让 getChildPoints 漏算的值
    expect(String(row.rows[0].status)).toBe('pending');
  });

  it('接受 approved / rejected / pending', async () => {
    for (const st of ['approved', 'rejected', 'pending']) {
      const res = await redeemPATCH(
        req('http://localhost/api/redeem', { id: redemptionId, status: st })
      );
      expect(res.status, `status=${st} 应被接受`).toBe(200);
      const row = await getDb().execute({
        sql: 'SELECT status FROM redemptions WHERE id = ?',
        args: [redemptionId],
      });
      expect(String(row.rows[0].status)).toBe(st);
    }
  });

  it('拒绝非法 id（NaN / 非整数 / 非正数）', async () => {
    for (const badId of ['abc', 0, -1, 1.5]) {
      const res = await redeemPATCH(
        req('http://localhost/api/redeem', { id: badId, status: 'approved' })
      );
      expect(res.status, `id=${badId} 应被拒绝`).toBe(400);
    }
  });
});
