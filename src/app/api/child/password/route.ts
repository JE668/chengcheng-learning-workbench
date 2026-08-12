import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser, hashPassword } from '@/lib/auth';

const MIN_PASSWORD_LEN = 4;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { childUsername, newPassword } = await safeJson(req, {});
  if (!childUsername || typeof childUsername !== 'string') {
    return NextResponse.json({ error: '缺少孩子用户名' }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LEN) {
    return NextResponse.json({ error: `新密码至少 ${MIN_PASSWORD_LEN} 位` }, { status: 400 });
  }

  const db = getDb();
  // 越权防护：只能修改自己名下（parent_id 作用域）的孩子密码，不能改别家孩子。
  const res = await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE parent_id = ? AND username = ? AND role = 'child'",
    args: [hashPassword(newPassword), user.id, childUsername],
  });
  if (Number(res.rowsAffected ?? 0) === 0) {
    return NextResponse.json({ error: '未找到该孩子账号' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
