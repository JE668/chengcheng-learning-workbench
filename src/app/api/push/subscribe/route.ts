import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getDb } from '@/lib/db-core';
import { getVapidPublicKey, isPushConfigured, sendPushNotification } from '@/lib/push-notifications';

/**
 * 校验推送订阅的 endpoint：必须是公网 https 域名。
 *
 * 背景：这个值会被存库，之后由 web-push 主动向它发起 POST。若不做校验，
 * 任何登录用户（包括孩子的账号）都能把它填成家庭内网地址（如
 * https://192.168.1.1/...），把服务器变成一个内网探测器（SSRF）。
 *
 * 这里不做严格的服务商白名单（各家浏览器用的推送网关不同，白名单容易误伤），
 * 而是要求 https + 域名，并显式排除 IP 字面量与内网后缀——足以切断 SSRF。
 */
function isSafePushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (!host || !host.includes('.')) return false; // 必须是带点的域名，排除 localhost
  // 排除 IP 字面量：IPv4 点分十进制，或任何含冒号的 IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return false;
  // 排除内网/本地后缀
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({
      // enabled=false 时前端不要调用 pushManager.subscribe（公钥为空会直接抛错）
      enabled: isPushConfigured,
      publicKey,
    });
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return NextResponse.json({ error: 'Failed to get VAPID public key' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isPushConfigured) {
      return NextResponse.json({ error: '服务端未配置 Web Push（VAPID 密钥缺失）' }, { status: 503 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const childId = await resolveChildId(user);
    if (!childId) {
      return NextResponse.json({ error: '没有孩子账号' }, { status: 404 });
    }

    const { subscription } = await req.json();
    const keys = subscription?.keys;
    if (!subscription || typeof subscription.endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: '无效的订阅信息' }, { status: 400 });
    }
    if (!isSafePushEndpoint(subscription.endpoint)) {
      return NextResponse.json({ error: '无效的推送服务地址' }, { status: 400 });
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
      args: [childId, subscription.endpoint, keys.p256dh, keys.auth],
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