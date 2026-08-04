import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getChildrenOfParent } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 还原出厂设置：清空「当前家长名下所有孩子」的学习数据，保留账号。
 * 用于正式给孩子使用前清掉测试数据。需输入家长密码确认。
 */
const CHILD_TABLES = [
  'story_read',
  'story_quiz',
  'cert_requests',
  'module_progress',
  'child_tasks',
  'textbook_progress',
  'completions',
  'redemptions',
  'wishes',
  'moko_owned',
  'daily_checkins',
  'inventory',
  'troublemakers',
  'mistakes',
  'growth_events',
  'story_progress',
  'capture_tickets',
  'daily_practice',
  'castle_state',
];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({ password: '' }));
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) {
    return NextResponse.json({ error: '请输入家长密码' }, { status: 400 });
  }

  const db = getDb();
  const hashRes = await db.execute({ sql: 'SELECT password_hash FROM users WHERE id = ?', args: [user.id] });
  const hash = String(hashRes.rows[0]?.password_hash ?? '');
  if (!verifyPassword(password, hash)) {
    return NextResponse.json({ error: '家长密码错误' }, { status: 401 });
  }

  const children = await getChildrenOfParent(user.id);
  const childIds = children.map((c) => c.id);
  if (childIds.length) {
    const stmts: { sql: string; args: (string | number)[] }[] = [];
    for (const id of childIds) {
      for (const t of CHILD_TABLES) {
        stmts.push({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [id] });
      }
      // 清空孩子的奖状自定义（名字/萌可/主题），还原到出厂
      stmts.push({ sql: 'UPDATE users SET cert_pref = NULL WHERE id = ?', args: [id] });
    }
    await db.batch(stmts);
  }

  return NextResponse.json({ ok: true });
}
