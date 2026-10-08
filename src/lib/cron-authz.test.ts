// @vitest-environment node
/**
 * 定时任务路由的鉴权回归测试。
 * 路由：src/app/api/cron/settle/route.ts（另覆盖 lib/cron-auth.ts 的三条设计约定）
 *
 * ## 这个路由在防什么
 * /api/cron/* 是**公网可访问**的路由（NAS 计划任务 / 外部调度器会从外网打进来），
 * 唯一的闸门就是 isCronAuthorized。未授权即可触发：
 *   - 全量城堡结算（篡改所有孩子的 prosperity / starCoins）
 *   - 批量删除过期会话
 *   - cron/backup 触发磁盘备份
 *
 * ## 三条设计约定（lib/cron-auth.ts 的注释里都写了）
 * ① 只接受 Authorization 头，不接受 `?secret=` 查询串（会进反代日志 / Referer）
 * ② 恒定时间比较（先 sha256 成等长摘要再比）
 * ③ CRON_SECRET 未配置时**一律拒绝**，绝不回退成放行
 *
 * 这些断言在鉴权被放宽时必然失败。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isCronAuthorized } from '@/lib/cron-auth';
import { POST as settlePOST } from '@/app/api/cron/settle/route';
import { getDb, ensureSchema } from '@/lib/db';
import { seedChild } from '@/lib/test-child-fixtures';

const SECRET = 'a'.repeat(40);
const CHILD = 7601;

const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, { method: 'POST', headers }) as never;

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe('isCronAuthorized · 三条设计约定', () => {
  it('正确的 Bearer token 放行', () => {
    expect(isCronAuthorized(req('/api/cron/settle', { authorization: `Bearer ${SECRET}` }))).toBe(
      true
    );
  });

  it('裸值（不带 Bearer 前缀）也放行（兼容两种 curl 写法）', () => {
    expect(isCronAuthorized(req('/api/cron/settle', { authorization: SECRET }))).toBe(true);
  });

  it('错误 secret 被拒', () => {
    expect(isCronAuthorized(req('/x', { authorization: 'Bearer wrong-secret' }))).toBe(false);
  });

  it('缺少 Authorization 头被拒', () => {
    expect(isCronAuthorized(req('/x'))).toBe(false);
  });

  it('空 Bearer 被拒', () => {
    expect(isCronAuthorized(req('/x', { authorization: 'Bearer   ' }))).toBe(false);
  });

  it('约定①：查询串 ?secret= 不再被接受', () => {
    // 查询串会进反向代理与访问日志，也会通过 Referer 外泄
    expect(isCronAuthorized(req(`/api/cron/settle?secret=${SECRET}`))).toBe(false);
  });

  it('约定③：CRON_SECRET 未配置时一律拒绝，绝不放行', () => {
    delete process.env.CRON_SECRET;
    expect(isCronAuthorized(req('/x', { authorization: `Bearer ${SECRET}` }))).toBe(false);
    // 即使提供了空值也拒绝
    process.env.CRON_SECRET = '';
    expect(isCronAuthorized(req('/x', { authorization: 'Bearer ' }))).toBe(false);
  });

  it('前缀相似 / 长度不同的 token 均被拒（恒定比较不短路）', () => {
    for (const bad of [SECRET.slice(0, -1), SECRET + 'x', 'Bearer', SECRET.toUpperCase()]) {
      expect(
        isCronAuthorized(req('/x', { authorization: `Bearer ${bad}` })),
        `token=${bad.slice(0, 12)}…`
      ).toBe(false);
    }
  });
});

describe('POST /api/cron/settle · 路由层鉴权', () => {
  beforeEach(async () => {
    await ensureSchema();
    await seedChild(CHILD, 'cron-child');
  });

  it('未授权返回 401，且不执行任何结算', async () => {
    await getDb().execute({
      sql: 'INSERT INTO castle_state (child_id, sunlight, star_coins, prosperity, streak_days) VALUES (?, 0, 0, 5, 3)',
      args: [CHILD],
    });
    const res = await settlePOST(req('/api/cron/settle'));
    expect(res.status).toBe(401);
    // 未授权时不得触碰数据
    const r = await getDb().execute({
      sql: 'SELECT prosperity FROM castle_state WHERE child_id = ?',
      args: [CHILD],
    });
    expect(Number(r.rows[0].prosperity)).toBe(5);
  });

  it('错误 secret 返回 401', async () => {
    const res = await settlePOST(req('/api/cron/settle', { authorization: 'Bearer nope' }));
    expect(res.status).toBe(401);
  });

  it('CRON_SECRET 未配置时返回 401（不是放行）', async () => {
    delete process.env.CRON_SECRET;
    const res = await settlePOST(req('/api/cron/settle', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(401);
  });

  it('正确 secret 放行并遍历全部孩子', async () => {
    const res = await settlePOST(req('/api/cron/settle', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.children)).toBe(true);
    expect(data.children.length).toBeGreaterThanOrEqual(1);
  });

  it('查询串带 secret 也被拒（约定①在路由层生效）', async () => {
    const res = await settlePOST(req(`/api/cron/settle?secret=${SECRET}`));
    expect(res.status).toBe(401);
  });
});
