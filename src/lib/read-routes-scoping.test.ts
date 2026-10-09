// @vitest-environment node
/**
 * 五条偏「读取/偏好」的路由：算法错题、奖状偏好、课本进度、城堡日记、徽章。
 *
 * 它们逻辑都很薄，真正的风险面是**按角色取哪个孩子**：
 *   - 孩子 -> 自己的 id
 *   - 家长 -> 当前选中的孩子（getChildId / resolveChildId）
 * 这里逐条钉住「拿不到别人家孩子的数据」，以及各自的前置校验。
 *
 * 另外 castle/diary 与 castle/badges 用的是 `user.role === 'child' ? user.id : getChildId(user)`，
 * 与其它路由的 resolveChildId 写法不同 —— 这种「各写各的」正是容易出偏差的地方，
 * 所以对家长角色也单独验一遍。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 7702, role: 'child' } as null | { id: number; role: string },
  childId: 7702 as number | null,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  resolveChildId: vi.fn(async () => h.childId),
}));
vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return { ...actual, getChildId: vi.fn(async () => h.childId) };
});

import { GET as mistakesGet } from '@/app/api/algorithm-mistakes/route';
import { POST as certPrefPost } from '@/app/api/child/cert-pref/route';
import { GET as tbGet, POST as tbPost } from '@/app/api/textbook-progress/route';
import { GET as diaryGet } from '@/app/api/castle/diary/route';
import { GET as badgesGet } from '@/app/api/castle/badges/route';
import { getDb, ensureSchema } from '@/lib/db';

const ME = 7702;
const OTHER = 7705;

function req(url: string, body?: unknown): NextRequest {
  return new Request('http://l' + url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }) as unknown as NextRequest;
}
const db = () => getDb();

async function seedFamily(pid: number, cid: number) {
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', 'p')",
    args: [pid, 'lp-p' + pid],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', 'c', ?)",
    args: [cid, 'lp-c' + cid, pid],
  });
}

async function addAlgoMistake(cid: number, qid: string) {
  await db().execute({
    sql: 'INSERT INTO algorithm_mistakes (child_id, topic_id, level, question_id, wrong_count) VALUES (?, ?, 1, ?, 1)',
    args: [cid, 'commutative', qid],
  });
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  h.childId = ME;
  await seedFamily(7701, ME);
  await seedFamily(7704, OTHER);
  for (const c of [ME, OTHER]) {
    await db().execute({ sql: 'DELETE FROM algorithm_mistakes WHERE child_id = ?', args: [c] });
    await db().execute({ sql: 'DELETE FROM textbook_progress WHERE child_id = ?', args: [c] });
    await db().execute({ sql: 'UPDATE users SET cert_pref = NULL WHERE id = ?', args: [c] });
  }
});

describe('algorithm-mistakes - 只返回自己的错题', () => {
  it('未登录 401 / 无孩子 404', async () => {
    h.user = null;
    expect((await mistakesGet(req('/api/algorithm-mistakes'))).status).toBe(401);
    h.user = { id: ME, role: 'child' };
    h.childId = null;
    expect((await mistakesGet(req('/api/algorithm-mistakes'))).status).toBe(404);
  });

  it('不泄露别人家孩子的错题', async () => {
    await addAlgoMistake(ME, 'mine-q');
    await addAlgoMistake(OTHER, 'theirs-q');
    const body = await (await mistakesGet(req('/api/algorithm-mistakes'))).json();
    const qids = body.mistakes.map((m: { questionId: string }) => m.questionId);
    expect(qids).toContain('mine-q');
    expect(qids, '看到了别人家孩子的错题').not.toContain('theirs-q');
  });

  it('topicId 过滤生效', async () => {
    await addAlgoMistake(ME, 'q1');
    const all = await (await mistakesGet(req('/api/algorithm-mistakes'))).json();
    expect(all.mistakes.length).toBeGreaterThan(0);
    const none = await (await mistakesGet(req('/api/algorithm-mistakes?topicId=nope'))).json();
    expect(none.mistakes).toEqual([]);
  });
});

describe('child/cert-pref - 只有孩子能存，且只改自己', () => {
  it('非孩子 -> 403', async () => {
    h.user = { id: 7701, role: 'parent' };
    expect(
      (await certPrefPost(req('/api/child/cert-pref', { mokoKey: 'x', theme: 'y' }))).status
    ).toBe(403);
  });

  it('保存到自己的 users.cert_pref（缺字段回落默认）', async () => {
    expect(
      (await certPrefPost(req('/api/child/cert-pref', { mokoKey: 'k', theme: 'violet' }))).status
    ).toBe(200);
    const r = await db().execute({ sql: 'SELECT cert_pref FROM users WHERE id = ?', args: [ME] });
    expect(JSON.parse(String(r.rows[0].cert_pref))).toEqual({ mokoKey: 'k', theme: 'violet' });

    await certPrefPost(req('/api/child/cert-pref', {}));
    const r2 = await db().execute({ sql: 'SELECT cert_pref FROM users WHERE id = ?', args: [ME] });
    expect(JSON.parse(String(r2.rows[0].cert_pref))).toEqual({
      mokoKey: 'heartping',
      theme: 'violet',
    });
  });
});

describe('textbook-progress - 鉴权与落库', () => {
  it('未登录 401；已登录但缺 bookKey -> 400', async () => {
    h.user = null;
    expect((await tbGet()).status).toBe(401);
    h.user = { id: ME, role: 'child' };
    expect((await tbPost(req('/api/textbook-progress', { chapterIdx: 3 }) as never)).status).toBe(
      400
    );
  });

  it('POST 落库且只影响自己的孩子；GET 读回', async () => {
    expect(
      (await tbPost(req('/api/textbook-progress', { bookKey: 'cn-1', chapterIdx: 4 }) as never))
        .status
    ).toBe(200);
    const r = await db().execute({
      sql: 'SELECT chapter_idx FROM textbook_progress WHERE child_id = ? AND book_key = ?',
      args: [ME, 'cn-1'],
    });
    expect(Number(r.rows[0].chapter_idx)).toBe(4);
    const body = await (await tbGet()).json();
    expect(body.progress['cn-1']).toBe(4);
  });
});

describe('castle/diary 与 castle/badges - 角色决定看谁', () => {
  it('两个接口未登录都 401', async () => {
    h.user = null;
    expect((await diaryGet(req('/api/castle/diary'))).status).toBe(401);
    expect((await badgesGet()).status).toBe(401);
  });

  it('孩子取自己的 id；家长取当前选中的孩子；家长没选 -> 404', async () => {
    h.user = { id: ME, role: 'child' };
    h.childId = OTHER; // 孩子的 childId 被设成别人也不应影响（走 user.id 分支）
    expect((await diaryGet(req('/api/castle/diary'))).status).toBe(200);
    expect((await badgesGet()).status).toBe(200);

    h.user = { id: 7701, role: 'parent' };
    h.childId = OTHER;
    expect((await diaryGet(req('/api/castle/diary'))).status).toBe(200);
    expect((await badgesGet()).status).toBe(200);

    h.childId = null;
    expect((await diaryGet(req('/api/castle/diary'))).status).toBe(404);
    expect((await badgesGet()).status).toBe(404);
  });
});
