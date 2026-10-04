/**
 * 迁移安全性回归测试（对应 docs/评审修复计划与交接.md 第 7 节第 9 项）。
 *
 * 背景：migrations.ts 里原有 12 处 `try { ALTER TABLE ... } catch {}`，
 * 会把**真正的失败**（表不存在 / 库被锁 / 磁盘错误 / SQL 写错）一起吞掉，
 * 而 runMigrations() 仍把该版本记为 applied —— 结果是：
 *
 *   列永久缺失  +  没有任何日志  +  下次冷启动不会重试（版本号已跳过）
 *
 * 修复后只有「列已存在」被容忍，其余一律上抛（版本不被记录，下次会重试）。
 * 这些断言在修复前必然失败：对不存在的表执行 ADD COLUMN，旧代码静默返回、什么都没发生。
 */
import { describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import {
  MIGRATIONS,
  addColumnIfMissing,
  ensureMigrationTable,
  getCurrentVersion,
  runMigrations,
} from '@/lib/migrations';

/** 极简 libsql Client 替身：只实现测试用到的 execute。 */
function fakeDb(
  onSql: (sql: string) => void,
  failWith?: string
): { execute: (arg: { sql: string; args?: unknown[] }) => Promise<unknown> } {
  return {
    async execute({ sql }) {
      onSql(sql);
      if (failWith) throw new Error(failWith);
      return { rows: [] };
    },
  };
}

describe('迁移安全性 · 真实空库端到端', () => {
  it('全新空库上跑 runMigrations 必须成功（不能因 no such table 而崩）', async () => {
    // 这是本轮踩过的坑：迁移对「尚未建出的表」加列时若上抛，
    // 全新部署会直接初始化失败。这里用真实的 libsql 内存库锁死该行为。
    const db = createClient({ url: 'file::memory:' });
    await ensureMigrationTable(db);
    await expect(runMigrations(db)).resolves.toBeUndefined();
    const v = await getCurrentVersion(db);
    const max = Math.max(...MIGRATIONS.map((m) => m.version));
    expect(v).toBe(max);
  });

  it('重复执行必须幂等（第二次不抛错）', async () => {
    const db = createClient({ url: 'file::memory:' });
    await runMigrations(db);
    await expect(runMigrations(db)).resolves.toBeUndefined();
  });
});

describe('迁移安全性 · addColumnIfMissing', () => {
  it('列不存在时正常执行 ALTER', async () => {
    const seen: string[] = [];
    const db = fakeDb((sql) => seen.push(sql));
    await addColumnIfMissing(db as never, 'users', 'cert_pref TEXT');
    expect(seen).toEqual(['ALTER TABLE users ADD COLUMN cert_pref TEXT']);
  });

  it('列已存在（duplicate column name）时静默忽略 —— 这是唯一的幂等豁免', async () => {
    const db = fakeDb(() => {}, 'duplicate column name: cert_pref');
    // 不抛错即通过：重复运行迁移必须安全
    await expect(
      addColumnIfMissing(db as never, 'users', 'cert_pref TEXT')
    ).resolves.toBeUndefined();
  });

  it('表尚未建出时静默跳过 —— 全新库的正常路径', async () => {
    // 关键背景：全新库上 ensureSchema() 里的 runMigrations() 先于建表执行
    // （schema.ts 第 75 行 vs 第 197 行），此时 8 张目标表都还不存在。
    // 历史行为靠「静默吞掉」让全新部署跑通；一旦改成严格上抛，全新库直接无法初始化
    // （这个回归真实发生过：CI e2e 登录后停在 /login，因为数据库初始化抛错）。
    const db = fakeDb(() => {}, 'SQLITE_ERROR: no such table: moko_owned');
    await expect(
      addColumnIfMissing(db as never, 'moko_owned', 'rarity TEXT')
    ).resolves.toBeUndefined();
  });

  it('「no such table」只放行这一种，不能顺带吞掉别的错误', async () => {
    // 库被锁与「表不存在」长得不像，必须照旧上抛
    const db = fakeDb(() => {}, 'SQLITE_ERROR: database is locked');
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /ALTER TABLE mistakes ADD COLUMN chapter/
    );
  });

  it('库被锁 / 磁盘错误等真失败必须上抛，且保留原始原因', async () => {
    const db = fakeDb(() => {}, 'database is locked');
    await expect(addColumnIfMissing(db as never, 'users', 'parent_id INTEGER')).rejects.toThrow(
      /database is locked/
    );
  });

  it('错误信息带上表名与列名，便于定位是哪个迁移失败了', async () => {
    // 用「磁盘 I/O 错误」这类真失败验证错误包装
    // （no such table 已是合法跳过项，不能用它当"真失败"的例子）
    const db = fakeDb(() => {}, 'SQLITE_IOERR: disk I/O error');
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /ALTER TABLE mistakes ADD COLUMN chapter/
    );
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /disk I\/O error/
    );
  });

  it('非 Error 类型的异常也要包裹上抛（不吞、不裸传）', async () => {
    const db = {
      execute: async () => {
        throw 'plain string failure';
      },
    };
    await expect(addColumnIfMissing(db as never, 'users', 'cert_pref TEXT')).rejects.toThrow(
      /plain string failure/
    );
  });

  it('带 NOT NULL DEFAULT 的完整列定义原样传给 ALTER（不能只取列名）', async () => {
    const seen: string[] = [];
    const db = fakeDb((sql) => seen.push(sql));
    await addColumnIfMissing(db as never, 'wishes', "status TEXT NOT NULL DEFAULT 'pending'");
    expect(seen[0]).toBe("ALTER TABLE wishes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  });
});
