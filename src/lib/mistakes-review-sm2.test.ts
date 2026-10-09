// @vitest-environment node
/**
 * mistakes/review：间隔重复推进 + 两条防滥用约束（真实 DB）。
 *
 * 路由本身很薄（只有孩子能调、id 必填），真正要钉的三件事都在 reviewMistake 里：
 *
 *  1. 归属：SELECT/UPDATE 都带 `AND child_id = ?`。少了它，孩子猜 id 就能改
 *     别人家错题的复习进度与 resolved 状态。
 *  2. 同日幂等：`next_review > 今天` 时直接返回 false（路由回 skipped）。
 *     否则同一天反复提交就能把间隔反复推进/重置 —— 变相刷复习进度。
 *  3. SM-2 推进语义：答错 → reps 归零、间隔回 1 天、EF −0.2（下限 1.3）；
 *     答对 → 交给 lib/sm2 的标准实现推进，并把 resolved 置 1。
 *
 * 第 3 条尤其值得测：源码注释记着这里曾经同时算两份递推且互不一致，
 * 真正写库用的是裸 round(interval*EF)，忽略了 reps 的特殊规则
 * （第 1 次复习存成 3 天、标准应为 1 天）。现在统一走 calculateSM2Next。
 *
 * 不 mock 数据层。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 1102, role: 'child' } as null | { id: number; role: string },
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));

import { POST } from '@/app/api/mistakes/review/route';
import { getDb, ensureSchema } from '@/lib/db';
import { dateStr, addDays } from '@/lib/date';

const ME = 1102;
const OTHER = 1105;
const TODAY = dateStr();

function req(body: unknown): NextRequest {
  return new Request('http://l/api/mistakes/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const db = () => getDb();

async function seedFamily(pid: number, cid: number) {
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', 'p')",
    args: [pid, 'mr-p' + pid],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', 'c', ?)",
    args: [cid, 'mr-c' + cid, pid],
  });
}

/** 插入一条待复习错题（默认今天就到期） */
async function addMistake(
  cid: number,
  opts: { nextReview?: string; reps?: number; interval?: number; ef?: number } = {}
): Promise<number> {
  await db().execute({
    sql: 'INSERT INTO mistakes (child_id, subject, kind, prompt, answer, next_review, interval_days, reps, easiness_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      cid,
      '语文',
      'test',
      'p',
      'a',
      opts.nextReview ?? TODAY,
      opts.interval ?? 1,
      opts.reps ?? 0,
      opts.ef ?? 2.5,
    ],
  });
  const r = await db().execute({ sql: 'SELECT last_insert_rowid() AS id', args: [] });
  return Number(r.rows[0].id);
}

async function stateOf(id: number) {
  const r = await db().execute({
    sql: 'SELECT reps, interval_days, easiness_factor, next_review, resolved FROM mistakes WHERE id = ?',
    args: [id],
  });
  const row = r.rows[0];
  return {
    reps: Number(row.reps),
    interval: Number(row.interval_days),
    ef: Number(row.easiness_factor),
    nextReview: String(row.next_review),
    resolved: Number(row.resolved ?? 0),
  };
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  await seedFamily(1101, ME);
  await seedFamily(1104, OTHER);
  for (const c of [ME, OTHER]) {
    await db().execute({ sql: 'DELETE FROM mistakes WHERE child_id = ?', args: [c] });
  }
});

describe('mistakes/review · 鉴权与入参', () => {
  it('非孩子 → 403', async () => {
    h.user = { id: 1101, role: 'parent' };
    expect((await POST(req({ id: 1, correct: true }))).status).toBe(403);
  });

  it('未登录 → 403', async () => {
    h.user = null;
    expect((await POST(req({ id: 1, correct: true }))).status).toBe(403);
  });

  it('缺 id → 400', async () => {
    expect((await POST(req({ correct: true }))).status).toBe(400);
  });
});

describe('mistakes/review · 归属与幂等', () => {
  it('⚠️ 复习别人家孩子的错题 id → skipped，且对方数据不得被改动', async () => {
    const theirs = await addMistake(OTHER);
    const before = await stateOf(theirs);
    const res = await POST(req({ id: theirs, correct: true }));
    const body = await res.json();
    console.log('  cross-child -> ' + JSON.stringify(body));
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(await stateOf(theirs), '越权改了别人家错题的复习状态').toEqual(before);
  });

  it('⚠️ 同日重复提交只算第一次（next_review 在未来 → skipped，数据不变）', async () => {
    const id = await addMistake(ME, { nextReview: addDays(TODAY, 5) });
    const before = await stateOf(id);
    const res = await POST(req({ id, correct: true }));
    expect((await res.json()).skipped).toBe(true);
    expect(await stateOf(id), '同日重复提交仍改动了进度').toEqual(before);
  });

  it('不存在的 id → skipped（不报错、不写入）', async () => {
    const res = await POST(req({ id: 999999, correct: true }));
    expect(res.status).toBe(200);
    expect((await res.json()).skipped).toBe(true);
  });
});

describe('mistakes/review · SM-2 推进语义', () => {
  it('答错 → reps 归零、间隔回 1 天、EF −0.2、resolved=0', async () => {
    const id = await addMistake(ME, { reps: 3, interval: 7, ef: 2.5 });
    const res = await POST(req({ id, correct: false }));
    expect((await res.json()).ok).toBe(true);
    const s = await stateOf(id);
    expect(s.reps).toBe(0);
    expect(s.interval).toBe(1);
    expect(s.ef).toBeCloseTo(2.3, 5);
    expect(s.resolved).toBe(0);
    expect(s.nextReview > TODAY, 'next_review 没有前进').toBe(true);
  });

  it('答错的 EF 有下限 1.3（不会无限衰减）', async () => {
    const id = await addMistake(ME, { ef: 1.3 });
    await POST(req({ id, correct: false }));
    expect((await stateOf(id)).ef).toBeCloseTo(1.3, 5);
  });

  it('答对 → 间隔推进且 resolved=1（沿用 lib/sm2 的标准递推）', async () => {
    const id = await addMistake(ME, { reps: 0, interval: 1, ef: 2.5, nextReview: TODAY });
    const res = await POST(req({ id, correct: true }));
    expect((await res.json()).ok).toBe(true);
    const s = await stateOf(id);
    expect(s.reps).toBeGreaterThan(0);
    expect(s.resolved).toBe(1);
    expect(s.nextReview > TODAY, 'next_review 没有前进').toBe(true);
  });
});
