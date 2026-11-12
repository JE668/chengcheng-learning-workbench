import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { dateStr } from '@/lib/date';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LEN = 300;
const MAX_ITEMS = 10;
const ALLOWED_SOURCES = new Set(['client', 'server']);

/**
 * 🩹 应用错误轻量落库（客户端 window.onerror / unhandledrejection 的本地镜像）。
 *
 * 设计取舍（家庭自部署场景）：
 *  - Sentry 上报到云端，家长不会看后台；这里把异常聚合计数留在本地库，
 *    周日周报可以顺带说一句「本周应用异常 N 次」。
 *  - 按 (day, source, message) 聚合 UPSERT 计数，同一错误反复发生不膨胀表。
 *  - 未登录也允许上报（错误往往发生在登录态异常时），但限流靠幂等聚合 +
 *    每请求最多 10 条 + message 截断，不设独立限流器。
 */
export async function POST(req: Request) {
  let items: unknown;
  try {
    const body = (await req.json()) as { items?: unknown };
    items = body.items;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 });
  }

  const db = getDb();
  const user = await getCurrentUser().catch(() => null);
  const day = dateStr();
  const who = user ? String(user.id) : null;
  let accepted = 0;

  for (const raw of items.slice(0, MAX_ITEMS)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const item = raw as { source?: unknown; message?: unknown };
    const source =
      typeof item.source === 'string' && ALLOWED_SOURCES.has(item.source) ? item.source : null;
    const message = typeof item.message === 'string' ? item.message.slice(0, MAX_MESSAGE_LEN) : '';
    if (!source || !message) continue;

    // message 里的孩子 id / 用户 id 抹掉，避免把可识别信息写进错误聚合
    const clean = who ? message.replaceAll(`#${who}`, '#<self>') : message;

    await db.execute({
      sql: `INSERT INTO app_error_log (day, source, message, count)
            VALUES (?, ?, ?, 1)
            ON CONFLICT (day, source, message)
            DO UPDATE SET count = count + 1, last_seen = CURRENT_TIMESTAMP`,
      args: [day, source, clean],
    });
    accepted += 1;
  }

  return NextResponse.json({ ok: true, accepted });
}
