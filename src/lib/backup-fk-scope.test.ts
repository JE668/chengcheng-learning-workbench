// @vitest-environment node
/**
 * 备份恢复期间的外键保护（回归）。
 *
 * 背景：恢复流程原先在事务外执行 `PRAGMA foreign_keys = OFF`。实测该 PRAGMA 是
 * **连接级**的 —— libSQL 本地驱动全局只有一个连接，被关掉后其它并发请求
 * （渲染页面、记一笔打卡）在同一窗口内同样失去外键保护，能写进孤儿行；
 * 而 withWriteLock 只串行化**写**，读请求完全不受约束。
 *
 * 本文件锁死替代方案：`PRAGMA defer_foreign_keys = ON` 是**事务级**的，
 * 事务外 foreign_keys 始终为 1。
 */
import { describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';

async function mkDb() {
  const db = createClient({ url: 'file::memory:' });
  await db.execute('PRAGMA foreign_keys = ON');
  await db.execute('CREATE TABLE parent (id INTEGER PRIMARY KEY)');
  await db.execute('CREATE TABLE child (pid INTEGER REFERENCES parent(id))');
  await db.execute('INSERT INTO parent (id) VALUES (1)');
  await db.execute('INSERT INTO child (pid) VALUES (1)');
  return db;
}

const fkOn = async (db: Awaited<ReturnType<typeof mkDb>>) =>
  Number((await db.execute('PRAGMA foreign_keys')).rows[0].foreign_keys);

describe('备份恢复 · 外键保护不得被关闭', () => {
  it('⚠️ 回归：foreign_keys=OFF 是连接级的，会泄漏给其它请求', async () => {
    const db = await mkDb();
    expect(await fkOn(db)).toBe(1);
    await db.execute('PRAGMA foreign_keys = OFF');
    // 「另一个请求」在同一个 client 上观察到的状态
    expect(await fkOn(db), '连接级 OFF 泄漏给了其它请求').toBe(0);
    // 且真的能写进孤儿行
    await db.execute('INSERT INTO child (pid) VALUES (999)');
    const n = await db.execute('SELECT COUNT(*) n FROM child WHERE pid = 999');
    expect(Number(n.rows[0].n)).toBe(1);
  });

  it('✅ 替代方案：defer_foreign_keys 只影响本事务，事务外始终为 1', async () => {
    const db = await mkDb();
    await db.execute('BEGIN IMMEDIATE');
    await db.execute('PRAGMA defer_foreign_keys = ON');
    // 事务内可以按「先子后父」顺序恢复
    await db.execute('DELETE FROM child');
    await db.execute('DELETE FROM parent');
    await db.execute('INSERT INTO parent (id) VALUES (5)');
    await db.execute('INSERT INTO child (pid) VALUES (5)');
    await db.execute('COMMIT');
    expect(await fkOn(db), '事务结束后 foreign_keys 必须仍是 1').toBe(1);
    const rows = await db.execute('SELECT pid FROM child');
    expect(rows.rows.map((r) => Number(r.pid))).toEqual([5]);
  });

  it('✅ defer 下若真留下孤儿行，COMMIT 会被拒绝（而不是静默写坏库）', async () => {
    const db = await mkDb();
    await db.execute('BEGIN IMMEDIATE');
    await db.execute('PRAGMA defer_foreign_keys = ON');
    await db.execute('DELETE FROM parent');
    await db.execute('INSERT INTO child (pid) VALUES (999)');
    let rejected = false;
    try {
      await db.execute('COMMIT');
    } catch {
      rejected = true;
    }
    await db.execute('ROLLBACK').catch(() => {});
    expect(rejected, '留下孤儿行却提交成功了').toBe(true);
    // 整笔回滚，原数据还在
    const p = await db.execute('SELECT id FROM parent');
    expect(p.rows.length).toBe(1);
  });
});
