import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeJson } from '@/lib/safe-json';
import { getDb } from '@/lib/db';

// 保存当前孩子的奖状自定义（萌可 + 主题），存到 users.cert_pref。
// 家长端 reports 页会读取此值，保证打印样式与孩子选择一致。
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  let body: { mokoKey?: string; theme?: string } = {};
  try {
    body = await safeJson(req, {});
  } catch {
    /* ignore */
  }
  const mokoKey = typeof body.mokoKey === 'string' ? body.mokoKey : 'heartping';
  const theme = typeof body.theme === 'string' ? body.theme : 'violet';
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET cert_pref = ? WHERE id = ?',
    args: [JSON.stringify({ mokoKey, theme }), user.id],
  });
  return NextResponse.json({ ok: true });
}
