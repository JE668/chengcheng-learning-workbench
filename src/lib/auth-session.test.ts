// @vitest-environment node
/**
 * auth.ts 的会话生命周期与权限边界回归测试。
 *
 * ## 为什么单独测这个文件
 * auth.ts 是全站唯一的「当前用户」真值来源（全部 API 路由都靠 getCurrentUser），
 * 但它此前只有 40% 覆盖率：真正决定安全性的三段——**会话年龄校验、Secure cookie
 * 三态、角色/多娃守卫**——几乎没被断言过。这里补齐关键失败路径，不求行数覆盖。
 *
 * ## next/headers 的 mock 为什么要自己写
 * vitest.setup.ts 把 next/headers 全局 mock 成空壳（cookies().get() 恒为 undefined），
 * 够组件测试用，但测不到「cookie 里放了什么、set 时带了哪些 flag」。本文件的 vi.mock
 * 覆盖 setup 的同名 mock（文件级优先），并记录 set() 的参数供断言。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  headers: new Map<string, string>(),
  setCalls: [] as Array<{ name: string; value: string; opts: Record<string, unknown> }>,
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => jar.headers.get(k.toLowerCase()) ?? null }),
  cookies: async () => ({
    get: (name: string) => {
      const v = jar.cookies.get(name);
      return v === undefined ? undefined : { value: v };
    },
    set: (name: string, value: string, opts: Record<string, unknown>) => {
      jar.setCalls.push({ name, value, opts });
      jar.cookies.set(name, value);
    },
    delete: (name: string) => {
      jar.cookies.delete(name);
    },
  }),
}));

import {
  cleanupExpiredSessions,
  clearSessionCookie,
  createSession,
  deleteSession,
  getCurrentUser,
  hashPassword,
  requireChild,
  requireParent,
  resolveChildId,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';

const PARENT = 7101;
const CHILD_A = 7111;
const CHILD_B = 7112;
const FOREIGN_CHILD = 7113; // 别人家的孩子（parent_id IS NULL，用于 IDOR 断言）

/**
 * 取「当前模块图」里的 db 实例。
 *
 * 为什么不直接用文件顶部的 `import { getDb } from '@/lib/db'`：
 * db-core.ts 的连接是**模块级单例**，而本文件最后一个 describe 会
 * `vi.resetModules()` 后重新 import @/lib/auth（目的见那里的注释：
 * SECURE_COOKIE / SESSION_TTL_DAYS 在模块加载时被固化）。resetModules 让
 * db-core 也重新执行 → 新的 auth 拿到的是**另一个全新的空内存库**，
 * 而顶部的静态绑定仍指向旧实例。混用会写成「测试写 A 库、auth 读 B 库」：
 * 轻则 no such table: sessions，重则断言假通过（查不到东西 ≠ 逻辑正确）。
 * 动态 import 永远解析到当前最新的模块实例，两边才不会分叉。
 */
async function currentDb() {
  const mod = await import('@/lib/db');
  return { db: mod.getDb(), ensureSchema: mod.ensureSchema };
}

/** 在当前模块图的库上执行一条 SQL（理由同 currentDb）。 */
async function exec(sql: string, args: Array<string | number | null> = []) {
  const { db } = await currentDb();
  return db.execute({ sql, args });
}

