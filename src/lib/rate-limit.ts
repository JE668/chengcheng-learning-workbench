/**
 * 简单内存级限流器（单实例、固定窗口）。
 * 适合单节点部署（用户 NAS/轻量云）；无 Redis 依赖。
 * key 通常用 `${ip}:${action}` 或 `${userId}:${action}`，避免 IP 共享/代理场景误伤登录用户。
 */

export interface RateLimitRule {
  windowSeconds: number;
  maxRequests: number;
}

/**
 * 注：登录限流的窗口/上限在 `api/auth/login/route.ts` 里就地定义（LOGIN_LIMIT），
 * 读同一组环境变量 LOGIN_RATE_LIMIT_WINDOW / LOGIN_RATE_LIMIT_MAX。
 * 此前这里还留了一份同名的私有常量，从未被引用 —— 调参的人改这里不会有任何效果，
 * 属于会误导人的重复配置，已删除。
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

/**
 * 两个 Map 的条目上限。key 可能来自请求（IP / 用户名），不设上限就会被
 * 「大量不同 key」的请求撑爆内存——尤其是按用户名统计的 failStore。
 */
const MAX_RATE_ENTRIES = 5000;
const MAX_FAIL_ENTRIES = 2000;

/** 达到上限时先清过期项，仍满则淘汰最早的条目（Map 保持插入顺序）。 */
function evictIfFull<T extends { resetAt: number }>(map: Map<string, T>, now: number, max: number) {
  if (map.size < max) return;
  for (const [k, v] of map) {
    if (v.resetAt <= now) map.delete(k);
  }
  while (map.size >= max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

let lastCleanup = 0;
const CLEANUP_INTERVAL = 60; // 每 60 秒清理一次过期 key

function cleanupStore() {
  const now = nowSec();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
  for (const [k, v] of failStore) {
    if (v.resetAt <= now) failStore.delete(k);
  }
}

export function rateLimit(
  key: string,
  rule: RateLimitRule
): { ok: true; remaining: number } | { ok: false; retryAfter: number } {
  cleanupStore();
  const now = nowSec();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    evictIfFull(store, now, MAX_RATE_ENTRIES);
    store.set(key, { count: 1, resetAt: now + rule.windowSeconds });
    return { ok: true, remaining: rule.maxRequests - 1 };
  }
  if (bucket.count >= rule.maxRequests) {
    return { ok: false, retryAfter: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: rule.maxRequests - bucket.count };
}

/**
 * 取客户端 IP（用作限流 key）。
 *
 * ⚠️ 取 X-Forwarded-For 的**最后一跳**，不是第一个。
 * 反代（Nginx / Caddy / Cloudflare Tunnel）会把真实客户端 IP 追加到列表末尾，
 * 而请求方自己伪造的值只会出现在前面。原来取第一个值等于把限流 key 交给攻击者：
 * 每个请求换一个假 IP 就能绕过全部限流（登录爆破、TTS 滥用）。
 *
 * 注意：若部署时前面**没有**反代，XFF 完全由客户端控制，届时应在反代层
 * 用 proxy_set_header 覆盖该头，或只信任 x-real-ip。
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/* ----------------------------- 账号级防爆破（锁定） ----------------------------- */
/**
 * 针对「已知用户名」的定向爆破：仅按 IP 限流挡不住攻击者轮换 IP 反复试同一个账号密码。
 * 这里额外按 username 累计连续失败次数，达到阈值后锁定一段时间（内存级，单实例适用）。
 */

/** 连续失败达到该次数即锁定（可通过环境变量覆盖） */
export const MAX_LOGIN_FAILS = Number(process.env.MAX_LOGIN_FAILS) || 5;
/** 锁定持续时间（秒，可通过环境变量覆盖） */
export const LOGIN_LOCK_SECONDS = Number(process.env.LOGIN_LOCK_SECONDS) || 15 * 60;

const failStore = new Map<string, { count: number; resetAt: number }>();

/** 查询某账号当前是否被锁定 */
export function loginLockout(username: string): { ok: true } | { ok: false; retryAfter: number } {
  cleanupStore();
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
    // 用户名可被任意伪造，先做容量控制再写入，避免内存无界增长。
    evictIfFull(failStore, now, MAX_FAIL_ENTRIES);
    failStore.set(username, { count: 1, resetAt: now + LOGIN_LOCK_SECONDS });
    return;
  }
  b.count += 1;
}

/** 登录成功后清除该账号的失败计数 */
export function clearLoginFailure(username: string): void {
  failStore.delete(username);
}

/**
 * 仅供测试：清空所有限流计数。
 *
 * store / failStore 是模块级 Map，测试之间会互相累加
 * （同一 user.id 跨用例累加导致后续用例莫名 429）。
 * 生产代码不应调用 —— 通过命名与注释双重标注。
 */
export function __resetRateLimitsForTests(): void {
  store.clear();
  failStore.clear();
}
