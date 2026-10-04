/**
 * schema 就绪记忆化回归测试（对应 3.25 修复的 e2e 回归）。
 *
 * 背景：全新库冷启动时，`/api/*` 路由处理器不经过根布局就直接查表，
 * 于是先到的 API 请求（如 e2e 的 POST /api/auth/login）会撞上「表还没建好」，
 * 报 `no such table` → 500。根布局原本的 `catch { schemaReady = null }`
 * 更糟：失败后每个并发请求各自触发一次完整初始化，互相争锁。
 *
 * 这些断言锁定 ensureDbReady() 的两条关键性质：
 *   1. 并发调用共享同一次初始化（不会各自跑）；
 *   2. 失败后经过重试延迟仍能自愈，而不是永久卡死或无限重试。
 *
 * 注意：`ensureDbReady` 内部用**动态 import** 加载 ./schema，
 * 所以 mock 与模块重置必须同时生效（静态 import 会被提升而错过 mock）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/schema', () => ({ ensureSchema: vi.fn(async () => {}) }));

type SchemaMock = { ensureSchema: ReturnType<typeof vi.fn> };

async function loadFreshModule() {
  vi.resetModules();
  const mod = await import('@/lib/schema-init');
  const schema = (await import('@/lib/schema')) as unknown as SchemaMock;
  return { ensureDbReady: mod.ensureDbReady, reset: mod.__resetDbReadyForTests, schema };
}

describe('schema 就绪记忆化', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('并发调用只触发一次 ensureSchema（共享同一个 Promise）', async () => {
    const { ensureDbReady, schema } = await loadFreshModule();
    const settled = await Promise.allSettled([ensureDbReady(), ensureDbReady(), ensureDbReady()]);

    expect(settled.every((s) => s.status === 'fulfilled')).toBe(true);
    // 关键断言：并发三次调用，初始化只跑一次
    expect(schema.ensureSchema).toHaveBeenCalledTimes(1);
  });

  it('成功后复用结果，不再重复调用', async () => {
    const { ensureDbReady, schema } = await loadFreshModule();

    await ensureDbReady();
    await ensureDbReady();
    await ensureDbReady();

    expect(schema.ensureSchema).toHaveBeenCalledTimes(1);
  });

  it('初始化失败时所有并发调用拿到同一个错误（而不是各自重跑）', async () => {
    const { ensureDbReady, schema } = await loadFreshModule();
    schema.ensureSchema.mockRejectedValueOnce(new Error('boom'));

    const settled = await Promise.allSettled([ensureDbReady(), ensureDbReady()]);
    expect(settled.map((s) => s.status)).toEqual(['rejected', 'rejected']);
    // 并发期间只尝试一次，不会因失败而让每个请求各自初始化
    expect(schema.ensureSchema).toHaveBeenCalledTimes(1);
  });

  it('失败后经过重试延迟可以自愈', async () => {
    const { ensureDbReady, schema } = await loadFreshModule();
    schema.ensureSchema.mockRejectedValueOnce(new Error('首次失败'));

    await expect(ensureDbReady()).rejects.toThrow('首次失败');

    // 立刻重试仍在延迟窗口内 → 复用同一个失败结果，不再触发新初始化
    await expect(ensureDbReady()).rejects.toThrow('首次失败');
    expect(schema.ensureSchema).toHaveBeenCalledTimes(1);

    // 等过重试延迟后允许重试，并且成功
    schema.ensureSchema.mockResolvedValue(undefined);
    await new Promise((r) => setTimeout(r, 1100));
    await expect(ensureDbReady()).resolves.toBeUndefined();
  });
});
