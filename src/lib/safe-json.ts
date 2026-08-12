/**
 * 防御性 JSON 解析。
 * 解析失败（数据库脏数据、字段损坏、格式错误）时返回兜底值而非抛错，
 * 避免单个坏字段直接把请求/页面打挂成 500。
 */
export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 安全解析请求体 JSON。
 * 非法 JSON / 空 body 会令原生 req.json() 抛错并导致路由返回 500，
 * 这里统一兜底为 fallback（默认 {}），把「格式错误」降级为「空输入」，
 * 交由各路由既有的参数校验返回 400，而非直接 500。
 */
export async function safeJson<T = Record<string, unknown>>(req: Request, fallback: T): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return fallback;
  }
}

