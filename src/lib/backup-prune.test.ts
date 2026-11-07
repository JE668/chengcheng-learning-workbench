// @vitest-environment node
/**
 * backup.ts 的备份/清理回归测试（本文件此前 0% 覆盖）。
 *
 * ## 为什么值得单独测
 * backup.ts 是「孩子所有学习数据」的最后一道保险，而且它跑在 cron 里、
 * 平时没人看返回值：backupDatabase() 静默返回 { ok:false } 时，
 * 界面上不会有任何异常，直到某天真要恢复才发现 14 份备份一份都没有。
 * 历史上这个文件已经踩过一次静默失效（见 dbPath() 注释：默认值与
 * db-core.ts 不一致 → 本地不设 TURSO_URL 时永远判定「仅支持云端」）。
 *
 * ## 三条关键失败路径
 *   1. VACUUM INTO 成功 / 产出空文件 / 直接抛错 —— 三条分支各自的落点，
 *      尤其是「降级到整文件拷贝」有没有真的发生（只返回 method 是不够的，
 *      要断言 copyFile 的源与目标）。
 *   2. 两条路都失败时 error 必须同时带上两边原因，否则运维只看日志无从定位。
 *   3. 保留份数 KEEP_COUNT 的清理边界：多留要删旧、少留要删新，
 *      且**配置写错时绝不能把备份删光**（这条最初是红的，见下方 KEEP_COUNT 注释）。
 *
 * ## 为什么全 mock 掉 fs 与 db
 * DB_FILE / BACKUP_DIR / KEEP_COUNT 是模块级常量（import 时按 env 求值），
 * 所以每个场景都要 resetModules + 重新 import。fs 用内存假实现，
 * 一是避免往真实仓库写文件，二是让「谁被删了」变成可直接断言的数组。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fsState = vi.hoisted(() => ({
  /** path -> { content, mtimeMs }，模拟真实磁盘 */
  files: new Map<string, { content: string; mtimeMs: number }>(),
  dirs: [] as string[],
  copies: [] as Array<[string, string]>,
  unlinked: [] as string[],
  /** 让指定路径的 VACUUM INTO 产出 0 字节文件（模拟「成功但没内容」） */
  emptyVacuum: false,
}));

vi.mock('node:fs', () => ({
  promises: {
    mkdir: async (p: string) => {
      fsState.dirs.push(p);
    },
    readdir: async (dir: string) => {
      const prefix = dir.endsWith('/') ? dir : dir + '/';
      // 返回**相对名**，与真实 fs.readdir 一致：backup.ts 拿返回值直接拼路径，
      // 这里若漏掉去前缀就会变成 /data/backups//data/backups/xxx.db，
      // 于是过滤/删除全部静默落空（第一版就踩了这个坑，表现是「一份都没删」）。
      return [...fsState.files.keys()]
        .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
        .map((p) => p.slice(prefix.length));
    },
    stat: async (p: string) => {
      const f = fsState.files.get(p);
      if (!f) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      return { size: f.content.length, mtimeMs: f.mtimeMs };
    },
    copyFile: async (a: string, b: string) => {
      fsState.copies.push([a, b]);
      const src = fsState.files.get(a);
      fsState.files.set(b, { content: src?.content ?? '', mtimeMs: Date.now() });
    },
    unlink: async (p: string) => {
      fsState.unlinked.push(p);
      fsState.files.delete(p);
    },
  },
}));

/** 假 DB：只认 VACUUM INTO，其它 PRAGMA 当作无害地成功。 */
const dbState = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock('./db', () => ({ getDb: () => ({ execute: dbState.execute }) }));

function vacuumIntoTarget(sql: string): string | null {
  const m = /VACUUM INTO '(.*)'$/.exec(sql);
  return m ? m[1] : null;
}

/** 每个场景重新按 env 求值模块级常量。 */
async function loadBackup(env: Record<string, string> = {}) {
  vi.resetModules();
  delete process.env.TURSO_URL;
  delete process.env.BACKUP_KEEP_COUNT;
  Object.assign(process.env, env);
  return import('./backup');
}

/** 在假磁盘上铺 N 份旧备份（名字越靠后越新）。 */
function seedBackups(dir: string, n: number) {
  for (let i = 1; i <= n; i++) {
    const name = `local-2026-01-0${i}-00000${i}.db`;
    fsState.files.set(`${dir}/${name}`, { content: 'x'.repeat(10), mtimeMs: 1000 + i });
  }
}

