/**
 * 简单内存级限流器（单实例、固定窗口）。
 * 适合单节点部署（用户 NAS/轻量云）；无 Redis 依赖。
 * key 通常用 `${ip}:${action}` 或 `${userId}:${action}`，避免 IP 共享/代理场景误伤登录用户。
 */

export interface RateLimitRule {
  windowSeconds: number;
  maxRequests: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function rateLimit(
  key: string,
  rule: RateLimitRule
): { ok: true; remaining: number } | { ok: false; retryAfter: number } {
  const now = nowSec();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + rule.windowSeconds });
    return { ok: true, remaining: rule.maxRequests - 1 };
  }
  if (bucket.count >= rule.maxRequests) {
    return { ok: false, retryAfter: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: rule.maxRequests - bucket.count };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
