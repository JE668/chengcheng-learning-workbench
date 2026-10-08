// @vitest-environment node
/**
 * story/capture 的前置条件、票据消耗与幂等性（真实 DB，不 mock 数据层）。
 *
 * 这条路由是「走故事 → 领萌可 → 拿到积分」的收口，防的是三类白拿：
 *   1. 没读故事 / 没答题就想领（前置校验）
 *   2. 跳过前面的章节直接领后章（顺序解锁）
 *   3. 同一章反复领（幂等 —— 重复请求不得重复发积分）
 *
 * 另外钉住一个容易被忽略的点：**票据不足时必须整体 ROLLBACK**，
 * 也就是 story_progress 不能留下半条记录。否则孩子可以靠「票据不足」的失败请求
 * 把进度白刷出来（下次请求就变成 already captured，等于绕过票据）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 7702, role: 'child' } as null | { id: number; role: string },
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));

import { POST } from '@/app/api/story/capture/route';
import { storyChapters } from '@/lib/story';
import { POINTS_PER_CAPTURE } from '@/lib/economy';
import { getDb, ensureSchema } from '@/lib/db';

const CHILD = 7702;
const C1 = storyChapters[0];
const C2 = storyChapters[1];

function req(body: unknown): NextRequest {
  return new Request('http://l/api/story/capture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const db = () => getDb();

async function readStory(chapterId: string) {
  await db().execute({
    sql: 'INSERT OR IGNORE INTO story_read (child_id, chapter_id) VALUES (?, ?)',
    args: [CHILD, chapterId],
  });
}
async function answerQuiz(chapterId: string) {
  await db().execute({
    sql: 'INSERT OR IGNORE INTO story_quiz (child_id, chapter_id) VALUES (?, ?)',
    args: [CHILD, chapterId],
  });
}
async function grantTicket(n: number) {
  await db().execute({
    sql: 'INSERT INTO capture_tickets (child_id, total, used) VALUES (?, ?, 0) ON CONFLICT(child_id) DO UPDATE SET total = total + ?',
    args: [CHILD, n, n],
  });
}
async function progressRows() {
  const r = await db().execute({
    sql: 'SELECT chapter_id FROM story_progress WHERE child_id = ?',
    args: [CHILD],
  });
  return r.rows.map((x) => String(x.chapter_id));
}
async function pointRows() {
  const r = await db().execute({
    sql: 'SELECT points, source FROM completions WHERE child_id = ?',
    args: [CHILD],
  });
  return r.rows;
}
async function ownedKeys() {
  const r = await db().execute({
    sql: 'SELECT moko_key FROM moko_owned WHERE child_id = ?',
    args: [CHILD],
  });
  return r.rows.map((x) => String(x.moko_key));
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: CHILD, role: 'child' };
  const d = db();
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (7701,'st-p','x','parent','p')",
    args: [],
  });
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',7701)",
    args: [CHILD, 'st-c' + CHILD],
  });
  for (const t of [
    'story_read',
    'story_quiz',
    'story_progress',
    'capture_tickets',
    'moko_owned',
    'completions',
    'growth_events',
  ]) {
    await d.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [CHILD] });
  }
});

describe('story/capture · 前置条件', () => {
  it('非孩子角色 → 403', async () => {
    h.user = { id: 7701, role: 'parent' };
    expect((await POST(req({ chapterId: C1.id }))).status).toBe(403);
  });

  it('未登录 → 403', async () => {
    h.user = null;
    expect((await POST(req({ chapterId: C1.id }))).status).toBe(403);
  });

  it('章节不存在 → 404', async () => {
    expect((await POST(req({ chapterId: 'no-such-chapter' }))).status).toBe(404);
  });

  it('⚠️ 没读故事 → 409 not_read，且不写任何进度', async () => {
    const res = await POST(req({ chapterId: C1.id }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('not_read');
    expect(await progressRows()).toEqual([]);
  });

  it('⚠️ 读了但没答题 → 409 not_quiz，且不写进度', async () => {
    await readStory(C1.id);
    const res = await POST(req({ chapterId: C1.id }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('not_quiz');
    expect(await progressRows()).toEqual([]);
  });

  it('⚠️ 顺序解锁：没领前一章就领第 2 章 → 409', async () => {
    await readStory(C2.id);
    await answerQuiz(C2.id);
    await grantTicket(5);
    const res = await POST(req({ chapterId: C2.id }));
    expect(res.status).toBe(409);
    expect(await progressRows()).toEqual([]);
  });
});

describe('story/capture · 票据与回滚', () => {
  it('⚠️ 第 2 章票据不足 → 409 no_ticket，且进度必须整体回滚', async () => {
    // 先正常领下第 1 章（第 1 章不需要票据）
    await readStory(C1.id);
    await answerQuiz(C1.id);
    expect((await POST(req({ chapterId: C1.id }))).status).toBe(200);

    // 第 2 章：读了、答题了、前一章也有，但**没有票据**
    await readStory(C2.id);
    await answerQuiz(C2.id);
    const res = await POST(req({ chapterId: C2.id }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('no_ticket');
    // 关键：第 2 章不得留下 story_progress（否则下次就变成 already captured，绕过票据）
    expect(await progressRows(), '失败请求留下了进度，可被用来绕过票据').toEqual([C1.id]);
  });

  it('有票据时第 2 章可以领，且票据被消耗', async () => {
    await readStory(C1.id);
    await answerQuiz(C1.id);
    await POST(req({ chapterId: C1.id }));
    await readStory(C2.id);
    await answerQuiz(C2.id);
    await grantTicket(1);
    const res = await POST(req({ chapterId: C2.id }));
    expect(res.status).toBe(200);
    const t = await db().execute({
      sql: 'SELECT total, used FROM capture_tickets WHERE child_id = ?',
      args: [CHILD],
    });
    expect(Number(t.rows[0].total)).toBe(1);
    expect(Number(t.rows[0].used)).toBe(1);
  });
});

describe('story/capture · 成功与幂等', () => {
  it('第 1 章全流程 → 200，萌可入城堡 + 一发一次积分', async () => {
    await readStory(C1.id);
    await answerQuiz(C1.id);
    const res = await POST(req({ chapterId: C1.id }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(await progressRows()).toEqual([C1.id]);
    expect((await ownedKeys()).length).toBeGreaterThan(0);
    const pts = await pointRows();
    expect(pts.length).toBe(1);
    expect(Number(pts[0].points)).toBe(POINTS_PER_CAPTURE);
  });

  it('⚠️ 重复领取 → 409 already，且**不得重复发积分**', async () => {
    await readStory(C1.id);
    await answerQuiz(C1.id);
    expect((await POST(req({ chapterId: C1.id }))).status).toBe(200);
    const second = await POST(req({ chapterId: C1.id }));
    expect(second.status).toBe(409);
    expect((await second.json()).code).toBe('already');
    expect((await pointRows()).length, '重复领取发了两次积分').toBe(1);
    expect(await progressRows()).toEqual([C1.id]);
  });
});
