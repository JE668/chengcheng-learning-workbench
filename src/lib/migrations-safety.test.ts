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
import { addColumnIfMissing } from '@/lib/migrations';

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

  it('表不存在时必须上抛，不能被当成「已存在」吞掉', async () => {
    // 旧代码：catch {} → 静默返回 → 版本照样记为 applied → 列永久缺失且无人知晓
    const db = fakeDb(() => {}, 'SQLITE_ERROR: no such table: moko_owned');
    await expect(addColumnIfMissing(db as never, 'moko_owned', 'rarity TEXT')).rejects.toThrow(
      /ALTER TABLE moko_owned ADD COLUMN rarity/
    );
  });

  it('库被锁 / 磁盘错误等真失败必须上抛，且保留原始原因', async () => {
    const db = fakeDb(() => {}, 'database is locked');
    await expect(addColumnIfMissing(db as never, 'users', 'parent_id INTEGER')).rejects.toThrow(
      /database is locked/
    );
  });

  it('错误信息带上表名与列名，便于定位是哪个迁移失败了', async () => {
    const db = fakeDb(() => {}, 'SQLITE_ERROR: no such table: mistakes');
    await expect(addColumnIfMissing(db as never, 'mistakes', 'chapter TEXT')).rejects.toThrow(
      /ALTER TABLE mistakes ADD COLUMN chapter/
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
