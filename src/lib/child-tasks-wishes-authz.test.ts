// @vitest-environment node
/**
 * child-tasks 与 wishes 的授权/凭证校验（真实 DB）。
 *
 * ## child-tasks：服务端必须自己判「凭证」
 * 每个萌可小任务都绑定完成凭证（模块 ≥1 星 / 当天玩过对应小游戏）。
 * 前端把未解锁的按钮置灰**只是第一道防线** —— 直接 POST 就能绕过。
 * 所以这里钉死：没有凭证时标记完成必须 403 且**不落库**。
 * （否则孩子不学习也能把所有小任务点成完成。）
 *
 * ## wishes：家长审批的越权面
 * PATCH 的 `WHERE id = ? AND child_id = ?` 是 IDOR 闸门；少了 child_id，
 * 家长 A 能改家长 B 家孩子的愿望状态。被拒时状态必须不变。
 *
 * 两个文件都**不 mock 数据层**。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  user: { id: 2202, role: 'child' } as null | { id: number; role: string },
  childId: 2202 as number | null,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  resolveChildId: vi.fn(async () => h.childId),
}));

import { GET as tasksGet, POST as tasksPost } from '@/app/api/child-tasks/route';
import { GET as wishesGet, POST as wishesPost, PATCH as wishesPatch } from '@/app/api/wishes/route';
import { MOKO_TASKS } from '@/lib/moko-tasks';
import { getDb, ensureSchema } from '@/lib/db';

const ME = 2202;
const OTHER = 2205;
const LOCKED = MOKO_TASKS.find((t) => t.req.module)!; // 需要模块星星

function req(body: unknown): NextRequest {
  return new Request('http://l/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const db = () => getDb();

async function seedFamily(pid: number, cid: number) {
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, 'x', 'parent', 'p')",
    args: [pid, 'cw-p' + pid],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?, ?, 'x', 'child', 'c', ?)",
    args: [cid, 'cw-c' + cid, pid],
  });
}

async function taskDone(cid: number, key: string): Promise<number | null> {
  const r = await db().execute({
    sql: 'SELECT done FROM child_tasks WHERE child_id = ? AND task_key = ?',
    args: [cid, key],
  });
  return r.rows.length ? Number(r.rows[0].done) : null;
}

async function wishStatus(id: number): Promise<string> {
  const r = await db().execute({ sql: 'SELECT status FROM wishes WHERE id = ?', args: [id] });
  return String(r.rows[0]?.status);
}

async function addWish(cid: number, text = 'test'): Promise<number> {
  await db().execute({
    sql: "INSERT INTO wishes (child_id, text, status) VALUES (?, ?, 'pending')",
    args: [cid, text],
  });
  const r = await db().execute({ sql: 'SELECT last_insert_rowid() AS id', args: [] });
  return Number(r.rows[0].id);
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  h.childId = ME;
  await seedFamily(2201, ME);
  await seedFamily(2204, OTHER);
  for (const c of [ME, OTHER]) {
    await db().execute({ sql: 'DELETE FROM child_tasks WHERE child_id = ?', args: [c] });
    await db().execute({ sql: 'DELETE FROM module_progress WHERE child_id = ?', args: [c] });
    await db().execute({ sql: 'DELETE FROM wishes WHERE child_id = ?', args: [c] });
  }
});

describe('child-tasks · 完成凭证由服务端判定', () => {
  it('未登录 → 401（GET 与 POST）', async () => {
    h.user = null;
    expect((await tasksGet()).status).toBe(401);
    expect((await tasksPost(req({ key: 'apple', done: true }))).status).toBe(401);
  });

  it('未知任务 key → 400（白名单，防止写脏数据）', async () => {
    const res = await tasksPost(req({ key: 'not-a-real-task', done: true }));
    expect(res.status).toBe(400);
  });

  it('缺少 key → 400', async () => {
    expect((await tasksPost(req({ done: true }))).status).toBe(400);
  });

  it('⚠️ 没有凭证却标记完成 → 403 且不落库（前端置灰挡不住直接 POST）', async () => {
    const res = await tasksPost(req({ key: LOCKED.key, done: true }));
    const body = await res.json();
    console.log('  locked -> status=' + res.status + ' ' + JSON.stringify(body));
    expect(res.status).toBe(403);
    expect(body.locked).toBe(true);
    // 关键：不能留下 done=1
    const d = await taskDone(ME, LOCKED.key);
    expect(d === 1, '没凭证却把任务标成完成了').toBe(false);
  });

  it('达成凭证（模块 ≥1 星）后可以标记完成并落库', async () => {
    const m = LOCKED.req.module!;
    await db().execute({
      sql: 'INSERT INTO module_progress (child_id, subject, module_key, stars, rounds) VALUES (?, ?, ?, 1, 1)',
      args: [ME, m.subject, m.key],
    });
    const res = await tasksPost(req({ key: LOCKED.key, done: true }));
    expect(res.status).toBe(200);
    expect(await taskDone(ME, LOCKED.key)).toBe(1);
  });

  it('取消完成不需要凭证：先标完成再取消 → 回到 0', async () => {
    // setChildTask(done=false) 只做 UPDATE（不插入），所以要先有 done=1 的行。
    const m = LOCKED.req.module!;
    await db().execute({
      sql: 'INSERT INTO module_progress (child_id, subject, module_key, stars, rounds) VALUES (?, ?, ?, 1, 1)',
      args: [ME, m.subject, m.key],
    });
    expect((await tasksPost(req({ key: LOCKED.key, done: true }))).status).toBe(200);
    expect(await taskDone(ME, LOCKED.key)).toBe(1);

    // 取消方向不做凭证校验（把已完成改回未完成不会白拿奖励）
    expect((await tasksPost(req({ key: LOCKED.key, done: false }))).status).toBe(200);
    expect(await taskDone(ME, LOCKED.key)).toBe(0);
  });

  it('GET 返回 done 与 unlocked 两份映射', async () => {
    const body = await (await tasksGet()).json();
    expect(body.done).toBeTypeOf('object');
    expect(body.unlocked).toBeTypeOf('object');
    expect(body.unlocked[LOCKED.key], '没学过却显示已解锁').toBe(false);
  });
});

describe('wishes · 越权与入参', () => {
  it('POST：空白内容 → 400', async () => {
    for (const t of ['', '   ', '\n']) {
      expect((await wishesPost(req({ text: t }))).status, JSON.stringify(t)).toBe(400);
    }
  });

  it('POST：内容 trim 且截断到 100 字', async () => {
    await wishesPost(req({ text: '   ' + 'x'.repeat(150) + '   ' }));
    const r = await db().execute({
      sql: 'SELECT text FROM wishes WHERE child_id = ? ORDER BY id DESC LIMIT 1',
      args: [ME],
    });
    const saved = String(r.rows[0].text);
    expect(saved.length).toBe(100);
    expect(saved.startsWith('x')).toBe(true);
  });

  it('PATCH：非家长 → 403', async () => {
    const id = await addWish(ME);
    expect((await wishesPatch(req({ id, status: 'approved' }))).status).toBe(403);
  });

  it('PATCH：非法状态 → 400', async () => {
    h.user = { id: 2201, role: 'parent' };
    const id = await addWish(ME);
    for (const s of ['', 'pending', 'delete', 'APPROVED']) {
      expect((await wishesPatch(req({ id, status: s }))).status, s).toBe(400);
    }
  });

  it('⚠️ PATCH：改别人家孩子的愿望 → 403 且状态不变（IDOR 闸门）', async () => {
    const otherWish = await addWish(OTHER);
    h.user = { id: 2201, role: 'parent' };
    h.childId = ME; // 当前选中的是自己孩子
    const res = await wishesPatch(req({ id: otherWish, status: 'approved' }));
    console.log('  cross-child wish -> status=' + res.status);
    expect(res.status).toBe(403);
    expect(await wishStatus(otherWish), '越权审批改动了别人的数据').toBe('pending');
  });

  it('PATCH：改自己孩子的愿望 → 200 并落库', async () => {
    const id = await addWish(ME);
    h.user = { id: 2201, role: 'parent' };
    h.childId = ME;
    expect((await wishesPatch(req({ id, status: 'fulfilled' }))).status).toBe(200);
    expect(await wishStatus(id)).toBe('fulfilled');
  });

  it('GET：孩子只看到自己的愿望', async () => {
    await addWish(ME, 'mine');
    await addWish(OTHER, 'theirs');
    h.user = { id: ME, role: 'child' };
    const body = await (await wishesGet()).json();
    const texts = body.wishes.map((w: { text: string }) => w.text);
    expect(texts).toContain('mine');
    expect(texts, '看到了别人家孩子的愿望').not.toContain('theirs');
  });
});
