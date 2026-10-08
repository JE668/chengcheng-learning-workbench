// @vitest-environment node
/**
 * story/read · story/quiz · story/progress。
 *
 * 三者共同决定「孩子能不能捕捉萌可」，核心完整性在于：
 *   捕捉的准入 = 读过故事 **且** 答对过小问题。
 * 所以最要钉的是 —— **答错绝不能留下 quiz 记录**。一旦答错也算通过，
 * 孩子随便点一下就能解锁捕捉（而捕捉要消耗捕捉券、并发放积分）。
 *
 * 另外两处容易出问题的细节：
 *   · 答错的响应**不得泄露正确答案**（否则等于把答案直接告诉孩子）
 *   · 重复提交必须幂等（都走 INSERT OR IGNORE），不能产生多行
 *
 * progress 的 nextIndex / tickets 是前端判定「下一集能不能进」的依据，
 * 用真实 DB 直接断言它的计算。
 *
 * 本文件刻意**不 mock 数据层**。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 5502, role: 'child' } as null | { id: number; role: string },
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));

import { POST as markRead } from '@/app/api/story/read/route';
import { POST as submitQuiz } from '@/app/api/story/quiz/route';
import { GET as getProgress } from '@/app/api/story/progress/route';
import { storyChapters } from '@/lib/story';
import { getDb, ensureSchema } from '@/lib/db';

const CHILD = 5502;
// 取一个确实带小问题的章节（HERO_CHAPTERS_Q 优先）
const CH = storyChapters.find((c) => c.quiz)!;
const CH_ID = CH.id;
const CORRECT = CH.quiz!.answer;

function post(url: string, body: unknown): NextRequest {
  return new Request('http://l' + url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const db = () => getDb();

async function quizRows() {
  const r = await db().execute({
    sql: 'SELECT chapter_id FROM story_quiz WHERE child_id = ?',
    args: [CHILD],
  });
  return r.rows.map((x) => String(x.chapter_id));
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: CHILD, role: 'child' };
  const d = db();
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (5501,'sq-p','x','parent','p')",
    args: [],
  });
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',5501)",
    args: [CHILD, 'sq-c' + CHILD],
  });
  for (const t of ['story_read', 'story_quiz', 'story_progress', 'capture_tickets']) {
    await d.execute({ sql: `DELETE FROM ${t} WHERE child_id = ?`, args: [CHILD] });
  }
});

describe('story/read · 标记已读', () => {
  it('非孩子 → 403', async () => {
    h.user = { id: 5501, role: 'parent' };
    expect((await markRead(post('/api/story/read', { chapterId: CH_ID }))).status).toBe(403);
  });

  it('章节不存在 → 404', async () => {
    expect((await markRead(post('/api/story/read', { chapterId: 'nope' }))).status).toBe(404);
  });

  it('正常标记 → 200，且重复标记不产生多行', async () => {
    expect((await markRead(post('/api/story/read', { chapterId: CH_ID }))).status).toBe(200);
    expect((await markRead(post('/api/story/read', { chapterId: CH_ID }))).status).toBe(200);
    const r = await db().execute({
      sql: 'SELECT COUNT(*) AS n FROM story_read WHERE child_id = ?',
      args: [CHILD],
    });
    expect(Number(r.rows[0].n)).toBe(1);
  });
});

describe('story/quiz · 必须答对才算通过', () => {
  it('⚠️ 没读故事就答题 → 409 not_read', async () => {
    const res = await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: CORRECT }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('not_read');
    expect(await quizRows()).toEqual([]);
  });

  it('⚠️ 答错 → 不记录通过（否则随便点一下就能解锁捕捉）', async () => {
    await markRead(post('/api/story/read', { chapterId: CH_ID }));
    const wrong = CORRECT === 0 ? 1 : 0;
    const res = await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: wrong }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe('wrong');
    expect(await quizRows(), '答错却记成了通过').toEqual([]);
  });

  it('⚠️ 答错的响应不得泄露正确答案', async () => {
    await markRead(post('/api/story/read', { chapterId: CH_ID }));
    const wrong = CORRECT === 0 ? 1 : 0;
    const res = await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: wrong }));
    const raw = JSON.stringify(await res.json());
    // 正确答案通常是个小整数；不能出现在任何字段里（除非恰好等于传入的错答）
    expect(raw, '响应体泄露了答案').not.toMatch(new RegExp('"answer"\\s*:'));
    expect(raw).not.toContain(String(CORRECT));
  });

  it('答对 → 记录通过，且重复提交幂等', async () => {
    await markRead(post('/api/story/read', { chapterId: CH_ID }));
    const res = await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: CORRECT }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: String(CORRECT) }));
    expect(await quizRows()).toEqual([CH_ID]);
  });

  it('非孩子 → 403；章节没有题目 → 404', async () => {
    h.user = { id: 5501, role: 'parent' };
    expect(
      (await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: 0 }))).status
    ).toBe(403);
    h.user = { id: CHILD, role: 'child' };
    const noQuiz = storyChapters.find((c) => !c.quiz);
    if (noQuiz) {
      expect(
        (await submitQuiz(post('/api/story/quiz', { chapterId: noQuiz.id, answer: 0 }))).status
      ).toBe(404);
    }
  });
});

describe('story/progress · 汇总计算', () => {
  it('非孩子 → 403', async () => {
    h.user = { id: 5501, role: 'parent' };
    expect((await getProgress()).status).toBe(403);
  });

  it('全新孩子 → nextIndex 0、tickets 0、三个列表皆空', async () => {
    const body = await (await getProgress()).json();
    expect(body.nextIndex).toBe(0);
    expect(body.tickets).toBe(0);
    expect(body.captured).toEqual([]);
    expect(body.read).toEqual([]);
    expect(body.quiz).toEqual([]);
    expect(body.total).toBe(storyChapters.length);
    expect(body.allDone).toBe(false);
  });

  it('read / quiz 状态会出现在汇总里', async () => {
    await markRead(post('/api/story/read', { chapterId: CH_ID }));
    await submitQuiz(post('/api/story/quiz', { chapterId: CH_ID, answer: CORRECT }));
    const body = await (await getProgress()).json();
    expect(body.read).toContain(CH_ID);
    expect(body.quiz).toContain(CH_ID);
  });

  it('nextIndex 跳过已捕捉的连续前缀；tickets = total - used', async () => {
    const d = db();
    await d.execute({
      sql: 'INSERT INTO story_progress (child_id, chapter_id) VALUES (?, ?)',
      args: [CHILD, storyChapters[0].id],
    });
    await d.execute({
      sql: 'INSERT INTO capture_tickets (child_id, total, used) VALUES (?, 5, 2)',
      args: [CHILD],
    });
    const body = await (await getProgress()).json();
    expect(body.nextIndex).toBe(1);
    expect(body.tickets).toBe(3);
  });
});