beforeEach(() => {
  fsState.files.clear();
  fsState.dirs = [];
  fsState.copies = [];
  fsState.unlinked = [];
  fsState.emptyVacuum = false;
  dbState.execute.mockReset();
  dbState.execute.mockImplementation(async (stmt: { sql: string }) => {
    const dest = vacuumIntoTarget(stmt.sql);
    if (dest) {
      fsState.files.set(dest, { content: fsState.emptyVacuum ? '' : 'DB', mtimeMs: Date.now() });
    }
    return { rows: [] };
  });
});

describe('仅支持本地文件库', () => {
  it('云端 Turso（libsql://）直接返回不可备份，且不碰磁盘', async () => {
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'libsql://x.turso.io' });
    const res = await backupDatabase();
    expect(res.ok).toBe(false);
    expect(res.error).toContain('仅支持本地文件库');
    expect(fsState.dirs).toHaveLength(0);
    expect(dbState.execute).not.toHaveBeenCalled();
  });

  it('不设 TURSO_URL 时必须仍按 file:local.db 处理（历史静默失效点）', async () => {
    // db-core.ts 的默认值是 'file:local.db'。这里一旦与它不一致，
    // 本地（非 Docker）开发环境就会永远走上面那条「不可备份」分支。
    const { backupDatabase } = await loadBackup();
    const res = await backupDatabase();
    expect(res.ok).toBe(true);
    expect(res.method).toBe('vacuum-into');
  });
});

describe('VACUUM INTO → 降级 → 双重失败', () => {
  it('首选路径：产出非空文件即成功，文件名是 local-<时间戳>.db', async () => {
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    const res = await backupDatabase();
    expect(res).toMatchObject({ ok: true, method: 'vacuum-into' });
    expect(res.file).toMatch(/^local-\d{4}-\d{2}-\d{2}-\d{6}\.db$/);
    // 备份目录必须落在数据库同级，Docker 里即 /data/backups
    expect(fsState.dirs).toContain('/data/backups');
  });

  it('VACUUM 产出 0 字节文件时降级为整文件拷贝，且拷贝源/目标正确', async () => {
    fsState.emptyVacuum = true;
    fsState.files.set('/data/local.db', { content: 'REAL', mtimeMs: 1 });
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    const res = await backupDatabase();
    expect(res).toMatchObject({ ok: true, method: 'file-copy' });
    expect(fsState.copies[0][0]).toBe('/data/local.db');
    expect(fsState.copies[0][1]).toContain(res.file!);
  });

  it('VACUUM 抛错时也走降级（NAS 上 VACUUM 需要额外磁盘空间，很容易失败）', async () => {
    fsState.files.set('/data/local.db', { content: 'REAL', mtimeMs: 1 });
    dbState.execute.mockImplementation(async (stmt: { sql: string }) => {
      if (stmt.sql.startsWith('VACUUM INTO')) throw new Error('disk full');
      return { rows: [] };
    });
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    expect(await backupDatabase()).toMatchObject({ ok: true, method: 'file-copy' });
    // 降级前必须先把 WAL 折回主库，否则拷出去的是不一致快照
    expect(dbState.execute.mock.calls.some((c) => /wal_checkpoint/.test(c[0].sql))).toBe(true);
  });

  it('两条路都失败时 error 同时带两边原因（运维只看日志要能定位）', async () => {
    dbState.execute.mockImplementation(async (stmt: { sql: string }) => {
      if (stmt.sql.startsWith('VACUUM INTO')) throw new Error('disk full');
      throw new Error('readonly db');
    });
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    const res = await backupDatabase();
    expect(res.ok).toBe(false);
    expect(res.error).toContain('vacuum: disk full');
    expect(res.error).toContain('copy: readonly db');
  });
});

