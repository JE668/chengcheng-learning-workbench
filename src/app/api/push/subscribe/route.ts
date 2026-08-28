import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db-core';
import { getVapidPublicKey, sendPushNotification } from '@/lib/push-notifications';

export async function GET() {
  try {
    return NextResponse.json({
      publicKey: getVapidPublicKey(),
    });
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return NextResponse.json({ error: 'Failed to get VAPID public key' }, { status: 500 });
  }
}

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

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: '无效的订阅信息' }, { status: 400 });
    }

    const db = getDb();
    
    // 存储订阅信息
    await db.execute({
      sql: `INSERT INTO push_subscriptions (child_id, endpoint, p256dh, auth, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(endpoint) DO UPDATE SET
              p256dh = excluded.p256dh,
              auth = excluded.auth,
              updated_at = CURRENT_TIMESTAMP`,
      args: [childId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
    });

    // 发送欢迎通知
    await sendWelcomeNotification(childId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: '订阅失败' }, { status: 500 });
  }
}

async function sendWelcomeNotification(childId: number) {
  // 延迟发送，避免阻塞响应
  setTimeout(async () => {
    try {
      const db = getDb();
      const subs = await db.execute({
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

      const { sendPushNotification } = await import('@/lib/push-notifications');
      
      await Promise.all(
        subscriptions.map(async (sub) => {
          await sendPushNotification(sub, {
            title: '🎉 推送通知已开启',
            body: '您将收到学习提醒、奖励通知等重要消息',
            icon: '/icon-192.png',
            data: { type: 'welcome' },
          });
        })
      );
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  }, 1000);
}