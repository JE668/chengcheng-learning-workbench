/**
 * 家长改孩子密码的越权防护回归测试（路由：src/app/api/child/password/route.ts）。
 *
 * ## 这个路由在防什么
 * 家长可以重置自己名下孩子的密码。防线是单条 UPDATE 里的三个条件：
 *
 *   WHERE parent_id = ? AND username = ? AND role = 'child'
 *
 * 这是全站价值最高的越权防线 —— 少任何一个 WHERE 条件，后果分别是：
 *  - 少 parent_id  → 家长能改**别家孩子**的密码（横向越权，等于接管他人账号）
 *  - 少 role       → 家长能改**家长自己**或其它角色账号的密码（提权）
 *  - 少 rowsAffected 校验 → 改��成功时仍返回 ok（静默失败）
 *
 * 这些断言在防线上任一条件被破坏时必然失败（三个条件逐一验证过：
 * 去掉 parent_id → 5 项失败；去掉 username → 3 项失败；去掉 role → 1 项失败）。
 *
 * ## 验证有效性时踩过的两个坑（记录下来避免重复）
 * ① **断言不能只看状态码**。「家长 A 改家长 A 自己」在缺 role 条件时本来
 *    就会被 parent_id 挡掉，所以最初那版测试破坏 role 条件后仍然全绿。
 *    必须造一行 `parent_id=自己` 但 `role≠'child'` 的异常数据，才测得到
 *    role 条件的真实作用。该用例还加了**前置断言**确认这行数据真的建成 ——
 *    外键约束一旦让它静默插入失败，用例会「因为数据不存在」而虚假通过。
 * ② **用行替换做破坏，别用字符串替换**。路由里的 SQL 用双引号包裹、内部含
 *    单引号（role = 'child'），通过 shell 传 Python 做 replace 时转义层层
 *    吃掉引号，替换目标根本没匹配上 —— 看起来「验证后全绿」，实际文件根本没
 *    被改过。改成按行定位 + 打印破坏后的真实内容才可靠。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PARENT_A = 6201;
// 避免 TS 把字面量窄化成 'parent'（currentUser 变量需要能承载两种角色）
type Role = 'parent' | 'child';
const CHILD_ROLE: Role = 'child';
const PARENT_ROLE: Role = 'parent';
const PARENT_B = 6202;
const CHILD_A = 6211;
const CHILD_B = 6212;

let currentUser: { id: number; username: string; role: Role; displayName: string } = {
  id: PARENT_A,
  username: 'pa',
  role: PARENT_ROLE,
  displayName: '家长A',
};

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    getCurrentUser: vi.fn(async () => currentUser),
    resolveChildId: vi.fn(async () => CHILD_A),
    requireParent: vi.fn(() => null),
    requireChild: vi.fn((u: unknown) => u),
  };
});

import { getDb, ensureSchema } from '@/lib/db';
import { POST } from '@/app/api/child/password/route';

const req = (body: unknown) =>
  new Request('http://localhost/api/child/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;

/** 读取某账号的密码哈希，验证「是否真的被改动了」。 */
async function hashOf(id: number): Promise<string> {
  const r = await getDb().execute({
    sql: 'SELECT password_hash FROM users WHERE id = ?',
    args: [id],
  });
  return String(r.rows[0]?.password_hash ?? '');
}

