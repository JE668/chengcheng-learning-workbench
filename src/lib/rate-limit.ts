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

/* ----------------------------- 账号级防爆破（锁定） ----------------------------- */
/**
 * 针对「已知用户名」的定向爆破：仅按 IP 限流挡不住攻击者轮换 IP 反复试同一个账号密码。
 * 这里额外按 username 累计连续失败次数，达到阈值后锁定一段时间（内存级，单实例适用）。
 */

/** 连续失败达到该次数即锁定 */
export const MAX_LOGIN_FAILS = 5;
/** 锁定持续时间（秒） */
export const LOGIN_LOCK_SECONDS = 15 * 60;

const failStore = new Map<string, { count: number; resetAt: number }>();

/** 查询某账号当前是否被锁定 */
export function loginLockout(username: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = nowSec();
  const b = failStore.get(username);
  if (!b || b.resetAt <= now) return { ok: true };
  if (b.count >= MAX_LOGIN_FAILS) return { ok: false, retryAfter: b.resetAt - now };
  return { ok: true };
}

/** 记录一次登录失败（达到阈值后进入锁定窗口） */
export function recordLoginFailure(username: string): void {
  const now = nowSec();
  const b = failStore.get(username);
  if (!b || b.resetAt <= now) {
    failStore.set(username, { count: 1, resetAt: now + LOGIN_LOCK_SECONDS });
    return;
  }
  b.count += 1;
}

/** 登录成功后清除该账号的失败计数 */
export function clearLoginFailure(username: string): void {
  failStore.delete(username);
}
