/**
 * 进程内「schema 已就绪」记忆化（layout 与 API 路由共用）。
 *
 * ## 为什么需要它
 * - 根布局 `layout.tsx` 是 force-dynamic，每个页面请求都会渲染，因此它是
 *   「第一个请求」的主要来源；
 * - 但 **`/api/*` 路由处理器不经过根布局**，它们直接 `getDb().execute(...)`。
 *   于是全新库冷启动时，如果第一个到达的是 API 请求（比如 e2e 的
 *   `POST /api/auth/login`），就会在表建好之前查表 → `no such table` → 500。
 *
 * ## 语义：共享 + 有界重试
 * - 首次调用时启动 `ensureSchema()`，**所有并发调用共享同一个 Promise**，
 *   保证建表批次只跑一次（本地 sqlite3 单连接，重复并发建表会互相争锁）；
 * - 成功后本进程永久复用；
 * - 失败时保留同一个（已 reject 的）Promise，让并发调用拿到同一个错误，
 *   同时经过 `RETRY_DELAY_MS` 后允许重试以自愈 ——
 *   **不能一失败就置空**，那会让每个并发请求各自触发一次完整初始化。
 */
let schemaReady: Promise<void> | null = null;
let retryAt = 0;
let settled = false;
const RETRY_DELAY_MS = 1000;

/**
 * 确保 schema 已初始化。**API 路由在首次查表前应 await 它**，
 * 以免在全新库冷启动时读到尚未建表的库。
 */
export function ensureDbReady(): Promise<void> {
  // 「正在初始化中」也必须复用同一个 Promise：
  // 用 settled 标志而不是 retryAt 判断，否则首次调用（retryAt 还是 0）
  // 与其后的并发调用会各自触发一次完整初始化。
  if (schemaReady && !settled) return schemaReady;
  // 已失败且还在重试窗口内 → 复用同一个失败结果，避免请求风暴放大争锁
  if (schemaReady && settled && Date.now() < retryAt) return schemaReady;

  // 延迟 import，避免 db-core → schema → db-core 的模块级循环依赖
  const attempt = import('./schema').then((m) => m.ensureSchema());
  settled = false;
  schemaReady = attempt.then(
    () => {
      settled = true;
      retryAt = Infinity; // 成功后本进程永久复用
    },
    (error) => {
      settled = true;
      retryAt = Date.now() + RETRY_DELAY_MS; // 失败后允许自愈重试
      throw error;
    }
  );
  // 避免未处理的 rejection 警告（真正 await 的地方仍能正常拿到错误）
  schemaReady.catch(() => {});
  return schemaReady;
}

/** 仅供测试：重置进程内记忆化。 */
export function __resetDbReadyForTests(): void {
  schemaReady = null;
  retryAt = 0;
  settled = false;
}
