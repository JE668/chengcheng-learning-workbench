// @vitest-environment node
/**
 * cron/backup 的路由层鉴权。
 *
 * 与 cron/settle 复用同一个 CRON_SECRET（鉴权逻辑见 lib/cron-auth，另有专门测试）。
 * 这里只钉**路由层**容易被漏掉的那一半：
 *   · POST（真去 VACUUM INTO 落盘）与 GET（列出已有备份）**都必须鉴权** ——
 *     给 GET 加路由时漏掉检查是很常见的疏忽，而它会泄露备份文件名与时间。
 *   · 未授权时**不得真的执行备份**（不是「返回 401 但顺手备了一份」）。
 *   · 备份失败必须回 500，不能谎报成功 —— 否则计划任务看着永远绿。
 *
 * 备份本体（VACUUM INTO、外键作用域）由 lib/backup-* 的测试负责，这里 mock 掉。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  backupResult: { ok: true, file: 'local-2026.db' } as Record<string, unknown>,
}));

vi.mock('@/lib/backup', () => ({
  backupDatabase: vi.fn(async () => h.backupResult),
  listBackups: vi.fn(async () => ['a.db', 'b.db']),
}));

import { GET, POST } from '@/app/api/cron/backup/route';
import { backupDatabase, listBackups } from '@/lib/backup';

const SECRET = 'b'.repeat(40);

const req = (method: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/cron/backup', { method, headers }) as never;

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  h.backupResult = { ok: true, file: 'local-2026.db' };
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.clearAllMocks();
});

describe('cron/backup · 两种方法都必须鉴权', () => {
  it('POST 未授权 → 401，且不执行任何备份', async () => {
    const res = await POST(req('POST'));
    expect(res.status).toBe(401);
    expect(backupDatabase).not.toHaveBeenCalled();
  });

  it('⚠️ GET 未授权 → 401，且不列出备份', async () => {
    const res = await GET(req('GET'));
    expect(res.status).toBe(401);
    expect(listBackups).not.toHaveBeenCalled();
  });

  it('错误 secret 两种方法都拒', async () => {
    const bad = { authorization: 'Bearer nope' };
    expect((await POST(req('POST', bad))).status).toBe(401);
    expect((await GET(req('GET', bad))).status).toBe(401);
  });

  it('查询串带 secret 不给过（与 settle 同一口径）', async () => {
    const res = await POST(req('POST'));
    expect(res.status).toBe(401);
    const res2 = await POST(
      new Request(`http://localhost/api/cron/backup?secret=${SECRET}`, { method: 'POST' }) as never
    );
    expect(res2.status).toBe(401);
  });

  it('CRON_SECRET 未配置时一律 401（不是放行）', async () => {
    delete process.env.CRON_SECRET;
    const auth = { authorization: `Bearer ${SECRET}` };
    expect((await POST(req('POST', auth))).status).toBe(401);
    expect((await GET(req('GET', auth))).status).toBe(401);
  });

  it('授权后 POST 真的触发备份并回 200', async () => {
    const res = await POST(req('POST', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(backupDatabase).toHaveBeenCalledTimes(1);
  });

  it('⚠️ 备份失败回 500，不得谎报成功', async () => {
    h.backupResult = { ok: false, error: 'disk full' };
    const res = await POST(req('POST', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(500);
  });

  it('授权后 GET 返回备份列表', async () => {
    const res = await GET(req('GET', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.backups).toEqual(['a.db', 'b.db']);
  });
});
