import webPush from 'web-push';

/**
 * Web Push 配置。
 *
 * ⚠️ 密钥只能来自环境变量，**绝不允许在源码里写默认值**：
 * 本仓库是 public，硬编码私钥 == 公开泄露（历史上确实泄露过一对，已废弃）。
 *
 * 未配置时整体降级为「推送不可用」，而不是让模块在 import 期抛错——
 * 否则任何 import 到本文件的路由都会 500。
 */
const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

/** 是否已正确配置 VAPID 密钥（前端据此决定要不要申请订阅）。 */
export const isPushConfigured = Boolean(publicKey && privateKey);

if (isPushConfigured) {
  try {
    webPush.setVapidDetails(subject, publicKey, privateKey);
  } catch (error) {
    console.error('[push] VAPID 配置无效，Web Push 已禁用:', error instanceof Error ? error.message : error);
  }
} else {
  console.warn(
    '[push] 未配置 VAPID 密钥（VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY），Web Push 已禁用。' +
      '生成方式：npx web-push generate-vapid-keys'
  );
}

export function getVapidPublicKey(): string {
  return publicKey;
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
  // 未配置 VAPID 时 webPush 会因未 setVapidDetails 而抛错，这里直接短路。
  if (!isPushConfigured) return false;
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

/**
 * 通知「围绕某个孩子」的全部订阅（2026-10-17：给沙漏/愿望申请接上家长推送）。
 *
 * push_subscriptions 按 child_id 存储：家长浏览器订阅时，resolveChildId
 * 解析到当前选中的孩子——「家长订阅」实际落在某个孩子名下。推给该孩子的
 * 全部订阅 = 通知到「在这个孩子视角里开着推送的家长设备」，多娃互不干扰。
 *
 * 设计约束：推送失败**绝不影响业务主流程**（申请已写库，通知是锦上添花），
 * 内部 catch 全部错误只记日志。
 */
export async function notifyChildSubscribers(
  childId: number,
  payload: Parameters<typeof sendPushNotification>[1]
): Promise<{ success: number; failed: number }> {
  try {
    // 动态 import 打破 db → push-notifications 的潜在环（db 不依赖 push，
    // 但保持与 subscribe 路由一致的懒加载模式，避免路由 import 期就碰 DB）
    const { getDb } = await import('./db');
    const subs = await getDb().execute({
      sql: 'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE child_id = ?',
      args: [childId],
    });
    const subscriptions: PushSubscription[] = subs.rows.map((row) => ({
      endpoint: String(row.endpoint),
      expirationTime: null,
      keys: { p256dh: String(row.p256dh), auth: String(row.auth) },
    }));
    if (!subscriptions.length) return { success: 0, failed: 0 };
    return await sendPushToMultiple(subscriptions, payload);
  } catch (error) {
    console.error(
      '[push] notifyChildSubscribers 失败:',
      error instanceof Error ? error.message : error
    );
    return { success: 0, failed: 0 };
  }
}