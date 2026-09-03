import { createClient, Client } from '@libsql/client';

const url = process.env.TURSO_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

/**
 * 获取（单例）数据库客户端。
 * 包装 execute：未传 args 时自动补空数组，避免 libSQL 在
 * stmtToHrana 中对 undefined args 调用 Object.entries 抛错。
 * 其余方法（如 batch）绑定回 raw client，保证私有字段可访问。
 */
export function getDb(): Client {
  if (!client) {
    const raw = createClient({ url, ...(authToken ? { authToken } : {}) });
    client = new Proxy(raw, {
      get(target, prop) {
        if (prop === 'execute') {
          return (stmt: string | { sql: string; args?: unknown[]; namedArgs?: Record<string, unknown> }) => {
            const s = typeof stmt === 'string' ? { sql: stmt } : { ...stmt };
            if (s.args === undefined && s.namedArgs === undefined) s.args = [];
            return target.execute(s as Parameters<Client['execute']>[0]);
          };
        }
        const val = Reflect.get(target, prop, target);
        if (typeof val === 'function') return val.bind(target);
        return val;
      },
    }) as unknown as Client;
  }
  return client;
}

/**
 * 进程内写事务互斥锁。
 *
 * 本地 sqlite3 驱动是单连接、同步执行：手写 BEGIN IMMEDIATE/COMMIT 之间若被
 * 并发请求的 await 穿插，会把别的语句卷入同一事务，导致串写/半提交。用一把
 * 串行队列把所有写事务锁成一条龙，保证「BEGIN … COMMIT」整段原子执行。
 * 单实例部署（NAS/轻量云）足够；多实例需上 Redis 锁，本项目暂无此场景。
 */
let writeQueue: Promise<void> = Promise.resolve();

export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn);
  // 无论成功失败都放行队列，避免一次异常卡死后续所有写操作。
  writeQueue = run.then(
    () => {},
    () => {},
  );
  return run;
}
