import { cookies, headers } from 'next/headers';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb, getChildId } from './db';
import { User } from './types';

const COOKIE_NAME = 'session';

// 环境变量配置（带默认值，保持向后兼容）
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS) || 7;
/**
 * 显式配置（三态）：
 *   undefined → 走下面的自动判断（反代 x-forwarded-proto / 默认 false）
 *   'true' / 'false' → 强制
 * ⚠️ 不能在这里就写成 `=== 'true'` 得到 boolean，否则 shouldSecureCookie() 里的
 * 自动判断分支会永远进不去（历史上有这个 bug：反代 HTTPS 下 cookie 不带 Secure）。
 */
const SECURE_COOKIE_RAW = process.env.SECURE_COOKIE;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function createToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: number): Promise<string> {
  const token = createToken();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
    args: [token, userId],
  });
  // 顺手清理过期会话：登录是高频操作，借此把 sessions 表持续修剪，
  // 避免 NAS 自托管（无 Vercel Cron）长期运行后 token 无限累积。
  await cleanupExpiredSessions().catch(() => {});
  return token;
}

export async function deleteSession(token: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
}

/**
 * 清理过期会话：删除 created_at 早于 N 天前的 token。
 * 与 cookie maxAge（7 天）对齐，只删确实失效的会话，不影响活跃登录。
 * 调用点：createSession（每次登录顺手修剪）+ cron/settle（云端每日兜底）。
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM sessions WHERE created_at < datetime('now', '-' || ? || ' days')`,
    args: [SESSION_TTL_DAYS],
  });
}

/**
 * 是否给会话 cookie 打 secure 标记：
 * 自托管通常走 Nginx/Caddy 等反向代理终止 HTTPS，
 * 应用本身看到的是 http（x-forwarded-proto: https）。
 * 优先信任反向代理透传的协议头（取第一个值，防伪造头注入），
 * 无该头时回退到 NODE_ENV === 'production'。
 */
async function shouldSecureCookie(): Promise<boolean> {
  // 显式配置优先（SECURE_COOKIE=true 强制 secure，false 强制不 secure）
  if (SECURE_COOKIE_RAW !== undefined) return SECURE_COOKIE_RAW === 'true';

  try {
    // Next 15：headers() 返回 Promise，必须 await
    const proto = (await headers()).get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
    if (proto === 'https' || proto === 'http') return proto === 'https';
  } catch {
    // headers() 在非请求上下文（如 build 期）可能抛错，忽略并回退。
  }
  // 未知协议（直连且无 x-forwarded-proto 头，如纯 http 局域网访问）时默认 false：
  // 若误设为 true，浏览器会拒绝存储 secure cookie，导致登录态无法保持、反复跳登录。
  return false;
}

export async function setSessionCookie(userId: number) {
  const token = await createSession(userId);
  // Next 15：cookies() 返回 Promise，必须 await 后才能 set/get
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: await shouldSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
  });
}

export async function clearSessionCookie() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (token) await deleteSession(token);
  (await cookies()).set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: await shouldSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = getDb();
  const res = await db.execute({
    // 必须校验会话年龄：清理只在登录/cron 时发生，若不在这里判断，
    // 被盗 token 会在 cookie 过期后依然长期有效。
    sql: `SELECT u.id, u.username, u.role, u.display_name
          FROM sessions s JOIN users u ON s.user_id = u.id
          WHERE s.token = ?
            AND s.created_at > datetime('now', '-' || ? || ' days')`,
    args: [token, SESSION_TTL_DAYS],
  });
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return {
    id: Number(r.id),
    username: String(r.username),
    role: r.role as 'parent' | 'child',
    displayName: String(r.display_name),
  };
}

/**
 * 解析「当前要操作的孩子 id」（统一入口）：
 * - 孩子本人 → 自己；
 * - 家长 → 其选中的孩子（多娃切换支点，逻辑在 getChildId）；
 * - 未登录/无用户 → 返回 null（调用方据此回 401/404）。
 * 与 daily-practice/route.ts 等处的重复实现合并为唯一来源，避免鉴权口径不一致。
 */
export async function resolveChildId(user: User | null | undefined): Promise<number | null> {
  if (!user) return null;
  return getChildId(user);
}

/** 家长专用：非家长返回 null（调用方据此回 403）。 */
export function requireParent(user: User | null): User | null {
  return user && user.role === 'parent' ? user : null;
}

/** 孩子专用：非孩子返回 null。 */
export function requireChild(user: User | null): User | null {
  return user && user.role === 'child' ? user : null;
}
