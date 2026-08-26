import { Kysely, SqliteDialect } from 'kysely';
import { createClient } from '@libsql/client';
import { DB, KyselyDB } from './schema';

/**
 * Kysely 适配器：将 libSQL 客户端包装为 Kysely 方言
 * 保持与现有 getDb() 兼容，逐步迁移
 */
class LibSQLDialect {
  #client: ReturnType<typeof createClient>;

  constructor(url: string, authToken?: string) {
    this.#client = createClient({ url, authToken });
  }

  async executeQuery(compiledQuery: { sql: string; parameters: unknown[] }) {
    const { sql, parameters } = compiledQuery;
    // libSQL 使用 ? 作为占位符，Kysely 默认也是 $
    // 需要转换参数格式
    const result = await this.#client.execute({ sql, args: parameters as any[] });
    return {
      rows: result.rows as any[],
      numAffectedRows: BigInt(result.rowsAffected ?? 0),
      insertId: result.lastInsertRowid ? BigInt(result.lastInsertRowid) : undefined,
    };
  }

  async *streamQuery(compiledQuery: { sql: string; parameters: unknown[] }) {
    // libSQL 不直接支持流式查询，降级为一次性返回
    const result = await this.executeQuery(compiledQuery);
    for (const row of result.rows) {
      yield row;
    }
  }
}

/** 创建 Kysely 实例（单例） */
let kyselyInstance: KyselyDB | null = null;

export function getKysely(): KyselyDB {
  if (!kyselyInstance) {
    const url = process.env.TURSO_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    kyselyInstance = new Kysely<DB>({
      dialect: new LibSQLDialect(url, authToken) as any,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });
  }
  return kyselyInstance;
}

/** 关闭连接（测试/脚本用） */
export async function closeKysely() {
  if (kyselyInstance) {
    await kyselyInstance.destroy();
    kyselyInstance = null;
  }
}

/** 事务辅助：自动重试死锁 */
export async function withTransaction<T>(
  fn: (trx: KyselyDB) => Promise<T>,
  retries = 3
): Promise<T> {
  const db = getKysely();
  for (let i = 0; ; i++) {
    try {
      return await db.transaction().execute(fn);
    } catch (err: any) {
      const isDeadlock = err?.code === 'SQLITE_BUSY' || err?.message?.includes('database is locked');
      if (isDeadlock && i < retries - 1) {
        await new Promise(r => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

/** 批量执行辅助 */
export async function batchExecute(statements: string[]): Promise<void> {
  const db = getKysely();
  await db.transaction().execute(async (trx) => {
    for (const sql of statements) {
      await sql.execute(trx);
    }
  });
}

/** 兼容旧 getDb() 的最小接口 */
export const legacyDb = {
  execute: (stmt: string | { sql: string; args?: unknown[]; namedArgs?: Record<string, unknown> }) => {
    const db = getKysely();
    const { sql, args = [], namedArgs } = typeof stmt === 'string' ? { sql: stmt } : stmt;
    // 简单的命名参数转位置参数（libSQL 不支持命名参数）
    let finalSql = sql;
    let finalArgs = args;
    if (namedArgs) {
      // 简易实现：按顺序替换 :name -> ?
      const keys = Object.keys(namedArgs);
      keys.forEach((key, idx) => {
        finalSql = finalSql.replace(new RegExp(`:${key}\\b`, 'g'), '?');
      });
      finalArgs = keys.map(k => namedArgs![k]);
    }
    return db.executeQuery({ sql: finalSql, parameters: finalArgs });
  },
  batch: (statements: string[], mode?: 'read' | 'write') => {
    return batchExecute(statements);
  },
};