/**
 * 定时任务（/api/cron/*）的调用方鉴权。
 *
 * 三个要点：
 * 1. **只接受 Authorization 头**。原先还接受 `?secret=` 查询串 —— 查询串会进入
 *    反向代理与访问日志，也会通过 Referer 外泄，等于把密钥写进日志。
 * 2. **恒定时间比较**：先各自 sha256 成等长摘要再比。原先是 `===` 短路比较，
 *    可以被逐字节试探（虽然实际风险有限，但没有理由留这个口子）。
 * 3. `CRON_SECRET` 未配置时**一律拒绝**，绝不回退成「放行」。
 *
 * 兼容 `Bearer <secret>` 写法，同时接受裸值（两种 curl 写法都能用）。
 *
 * 为什么单独成模块：Next.js 只允许 route 文件导出 HTTP 方法与配置，
 * 这类共用逻辑放 route 里既无法复用也无法单测。
 */
import { createHash, timingSafeEqual } from 'node:crypto';

export function isCronAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const raw = req.headers.get('authorization') ?? '';
  const provided = (raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw).trim();
  if (!provided) return false;

  // 先哈希成等长摘要：既避免长度差异造成的提前返回，也让比较本身恒定时间
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