async function seed() {
  const { db, ensureSchema } = await currentDb();
  await ensureSchema();
  const putUser = (id: number, username: string, role: string, parentId: number | null) =>
    db.execute({
      sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
            VALUES (?, ?, 'hash', ?, ?, ?)`,
      args: [id, username, role, '昵称', parentId],
    });
  await putUser(PARENT, 'auth-parent', 'parent', null);
  await putUser(CHILD_A, 'auth-child-a', 'child', PARENT);
  await putUser(CHILD_B, 'auth-child-b', 'child', PARENT);
  await putUser(FOREIGN_CHILD, 'auth-foreign', 'child', null);
}

/** 造一条指定年龄的会话（created_at 直接写 SQL 时间表达式，避免本机时钟漂移）。 */
async function insertSession(token: string, userId: number, ageDays: number) {
  const { db } = await currentDb();
  await db.execute({
    sql: `INSERT OR REPLACE INTO sessions (token, user_id, created_at)
          VALUES (?, ?, datetime('now', ?))`,
    args: [token, userId, `-${ageDays} days`],
  });
}

async function countSessions(token: string) {
  const { db } = await currentDb();
  const rows = await db.execute({
    sql: 'SELECT COUNT(*) n FROM sessions WHERE token = ?',
    args: [token],
  });
  return Number(rows.rows[0].n);
}

const asChild = () =>
  ({ id: CHILD_A, username: 'auth-child-a', role: 'child', displayName: '娃' }) as const;
const asParent = () =>
  ({ id: PARENT, username: 'auth-parent', role: 'parent', displayName: '家长' }) as const;

beforeEach(async () => {
  jar.cookies.clear();
  jar.headers.clear();
  jar.setCalls.length = 0;
  delete process.env.SECURE_COOKIE;
  delete process.env.SESSION_TTL_DAYS;
  await seed();
});

describe('口令哈希 · 边界', () => {
  it('同一条口令两次哈希不同（加盐生效），但都能校验通过', () => {
    const h1 = hashPassword('s3cret');
    const h2 = hashPassword('s3cret');
    expect(h1).not.toBe(h2);
    expect(verifyPassword('s3cret', h1)).toBe(true);
    expect(verifyPassword('s3cret', h2)).toBe(true);
  });

  it('口令错误返回 false 而不是抛错（登录接口靠返回值分流）', () => {
    expect(verifyPassword('wrong', hashPassword('s3cret'))).toBe(false);
  });

  it('库里 hash 被截断/写坏时返回 false 而不是 500', () => {
    expect(() => verifyPassword('p', 'not-a-bcrypt-hash')).not.toThrow();
    expect(verifyPassword('p', 'not-a-bcrypt-hash')).toBe(false);
    expect(verifyPassword('p', '')).toBe(false);
  });
});

describe('角色守卫 · requireParent / requireChild', () => {
  it('四种组合：只有角色匹配才放行', () => {
    expect(requireParent(asParent() as never)).not.toBeNull();
    expect(requireChild(asChild() as never)).not.toBeNull();
    // 孩子过 requireParent → null（路由据此回 403）
    expect(requireParent(asChild() as never)).toBeNull();
    // 家长过 requireChild → null（家长不能冒充孩子领奖励）
    expect(requireChild(asParent() as never)).toBeNull();
  });

  it('未登录（null）两个守卫都必须拒绝', () => {
    expect(requireParent(null)).toBeNull();
    expect(requireChild(null)).toBeNull();
  });
});

describe('resolveChildId · 多娃越权边界', () => {
  it('无用户 → null（调用方回 401，绝不回退到「全局第一个孩子」）', async () => {
    expect(await resolveChildId(null)).toBeNull();
    expect(await resolveChildId(undefined)).toBeNull();
  });

  it('孩子本人 → 自己的 id', async () => {
    expect(await resolveChildId(asChild() as never)).toBe(CHILD_A);
  });

  it('家长名下无孩子 → null', async () => {
    await exec(
      `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
       VALUES (7199, 'auth-lonely', 'h', 'parent', '无娃家长')`
    );
    expect(
      await resolveChildId({ id: 7199, username: 'x', role: 'parent', displayName: 'y' })
    ).toBeNull();
  });

  it('家长选中第二个孩子 → 返回第二个（多娃切换支点）', async () => {
    await exec('UPDATE users SET selected_child_id = ? WHERE id = ?', [CHILD_B, PARENT]);
    expect(await resolveChildId(asParent() as never)).toBe(CHILD_B);
  });

  it('选中 id 指向别人家孩子时回退到自己第一个孩子（IDOR 防线）', async () => {
    // 真实攻击面：selected_child_id 若能写成任意 id，家长就能看到/改写他人孩子的数据。
    await exec('UPDATE users SET selected_child_id = ? WHERE id = ?', [FOREIGN_CHILD, PARENT]);
    const got = await resolveChildId(asParent() as never);
    expect(got).toBe(CHILD_A);
    expect(got).not.toBe(FOREIGN_CHILD);
  });
});

describe('会话生命周期', () => {
  it('createSession 落库 64 位十六进制 token，getCurrentUser 能认出来', async () => {
    const token = await createSession(PARENT);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    jar.cookies.set('session', token);
    expect(await getCurrentUser()).toMatchObject({
      id: PARENT,
      username: 'auth-parent',
      role: 'parent',
    });
  });

  it('不同用户 token 不同且互不串号', async () => {
    const t1 = await createSession(PARENT);
    const t2 = await createSession(CHILD_A);
    expect(t1).not.toBe(t2);
    jar.cookies.set('session', t2);
    expect((await getCurrentUser())?.role).toBe('child');
  });

  it('无 cookie / 未知 token → null', async () => {
    expect(await getCurrentUser()).toBeNull();
    jar.cookies.set('session', 'deadbeef');
    expect(await getCurrentUser()).toBeNull();
  });

  it('deleteSession 之后 token 立即失效（登出的真值来源）', async () => {
    const token = await createSession(PARENT);
    jar.cookies.set('session', token);
    expect(await getCurrentUser()).not.toBeNull();
    await deleteSession(token);
    expect(await getCurrentUser()).toBeNull();
  });

  it('会话超过 TTL 后即使 cookie 仍在也返回 null（被盗 token 不能永生）', async () => {
    // cookie maxAge 是客户端约束，可被复制/改期；服务端这条 SQL 条件才是真值。
    await insertSession('old-token', PARENT, 8);
    jar.cookies.set('session', 'old-token');
    expect(await getCurrentUser()).toBeNull();
  });

  it('getCurrentUser 只返回 4 个字段，不外泄 password_hash', async () => {
    await exec('UPDATE users SET password_hash = ? WHERE id = ?', [
      hashPassword('super-secret'),
      PARENT,
    ]);
    const token = await createSession(PARENT);
    jar.cookies.set('session', token);
    const u = await getCurrentUser();
    expect(Object.keys(u!).sort()).toEqual(['displayName', 'id', 'role', 'username']);
    expect(JSON.stringify(u)).not.toContain('$2');
  });

  it('用户被删除后 token 一并失效', async () => {
    const token = await createSession(CHILD_A);
    jar.cookies.set('session', token);
    await exec('DELETE FROM sessions WHERE user_id = ?', [CHILD_A]);
    await exec('DELETE FROM users WHERE id = ?', [CHILD_A]);
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('过期会话清理', () => {
  it('cleanupExpiredSessions 只删超期的，不动活跃会话', async () => {
    await insertSession('stale', PARENT, 30);
    await insertSession('fresh', PARENT, 1);
    await cleanupExpiredSessions();
    expect(await countSessions('stale')).toBe(0);
    expect(await countSessions('fresh')).toBe(1);
  });

  it('createSession 顺手修剪（长期运行不把 sessions 表撑爆）', async () => {
    await insertSession('stale2', PARENT, 30);
    await createSession(PARENT);
    expect(await countSessions('stale2')).toBe(0);
  });
});

describe('setSessionCookie / clearSessionCookie', () => {
  it('写入 httpOnly + sameSite=lax + path=/，maxAge 与 TTL 对齐', async () => {
    await setSessionCookie(PARENT);
    expect(jar.setCalls).toHaveLength(1);
    const c = jar.setCalls[0];
    expect(c.name).toBe('session');
    expect(c.value).toMatch(/^[0-9a-f]{64}$/);
    expect(c.opts).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
    expect(c.opts.maxAge).toBe(60 * 60 * 24 * 7);
  });

  it('退出登录：删库里的 token 并把 cookie 置空（maxAge=0）', async () => {
    const token = await createSession(PARENT);
    jar.cookies.set('session', token);
    await clearSessionCookie();
    const last = jar.setCalls.at(-1)!;
    expect(last.value).toBe('');
    expect(last.opts.maxAge).toBe(0);
    expect(await countSessions(token)).toBe(0);
  });

  it('没有 cookie 时退出登录不炸（也不误删别人的会话）', async () => {
    const token = await createSession(PARENT);
    await expect(clearSessionCookie()).resolves.toBeUndefined();
    expect(await countSessions(token)).toBe(1);
  });
});

describe('Secure cookie 三态（SECURE_COOKIE / 反代协议头 / 默认）', () => {
  /**
   * SECURE_COOKIE 与 SESSION_TTL_DAYS 在模块加载时就被固化成模块级常量，
   * 所以每种配置都要 resetModules + 重新 import 才测得到。
   */
  async function loadAuth(env: Record<string, string> = {}) {
    vi.resetModules();
    delete process.env.SECURE_COOKIE;
    delete process.env.SESSION_TTL_DAYS;
    Object.assign(process.env, env);
    // 关键顺序：resetModules 之后必须先把 schema/种子建在**新**的 db 实例上，
    // 再 import auth。db-core 的连接是模块级单例，resetModules 会让 auth 拿到
    // 一个全新的空内存库；不先建表就是 no such table: sessions。
    // seed() 走动态 import，建的正是 auth 稍后会复用的那个实例。
    await seed();
    const mod = await import('@/lib/auth');
    jar.setCalls.length = 0;
    return mod;
  }

  async function secureOf(mod: typeof import('@/lib/auth')) {
    await mod.setSessionCookie(PARENT);
    return jar.setCalls.at(-1)!.opts.secure;
  }

  it('SECURE_COOKIE=true 强制 Secure', async () => {
    expect(await secureOf(await loadAuth({ SECURE_COOKIE: 'true' }))).toBe(true);
  });

  it('SECURE_COOKIE=false 强制不 Secure（纯 http 局域网）', async () => {
    expect(await secureOf(await loadAuth({ SECURE_COOKIE: 'false' }))).toBe(false);
  });

  it('未显式配置 + 反代 x-forwarded-proto: https → Secure', async () => {
    const mod = await loadAuth();
    jar.headers.set('x-forwarded-proto', 'https');
    expect(await secureOf(mod)).toBe(true);
  });

  it('多值协议头只认第一个（防伪造协议头把 Secure 翻成 false）', async () => {
    const mod = await loadAuth();
    jar.headers.set('x-forwarded-proto', 'https, http');
    expect(await secureOf(mod)).toBe(true);
    jar.headers.set('x-forwarded-proto', 'http, https');
    expect(await secureOf(mod)).toBe(false);
  });

  it('未显式配置 + 无协议头 → 不 Secure（误设 true 会让浏览器拒绝存 cookie）', async () => {
    expect(await secureOf(await loadAuth())).toBe(false);
  });

  it('SESSION_TTL_DAYS 同时驱动 cookie maxAge 与服务端会话年龄校验', async () => {
    const mod = await loadAuth({ SESSION_TTL_DAYS: '1' });
    await mod.setSessionCookie(PARENT);
    expect(jar.setCalls.at(-1)!.opts.maxAge).toBe(60 * 60 * 24);

    await insertSession('ttl-old', PARENT, 2);
    jar.cookies.set('session', 'ttl-old');
    expect(await mod.getCurrentUser()).toBeNull();

    await insertSession('ttl-fresh', PARENT, 0);
    jar.cookies.set('session', 'ttl-fresh');
    expect(await mod.getCurrentUser()).not.toBeNull();
  });
});
