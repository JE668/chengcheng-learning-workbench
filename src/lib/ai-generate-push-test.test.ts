// @vitest-environment node
/**
 * ai/generate 与 push/test —— 两条「会花外部资源」的路由。
 *
 * ## ai/generate
 * 它调用 NVIDIA 付费 LLM，所以有三道成本/滥用闸门，注释写明都是有意加的：
 *   · 必须登录（401）
 *   · 按用户限流 10 次/分钟（429）
 *   · **count 钳制到 1~5 的整数** —— 注释原话「防止传入超大值造成巨额 token
 *     成本 / DoS」
 * 这里把 count 钳制钉死：直接检查传给 generateObject 的 prompt 里出现的题量。
 * （只断言状态码是不够的 —— 钳制失败照样返回 200。）
 *
 * ## push/test
 * 它会让**服务器主动向订阅地址发请求**，所以必须限流，否则可被当作探测工具刷。
 * 另外未配置 VAPID 时应回 503 而不是硬发，没有订阅时回 404。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 9902, role: 'child' } as null | { id: number; role: string },
  childId: 9902 as number | null,
  limit: { ok: true, retryAfter: 0 } as { ok: boolean; retryAfter: number },
  configured: true,
  sent: [] as unknown[],
  lastPrompt: '' as string,
  generateThrows: false,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  resolveChildId: vi.fn(async () => h.childId),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => h.limit),
  getClientIp: vi.fn(() => '1.2.3.4'),
}));
vi.mock('ai', () => ({
  generateObject: vi.fn(async (args: { prompt: string }) => {
    h.lastPrompt = args.prompt;
    if (h.generateThrows) throw new Error('upstream exploded');
    return {
      object: [
        {
          id: 'q1',
          kind: 'chinese',
          subject: '语文',
          prompt: 'p',
          options: ['a', 'b'],
          answer: 'a',
        },
      ],
    };
  }),
}));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: () => (model: string) => ({ model }),
}));
vi.mock('@/lib/push-notifications', () => ({
  isPushConfigured: true,
  sendPushNotification: vi.fn(async (sub: unknown) => {
    h.sent.push(sub);
  }),
}));

import { POST as genPost } from '@/app/api/ai/generate/route';
import { POST as pushPost } from '@/app/api/push/test/route';
import { getDb, ensureSchema } from '@/lib/db';

const ME = 9902;

function req(url: string, body: unknown): Request {
  return new Request('http://l' + url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const db = () => getDb();

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  h.childId = ME;
  h.limit = { ok: true, retryAfter: 0 };
  h.configured = true;
  h.sent = [];
  h.lastPrompt = '';
  h.generateThrows = false;
  process.env.NVIDIA_API_KEY = 'test-key';
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (9901,'ag2-p','x','parent','p')",
    args: [],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',9901)",
    args: [ME, 'ag2-c' + ME],
  });
  await db().execute({ sql: 'DELETE FROM push_subscriptions WHERE child_id = ?', args: [ME] });
});

describe('ai/generate · 鉴权与成本闸门', () => {
  it('未登录 → 401（且不调用 LLM）', async () => {
    h.user = null;
    const res = await genPost(req('/api/ai/generate', { kind: 'chinese' }) as never);
    expect(res.status).toBe(401);
    expect(h.lastPrompt).toBe('');
  });

  it('限流触发 → 429', async () => {
    h.limit = { ok: false, retryAfter: 42 };
    const res = await genPost(req('/api/ai/generate', {}) as never);
    expect(res.status).toBe(429);
    expect(h.lastPrompt).toBe('');
  });

  it('未配置 NVIDIA_API_KEY → 500，且不调用 LLM', async () => {
    delete process.env.NVIDIA_API_KEY;
    const res = await genPost(req('/api/ai/generate', {}) as never);
    expect(res.status).toBe(500);
    expect(h.lastPrompt).toBe('');
  });

  it('⚠️ count 被钳制到 1~5（防巨额 token 成本 / DoS）', async () => {
    const cases: Array<[unknown, number]> = [
      [99999, 5],
      [1000, 5],
      [6, 5],
      [5, 5],
      [3, 3],
      [1, 1],
      [0, 1],
      [-7, 1],
      [2.9, 2],
      ['abc', 3], // 非数字回落到默认 3
    ];
    for (const [input, expected] of cases) {
      h.lastPrompt = '';
      const res = await genPost(req('/api/ai/generate', { count: input }) as never);
      expect(res.status, 'count=' + String(input)).toBe(200);
      expect(h.lastPrompt, 'count=' + String(input) + ' 未按 ' + expected + ' 钳制').toContain(
        '生成 ' + expected + ' 道'
      );
    }
  });

  it('成功 → 200 并返回 questions', async () => {
    const res = await genPost(req('/api/ai/generate', { count: 2 }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.questions.length).toBe(1);
  });

  it('上游抛错 → 500（不把异常抛成未捕获错误）', async () => {
    h.generateThrows = true;
    const res = await genPost(req('/api/ai/generate', {}) as never);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('AI 生成失败');
  });
});

describe('push/test · 限流与前置状态', () => {
  it('限流触发 → 429（服务器主动外发必须限流）', async () => {
    h.limit = { ok: false, retryAfter: 30 };
    const res = await pushPost(req('/api/push/test', { title: 't', body: 'b' }) as never);
    expect(res.status).toBe(429);
    expect(h.sent.length).toBe(0);
  });

  it('未登录 → 401', async () => {
    h.user = null;
    expect((await pushPost(req('/api/push/test', {}) as never)).status).toBe(401);
  });

  it('没有订阅 → 404，且不发任何请求', async () => {
    const res = await pushPost(req('/api/push/test', {}) as never);
    expect(res.status).toBe(404);
    expect(h.sent.length).toBe(0);
  });

  it('有订阅 → 只向当前孩子的订阅发送，并回传统计', async () => {
    await db().execute({
      sql: 'INSERT INTO push_subscriptions (child_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      args: [ME, 'https://push.example/a', 'k', 'a'],
    });
    const res = await pushPost(req('/api/push/test', {}) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
    expect(body.sent).toBe(1);
    expect(h.sent.length).toBe(1);
  });
});