beforeEach(async () => {
  await ensureSchema();
  await getDb().execute({ sql: 'DELETE FROM users WHERE id >= ?', args: [6200] });

  // 家长 A 与家长 B，各自一个孩子
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, 'pa', 'hash-A', 'parent', '家长A')`,
    args: [PARENT_A],
  });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, 'pb', 'hash-B', 'parent', '家长B')`,
    args: [PARENT_B],
  });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, 'ka', 'child-A', 'child', '娃A', ?)`,
    args: [CHILD_A, PARENT_A],
  });
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, 'kb', 'child-B', 'child', '娃B', ?)`,
    args: [CHILD_B, PARENT_B],
  });
  // 额外造一个「parent_id 恰好指向 PARENT_A、但角色不是 child」的账号。
  // 正常数据下不会出现（parent_id 只在 role='child' 时写入），但它正是
  // `AND role = 'child'` 这道条件的**唯一存在理由**：
  // 一旦某天 seed/迁移/导入写出了这种行，没有 role 条件的 SQL 就会
  // 让家长改到非孩子账号的密码。
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, 'weird', 'hash-weird', 'parent', '异常账号', ?)`,
    args: [6213, PARENT_A],
  });
  currentUser = { id: PARENT_A, username: 'pa', role: PARENT_ROLE, displayName: '家长A' };
});

describe('POST /api/child/password · 越权防护', () => {
  it('家长能改自己孩子的密码', async () => {
    const res = await POST(req({ childUsername: 'ka', newPassword: 'newpass1' }));
    expect(res.status).toBe(200);
    expect(await hashOf(CHILD_A)).not.toBe('child-A');
  });

  it('不能改别家孩子的密码（横向越权）', async () => {
    const res = await POST(req({ childUsername: 'kb', newPassword: 'evil1234' }));
    expect(res.status).toBe(404);
    // 关键：不仅状态码要对，目标行必须**真的没被动过**
    expect(await hashOf(CHILD_B), '别家孩子的密码被改掉了（横向越权）').toBe('child-B');
  });

  it('不能改家长账号的密码（提权）', async () => {
    const res = await POST(req({ childUsername: 'pa', newPassword: 'evil1234' }));
    expect(res.status).toBe(404);
    expect(await hashOf(PARENT_A), '家长自己的密码被改掉了（提权）').toBe('hash-A');
  });

  it('不能改其它家长账号的密码', async () => {
    const res = await POST(req({ childUsername: 'pb', newPassword: 'evil1234' }));
    expect(res.status).toBe(404);
    expect(await hashOf(PARENT_B), '其它家长账号的密码被改掉了').toBe('hash-B');
  });

  it('家长 B 改自家孩子成功（确认不是「所有人都失败」的假通过）', async () => {
    currentUser = { id: PARENT_B, username: 'pb', role: PARENT_ROLE, displayName: '家长B' };
    const res = await POST(req({ childUsername: 'kb', newPassword: 'newpass2' }));
    expect(res.status).toBe(200);
    expect(await hashOf(CHILD_B)).not.toBe('child-B');
  });

  it('不能改 parent_id 指向自己、但角色不是 child 的账号（role 条件的守卫）', async () => {
    // 缺 role 条件时这条 SQL 会命中 id=6213（parent_id=PARENT_A），
    // 家长就能改到非孩子账号的密码 —— 提权。
    // 前置断言：确认这行异常数据真的建成了（否则本用例会因为「数据不存在」
    // 而虚假通过 —— 曾经踩过：外键约束让插入静默失败，测试看起来全绿）
    const row = await getDb().execute({
      sql: 'SELECT role, parent_id FROM users WHERE username = ?',
      args: ['weird'],
    });
    expect(Number(row.rows.length), '异常数据行没建成，本用例会虚假通过').toBe(1);

    const res = await POST(req({ childUsername: 'weird', newPassword: 'evil1234' }));
    expect(res.status).toBe(404);
    expect(await hashOf(6213), '非 child 角色的账号被改密了（role 条件失效）').toBe('hash-weird');
  });

  it('密码短于 4 位返回 400 且不改任何数据', async () => {
    const res = await POST(req({ childUsername: 'ka', newPassword: '123' }));
    expect(res.status).toBe(400);
    expect(await hashOf(CHILD_A)).toBe('child-A');
  });

  it('缺少 childUsername 返回 400', async () => {
    const res = await POST(req({ newPassword: 'valid123' }));
    expect(res.status).toBe(400);
  });

  it('孩子角色调用返回 403', async () => {
    currentUser = { id: CHILD_A, username: 'ka', role: CHILD_ROLE, displayName: '娃A' };
    const res = await POST(req({ childUsername: 'kb', newPassword: 'evil1234' }));
    expect(res.status).toBe(403);
    expect(await hashOf(CHILD_B), '孩子角色改掉了别家孩子的密码').toBe('child-B');
  });

  it('未登录返回 403', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const res = await POST(req({ childUsername: 'ka', newPassword: 'evil1234' }));
    expect(res.status).toBe(403);
    expect(await hashOf(CHILD_A)).toBe('child-A');
  });
});
