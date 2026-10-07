// @vitest-environment node
/**
 * 创建孩子账号的入参校验回归测试（对应全量审查发现的 M-1）。
 *
 * ## 缺陷
 * `POST /api/children` 原先只做 `trim + 非空 + 密码长度≥4`：
 *  - **无限流** —— 创建账号是高价值操作（可批量建弱口令账号供撞库），
 *    而 login（IP+账号双重限流）、parent/reset（每家长 5 次/分）都有，
 *    本路由是鉴权路由里唯一的缺口；
 *  - **用户名无白名单** —— emoji、控制字符、超长串都能写库，
 *    而这些值会出现在登录表单与**证书打印页**上；
 *  - **密码无上界** —— bcryptjs 是纯 JS 实现，超长输入会平白消耗 CPU。
 *
 * 这些断言在修复前必然失败。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 8501,
    username: 'cp-parent',
    role: 'parent',
    displayName: '家长',
  })),
  resolveChildId: vi.fn(async () => 8502),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import {
  parseUsername,
  parseDisplayName,
  parsePassword,
  MIN_CHILD_PASSWORD,
  MAX_CHILD_PASSWORD,
} from '@/lib/children-validation';
import { POST as childrenPOST } from '@/app/api/children/route';
import { __resetRateLimitsForTests } from '@/lib/rate-limit';

const PARENT_ID = 8501;

function req(body: unknown): NextRequest {
  return new Request('http://localhost/api/children', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(async () => {
  await ensureSchema();
  __resetRateLimitsForTests();
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'cp-parent', '', 'parent', '家长')`,
    args: [PARENT_ID],
  });
  // 清理该家长名下孩子，保证每个用例从 0 个开始
  await getDb().execute({ sql: 'DELETE FROM users WHERE parent_id = ?', args: [PARENT_ID] });
});

describe('parseUsername · 用户名白名单', () => {
  it('接受字母/数字/下划线/中文', () => {
    expect(parseUsername('cara')).toBe('cara');
    expect(parseUsername('kid_2024')).toBe('kid_2024');
    expect(parseUsername('程程')).toBe('程程');
    expect(parseUsername('  kid01  ')).toBe('kid01');
  });

  it('拒绝 emoji / 控制字符 / 空格 / SQL 片段 / 超长', () => {
    expect(parseUsername('kid😀'), 'emoji 应被拒').toBeNull();
    expect(parseUsername('a b'), '含空格应被拒').toBeNull();
    expect(parseUsername("' OR 1=1--"), 'SQL 片段应被拒').toBeNull();
    expect(parseUsername('x'.repeat(21)), '超长应被拒').toBeNull();
    expect(parseUsername('')).toBeNull();
    expect(parseUsername(123)).toBeNull();
  });
});

describe('parseDisplayName · 昵称校验', () => {
  it('接受正常昵称（含空格与 emoji）', () => {
    expect(parseDisplayName('程程')).toBe('程程');
    expect(parseDisplayName('爸爸妈妈')).toBe('爸爸妈妈');
    expect(parseDisplayName('小 明')).toBe('小 明');
    expect(parseDisplayName('程程😀')).toBe('程程😀');
  });

  it('拒绝空 / 超长 / 控制字符（控制字符会毁掉证书打印排版）', () => {
    expect(parseDisplayName('')).toBeNull();
    expect(parseDisplayName('   ')).toBeNull();
    expect(parseDisplayName('x'.repeat(21))).toBeNull();
    expect(parseDisplayName('程\n程'), '换行应被拒').toBeNull();
    expect(parseDisplayName('程\t程'), '制表符应被拒').toBeNull();
  });
});

describe('parsePassword · 密码强度', () => {
  it('接受 6~72 位', () => {
    expect(parsePassword('abc123')).toBe('abc123');
    expect(parsePassword('x'.repeat(72))).toHaveLength(72);
  });

  it('拒绝过短（<6）与超长（>72，bcrypt 只取前 72 字节）', () => {
    expect(parsePassword('1234'), '4 位弱口令应被拒').toBeNull();
    expect(parsePassword('x'.repeat(73))).toBeNull();
  });

  it('空密码回落到默认值', () => {
    expect(parsePassword('')).toBe('123456');
    expect(parsePassword(undefined)).toBeNull();
  });
});

describe('POST /api/children · 端到端校验', () => {
  it('拒绝 emoji 用户名', async () => {
    const res = await childrenPOST(
      req({ username: 'kid😀', displayName: '娃', password: 'abc123' })
    );
    expect(res.status).toBe(400);
  });

  it('拒绝 4 位弱口令', async () => {
    const res = await childrenPOST(req({ username: 'kid01', displayName: '娃', password: '1234' }));
    expect(res.status).toBe(400);
  });

  it('拒绝含控制字符的昵称', async () => {
    const res = await childrenPOST(
      req({ username: 'kid01', displayName: '程\n程', password: 'abc123' })
    );
    expect(res.status).toBe(400);
  });

  it('合法输入可创建孩子', async () => {
    const res = await childrenPOST(
      req({ username: 'kid01', displayName: '程程', password: 'abc123' })
    );
    expect(res.status).toBe(200);
    const row = await getDb().execute({
      sql: 'SELECT username, role FROM users WHERE username = ?',
      args: ['kid01'],
    });
    expect(row.rows.length).toBe(1);
    expect(String(row.rows[0].role)).toBe('child');
  });

  it('创建账号受限流保护（修复前无任何限流）', async () => {
    // 连续创建 8 次（超过 5 次/5分钟的阈值），第 6 次起应被限流
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await childrenPOST(
        req({ username: `kid${i}`, displayName: '娃', password: 'abc123' })
      );
      statuses.push(res.status);
    }
    expect(statuses.filter((s) => s === 429).length, '应出现 429 限流').toBeGreaterThan(0);
  });
});
