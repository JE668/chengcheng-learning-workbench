import webPush from 'web-push';

/**
 * Web Push 配置
 * 在生产环境中，这些密钥应该存储在环境变量中
 */
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BHU9tTbTawhmhx2UimosgY5OzQu5dw_X6K2YFrg1yemiNPb6LJ2NJEJi4u8FFoAlXtpPlboFOA9bMSTEIGWvKEM',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'H2GuPhVD8DDKdc9iAvcU1ZAI9qfqzN8sZ-IwrxixUOY',
};

webPush.setVapidDetails(
  'mailto:admin@chengcheng-learning.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/badge-72.png',
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: true,
        vibrate: [200, 100, 200],
      })
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // 订阅已失效，需要从数据库中删除
      console.warn('Push subscription expired or invalid:', error.message);
    } else {
      console.error('Failed to send push notification:', error);
    }
    return false;
  }
}

export async function sendPushToMultiple(
  subscriptions: PushSubscription[],
  payload: Parameters<typeof sendPushNotification>[1]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const ok = await sendPushNotification(sub, payload);
      if (ok) success++;
      else failed++;
    })
  );

  return { success, failed };
}