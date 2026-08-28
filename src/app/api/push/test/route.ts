import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db-core';
import { sendPushNotification } from '@/lib/push-notifications';

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

    const { title, body, variant = 'info' } = await req.json();

    const db = getDb();
    const subs = await getDb().execute({
      sql: 'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE child_id = ?',
      args: [childId],
    });

    const subscriptions = subs.rows.map((row: any) => ({
      endpoint: row.endpoint,
      expirationTime: null,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    }));

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: '没有可用的推送订阅' }, { status: 404 });
    }

    const { sendPushNotification } = await import('@/lib/push-notifications');
    
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await sendPushNotification(sub, {
            title: '🧪 测试通知',
            body: '这是一条测试推送通知，说明推送功能正常工作！',
            icon: '/icon-192.png',
            data: { type: 'test' },
          });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })
    );

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({ 
      ok: true, 
      sent: success, 
      failed,
      total: subscriptions.length 
    });
  } catch (error) {
    console.error('Test push error:', error);
    return NextResponse.json({ error: '发送测试推送失败' }, { status: 500 });
  }
}