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
