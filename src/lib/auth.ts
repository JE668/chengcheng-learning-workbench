import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb, getChildId } from './db';
import { User } from './types';

const COOKIE_NAME = 'session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

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
  return token;
}

export async function deleteSession(token: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
}

export async function setSessionCookie(userId: number) {
  const token = await createSession(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) await deleteSession(token);
  cookies().set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT u.id, u.username, u.role, u.display_name
          FROM sessions s JOIN users u ON s.user_id = u.id
          WHERE s.token = ?`,
    args: [token],
  });
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return { id: Number(r.id), username: String(r.username), role: r.role as 'parent' | 'child', displayName: String(r.display_name) };
}

export function requireAuth(allowed?: ('parent' | 'child')[]) {
  return async function (): Promise<User> {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHORIZED');
    if (allowed && !allowed.includes(user.role)) throw new Error('FORBIDDEN');
    return user;
  };
}

/**
 * 解析「当前要操作的孩子 id」：
 * - 孩子本人 → 自己；
 * - 家长 → 其孩子（多娃后改为「选中的孩子」，目前恒为第一个）。
 * 所有按孩子隔离的查询都应走这里，避免家长接口直接拿客户端传入的 childId，
 * 也便于后续多娃扩展只改这一处。
 */
export async function resolveChildId(user: User): Promise<number | null> {
  if (user.role === 'child') return user.id;
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
