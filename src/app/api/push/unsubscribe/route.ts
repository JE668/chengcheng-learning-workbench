import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db-core';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const childId = await resolveChildId(user);
    if (!childId) {
      return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: '缺少 endpoint' }, { status: 400 });
    }

    const db = getDb();
    
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE child_id = ? AND endpoint = ?',
      args: [childId, endpoint],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json({ error: '取消订阅失败' }, { status: 500 });
  }
}