describe('保留份数 KEEP_COUNT 的清理边界', () => {
  const dir = '/data/backups';

  /** 只数主库文件：每个 .db 删除时会连带 unlink -wal/-shm，别把它们算进来。 */
  const deletedDbs = () => fsState.unlinked.filter((p) => p.startsWith(dir) && p.endsWith('.db'));

  it('默认保留 14 份：15 份旧的 + 本次 1 份 = 16，只删最旧的 2 份', async () => {
    seedBackups(dir, 15);
    const { backupDatabase } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    await backupDatabase();
    const survivors = [...fsState.files.keys()].filter((p) => p.startsWith(dir));
    // 16 份里留 14 → 删 2 份（本次新产物一定活着）
    expect(survivors).toHaveLength(14);
    expect(deletedDbs()).toHaveLength(2);
    expect(fsState.unlinked).toContain(`${dir}/local-2026-01-01-000001.db`);
  });

  it('BACKUP_KEEP_COUNT=3 时留 3 份，并连带清掉同名 -wal/-shm', async () => {
    seedBackups(dir, 6);
    const { backupDatabase } = await loadBackup({
      TURSO_URL: 'file:/data/local.db',
      BACKUP_KEEP_COUNT: '3',
    });
    await backupDatabase();
    const survivors = [...fsState.files.keys()].filter((p) => p.startsWith(dir + '/local-'));
    expect(survivors).toHaveLength(3);
    // 主库删了就要顺手删 sidecar，否则会留下无主的 -wal 干扰恢复
    expect(fsState.unlinked.some((p) => p.endsWith('-wal'))).toBe(true);
    expect(fsState.unlinked.some((p) => p.endsWith('-shm'))).toBe(true);
  });

  it('BACKUP_KEEP_COUNT=0 兜到 1 份（而不是 0 → 把自己删光）', async () => {
    seedBackups(dir, 3);
    const { backupDatabase } = await loadBackup({
      TURSO_URL: 'file:/data/local.db',
      BACKUP_KEEP_COUNT: '0',
    });
    const res = await backupDatabase();
    expect(res.ok).toBe(true);
    const survivors = [...fsState.files.keys()].filter((p) => p.startsWith(dir + '/local-'));
    expect(survivors).toHaveLength(1);
  });

  it('BACKUP_KEEP_COUNT 配成非数字时，绝不能删光全部备份', async () => {
    // 曾经的真实缺陷：Number('abc') → NaN → Math.max(1, NaN) 仍是 NaN，
    // 而 Array.prototype.slice(NaN) 等价 slice(0) —— 返回整个数组，
    // 于是「超出保留份数」的判定把**所有**历史备份全部 unlink 掉。
    // 一次 docker run 忘了带环境变量，14 份备份就地蒸发。
    seedBackups(dir, 4);
    const { backupDatabase } = await loadBackup({
      TURSO_URL: 'file:/data/local.db',
      BACKUP_KEEP_COUNT: 'abc',
    });
    const res = await backupDatabase();
    expect(res.ok).toBe(true);
    const survivors = [...fsState.files.keys()].filter((p) => p.startsWith(dir + '/local-'));
    // 配错时按默认 14 份处理：4 份旧的 + 本次 1 份都该留着
    expect(survivors).toHaveLength(5);
  });

  it('BACKUP_KEEP_COUNT 传空串也按默认处理（不能当成 0 → 只留 1 份）', async () => {
    // `env BACKUP_KEEP_COUNT=` 在 docker-compose 里太容易写出来了。
    // Number('') === 0，若按数值处理会兜到下限 1，等于悄悄把保留期砍到 1 天。
    seedBackups(dir, 4);
    const { backupDatabase } = await loadBackup({
      TURSO_URL: 'file:/data/local.db',
      BACKUP_KEEP_COUNT: '',
    });
    await backupDatabase();
    const survivors = [...fsState.files.keys()].filter((p) => p.startsWith(dir + '/local-'));
    expect(survivors).toHaveLength(5);
  });
});

describe('listBackups', () => {
  it('只认 local-*.db，按时间倒序，并给出 size 与 ISO 时间', async () => {
    const dir = '/data/backups';
    fsState.files.set(`${dir}/local-2026-01-01-000001.db`, { content: 'aaa', mtimeMs: 1000 });
    fsState.files.set(`${dir}/local-2026-01-02-000002.db`, { content: 'bb', mtimeMs: 2000 });
    // 干扰项：命名不符 / sidecar 文件 / 别的库
    fsState.files.set(`${dir}/notes.txt`, { content: 'x', mtimeMs: 9000 });
    fsState.files.set(`${dir}/local-2026-01-03-000003.db-wal`, { content: 'y', mtimeMs: 9000 });

    const { listBackups } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    const list = await listBackups();
    expect(list.map((b) => b.name)).toEqual([
      'local-2026-01-02-000002.db',
      'local-2026-01-01-000001.db',
    ]);
    expect(list[0]).toMatchObject({ size: 2 });
    expect(list[0].mtime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('备份目录不存在时返回空数组而不是抛错（cron GET 不能因此 500）', async () => {
    const { listBackups } = await loadBackup({ TURSO_URL: 'file:/data/local.db' });
    await expect(listBackups()).resolves.toEqual([]);
  });
});
