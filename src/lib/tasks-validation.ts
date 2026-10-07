/**
 * 任务（tasks）入参校验的**唯一出口**。
 *
 * 单独成模块而不是各自写在路由里：积分上限这类安全口径一旦在两处
 * 复制粘贴，日后改一处忘一处就会出现「建任务能设 1e9、改任务设不了」
 * 的诡异不一致（历史上 castle/grant 做了校验、tasks 漏做就是这个模式）。
 */

/** 任务积分的合法区间：与 castle/grant 的资源数量口径一致。 */
export const MIN_TASK_POINTS = 1;
export const MAX_TASK_POINTS = 100;
export const DEFAULT_TASK_POINTS = 5;

/** 任务名称长度上限（防止超长文本进打印页与列表）。 */
export const MAX_TASK_TITLE = 100;

/**
 * 解析并校验任务积分。
 *
 * ⚠️ 不能用 `Number(points) || 5`：那只拦 falsy 值，负数/上限/小数全部穿透
 * （实测 1e9、-999999、3.5 都会原样入库）。非法值必须显式拒绝，
 * 而不是悄悄回落成默认值 —— 否则家长以为设成了 1e9，实际存的是 5。
 *
 * @returns 合法整数；非法返回 null
 */
export function parseTaskPoints(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return DEFAULT_TASK_POINTS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  if (int < MIN_TASK_POINTS || int > MAX_TASK_POINTS) return null;
  return int;
}

/** 校验并规范化任务名称；非法（空/超长/非字符串）返回 null。 */
export function parseTaskTitle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t || t.length > MAX_TASK_TITLE) return null;
  return t;
}
