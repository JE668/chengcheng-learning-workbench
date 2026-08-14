import { getDb } from './db';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * 数据库定时备份（热备）。
 *
 * 适用场景：自托管 NAS（文件型 SQLite local.db）。
 * - 首选 `VACUUM INTO`：WAL 模式下安全，在线生成一份干净一致的副本，不阻塞读写；
 * - 失败则降级：`PRAGMA wal_checkpoint(TRUNCATE)` 把 WAL 折回主库后再整文件拷贝；
 * - 保留最近 N 份（BACKUP_KEEP_COUNT，默认 14），超出自动清理。
 *
 * 注意：仅支持本地文件库（TURSO_URL=file:...）。云端 Turso（libsql://...）无法
 * 把备份写到本地磁盘，直接返回不可备份。
 */

const FILE_PREFIX = 'file:';
function dbPath(): string | null {
  const url = process.env.TURSO_URL || '';
  if (!url.startsWith(FILE_PREFIX)) return null;
  return url.slice(FILE_PREFIX.length);
}

const DB_FILE = dbPath();
const BACKUP_DIR = DB_FILE ? path.join(path.dirname(DB_FILE), 'backups') : '/data/backups';
const KEEP_COUNT = Math.max(1, Number(process.env.BACKUP_KEEP_COUNT ?? 14));

export interface BackupFile {
  name: string;
  size: number;
  mtime: string;
}
export interface BackupResult {
  ok: boolean;
  file?: string;
  method?: string;
  backups?: BackupFile[];
  error?: string;
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 备份一次数据库到 BACKUP_DIR/local-<时间戳>.db。 */
export async function backupDatabase(): Promise<BackupResult> {
  if (!DB_FILE) {
    return { ok: false, error: '仅支持本地文件库（TURSO_URL=file:...）备份，云端 Turso 请用平台快照' };
  }
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const name = `local-${stamp()}.db`;
  const dest = path.join(BACKUP_DIR, name);
  const db = getDb();

  // 首选：VACUUM INTO（热备，WAL 模式安全）。VACUUM INTO 不接受参数绑定，路径内联，
  // 但路径完全由本函数构造（无外部输入），单引号已转义，无注入风险。
  try {
    await db.execute({ sql: `VACUUM INTO '${dest.replace(/'/g, "''")}'`, args: [] });
    const st = await fs.stat(dest).catch(() => null);
    if (st && st.size > 0) {
      await pruneBackups();
      return { ok: true, file: name, method: 'vacuum-into' };
    }
    throw new Error('VACUUM INTO 未生成文件');
  } catch (e1) {
    // 降级：把 WAL 折回主库后整文件拷贝（checkpoint 后 local.db 自身一致）
    try {
      await db.execute({ sql: 'PRAGMA wal_checkpoint(TRUNCATE)', args: [] });
      await fs.copyFile(DB_FILE, dest);
      // checkpoint 后 -wal 已截空，但顺带拷一份保险（恢复时与 .db 同目录即可）
      await fs.copyFile(DB_FILE + '-wal', dest + '-wal').catch(() => {});
      await fs.copyFile(DB_FILE + '-shm', dest + '-shm').catch(() => {});
      await pruneBackups();
      return { ok: true, file: name, method: 'file-copy' };
    } catch (e2) {
      return { ok: false, error: `vacuum: ${msg(e1)}; copy: ${msg(e2)}` };
    }
  }
}

/** 清理超出保留份数的旧备份（含同名 -wal/-shm）。 */
async function pruneBackups(): Promise<void> {
  const entries = await fs.readdir(BACKUP_DIR).catch(() => []);
  const dbs = entries.filter((n) => /^local-[\w-]+\.db$/.test(n));
  const statted = await Promise.all(
    dbs.map(async (n) => {
      const p = path.join(BACKUP_DIR, n);
      const st = await fs.stat(p).catch(() => null);
      return { n, p, t: st ? st.mtimeMs : 0 };
    }),
  );
  statted.sort((a, b) => b.t - a.t);
  for (const f of statted.slice(KEEP_COUNT)) {
    await fs.unlink(f.p).catch(() => {});
    await fs.unlink(f.p + '-wal').catch(() => {});
    await fs.unlink(f.p + '-shm').catch(() => {});
  }
}

/** 列出现有备份（供 /api/cron/backup GET 查看）。 */
export async function listBackups(): Promise<BackupFile[]> {
  const entries = await fs.readdir(BACKUP_DIR).catch(() => []);
  const dbs = entries.filter((n) => /^local-[\w-]+\.db$/.test(n));
  const res: BackupFile[] = [];
  for (const n of dbs) {
    const p = path.join(BACKUP_DIR, n);
    const st = await fs.stat(p).catch(() => null);
    if (st) res.push({ name: n, size: st.size, mtime: new Date(st.mtimeMs).toISOString() });
  }
  res.sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
  return res;
}
