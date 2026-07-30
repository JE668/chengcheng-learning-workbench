import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
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
