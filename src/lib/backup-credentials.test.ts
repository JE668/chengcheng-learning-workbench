// @vitest-environment node
/**
 * 备份/恢复的凭据安全回归测试（对应全量审查发现的 S-1）。
 *
 * 目的：证明**导出的备份文件不含任何密码哈希**，且恢复后账号仍可登录。
 *
 * 背景（真实缺陷）：
 *   `GET /api/backup` 原先对 users 表执行 `SELECT *`，把 `password_hash`
 *   （bcrypt 串）一并写进明文 JSON 导出文件。备份文件会落到用户磁盘 /
 *   微信 / 网盘，一旦外泄等同交出全部账号凭据 —— 而 schema 种子里的
 *   默认口令（parent / 12345678）本就是弱口令，cost=10 离线爆破分钟级。
 *
 * 修复：导出走列白名单（剔除 password_hash）；导入侧在 DELETE 前抓取
 * 现有哈希并按 id 回填，保证恢复后账号照常可登录。
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 8001,
    username: 'backup-parent',
    role: 'parent',
    displayName: '家长',
  })),
  verifyPassword: vi.fn(() => true),
  resolveChildId: vi.fn(async () => 8002),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { GET as backupGET, POST as backupPOST } from '@/app/api/backup/route';

const PARENT_ID = 8001;
const CHILD_ID = 8002;
const PARENT_PLAIN = 'parent-test-pass';

function req(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request('http://localhost/api/backup', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function seedUsers() {
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
          VALUES (?, 'bk-parent', ?, 'parent', '家长')`,
    args: [PARENT_ID, bcrypt.hashSync(PARENT_PLAIN, 10)],
  });
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, 'bk-child', ?, 'child', '娃', ?)`,
    args: [CHILD_ID, bcrypt.hashSync('child-pass', 10), PARENT_ID],
  });
}

describe('备份导出 · 凭据不外泄（S-1 回归）', () => {
  beforeAll(async () => {
    await ensureSchema();
    await seedUsers();
  });

  it('导出结果不含 password_hash 字段（修复前必然失败）', async () => {
    const res = await backupGET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, Record<string, unknown>[]>;
    const users = json.users;
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    users.forEach((u) => {
      expect(
        Object.keys(u),
        `导出的用户行泄露了 password_hash: ${Object.keys(u).join(',')}`
      ).not.toContain('password_hash');
    });
  });

  it('导出的整个 JSON 字符串里不含 bcrypt 哈希特征', async () => {
    const res = await backupGET();
    const text = await res.text();
    // bcrypt 串固定以 $2a$/$2b$/$2y$ 开头
    expect(text, '导出内容中出现 bcrypt 哈希').not.toMatch(/\$2[aby]\$\d\d\$/);
  });

  it('仍保留恢复所需的非敏感列（用户名/角色不能被误删）', async () => {
    const res = await backupGET();
    const json = (await res.json()) as Record<string, Record<string, unknown>[]>;
    const row = json.users.find((u) => u.id === CHILD_ID);
    expect(row).toBeDefined();
    expect(row!.username).toBe('bk-child');
    expect(row!.role).toBe('child');
    expect(row!.parent_id).toBe(PARENT_ID);
  });
});

describe('备份恢复 · 密码回填（防止恢复后无法登录）', () => {
  beforeEach(async () => {
    await seedUsers();
  });

  it('导入不含哈希的备份后，原密码依然可用', async () => {
    // 先用「不含 password_hash」的备份数据导入（模拟 GET 导出的真实产物）
    const backup = {
      data: {
        users: [
          {
            id: PARENT_ID,
            username: 'bk-parent',
            role: 'parent',
            display_name: '家长',
            parent_id: null,
          },
          {
            id: CHILD_ID,
            username: 'bk-child',
            role: 'child',
            display_name: '娃',
            parent_id: PARENT_ID,
          },
        ],
      },
      password: PARENT_PLAIN,
    };
    const res = await backupPOST(req(backup));
    expect(res.status).toBe(200);

    // 关键断言：恢复后家长原密码仍能通过校验（哈希被正确回填，而非清空/占位）
    const row = await getDb().execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [PARENT_ID],
    });
    const restored = String(row.rows[0]?.password_hash ?? '');
    expect(restored).not.toBe('');
    expect(bcrypt.compareSync(PARENT_PLAIN, restored), '恢复后原密码应仍然有效').toBe(true);
  });

  it('备份里不存在的账号拿到的是不可登录的占位哈希，而非默认口令', async () => {
    const backup = {
      data: {
        users: [
          { id: 99999, username: 'ghost', role: 'child', display_name: '幽灵', parent_id: null },
        ],
      },
      password: PARENT_PLAIN,
    };
    const res = await backupPOST(req(backup));
    expect(res.status).toBe(200);

    const row = await getDb().execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [99999],
    });
    const h = String(row.rows[0]?.password_hash ?? '');
    expect(h).not.toBe('');
    // 绝不能是弱口令默认值
    for (const weak of ['12345678', '0000', '123456', 'password']) {
      expect(bcrypt.compareSync(weak, h), `占位哈希竟能以「${weak}」登录`).toBe(false);
    }
  });
});
