import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './db';
import { ensureSchema } from './schema';
import {
  getModuleProgressAll,
  getModuleProgress,
  upsertModuleProgress,
  getChildTasks,
  setChildTask,
  getTextbookProgress,
  setTextbookProgress,
  tsToMs,
} from './progress-store';

let childSeq = 9000;
function nextChild(): number {
  return ++childSeq;
}

async function insertChild(id: number) {
  await getDb().execute({
    sql: "INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')",
    args: [id, 'testchild' + id],
  });
}

describe('progress-store 进度存储层', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    // 先断开外键关联，再删除所有引用 users 的表，最后删 users
    await db.execute({ sql: 'UPDATE users SET selected_child_id = NULL, parent_id = NULL', args: [] });
    await db.execute({ sql: 'DELETE FROM module_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM child_tasks', args: [] });
    await db.execute({ sql: 'DELETE FROM textbook_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
    await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
    await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
    await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
    await db.execute({ sql: 'DELETE FROM inventory', args: [] });
    await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
    await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
    await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
    await db.execute({ sql: 'DELETE FROM wishes', args: [] });
    await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
    await db.execute({ sql: 'DELETE FROM story_read', args: [] });
    await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
    await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
  });

  async function insertChild(id: number) {
    await getDb().execute({
      sql: "INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')",
      args: [id, 'testchild' + id],
    });
  }

  describe('progress-store 进度存储层', () => {
    beforeEach(async () => {
      const db = getDb();
      // 先断开外键关联，再删除所有引用 users 的表，最后删 users
      await db.execute({ sql: 'UPDATE users SET selected_child_id = NULL, parent_id = NULL', args: [] });
      await db.execute({ sql: 'DELETE FROM module_progress', args: [] });
      await db.execute({ sql: 'DELETE FROM child_tasks', args: [] });
      await db.execute({ sql: 'DELETE FROM textbook_progress', args: [] });
      await db.execute({ sql: 'DELETE FROM completions', args: [] });
      await db.execute({ sql: 'DELETE FROM mistakes', args: [] });
      await db.execute({ sql: 'DELETE FROM daily_practice', args: [] });
      await db.execute({ sql: 'DELETE FROM daily_checkins', args: [] });
      await db.execute({ sql: 'DELETE FROM castle_state', args: [] });
      await db.execute({ sql: 'DELETE FROM moko_owned', args: [] });
      await db.execute({ sql: 'DELETE FROM inventory', args: [] });
      await db.execute({ sql: 'DELETE FROM troublemakers', args: [] });
      await db.execute({ sql: 'DELETE FROM capture_tickets', args: [] });
      await db.execute({ sql: 'DELETE FROM cert_requests', args: [] });
      await db.execute({ sql: 'DELETE FROM wishes', args: [] });
      await db.execute({ sql: 'DELETE FROM story_progress', args: [] });
      await db.execute({ sql: 'DELETE FROM story_read', args: [] });
      await db.execute({ sql: 'DELETE FROM story_quiz', args: [] });
      await db.execute({ sql: 'DELETE FROM growth_events', args: [] });
      await db.execute({ sql: "DELETE FROM users WHERE role = 'child'", args: [] });
      await db.execute({ sql: "DELETE FROM users WHERE role = 'parent'", args: [] });
    });

    async function insertChild(id: number) {
      await getDb().execute({
        sql: "INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')",
        args: [id, 'testchild' + id],
      });
    }

    describe('tsToMs', () => {
      it('converts valid date string to timestamp', () => {
        const ts = tsToMs('2024-01-15 10:30:00');
        expect(ts).toBeGreaterThan(0);
      });

      it('handles null/undefined', () => {
        expect(tsToMs(null)).toBe(0);
        expect(tsToMs(undefined)).toBe(0);
      });

      it('handles invalid date string', () => {
        expect(tsToMs('invalid')).toBe(0);
      });
    });

    describe('模块进度 upsert + get', () => {
      it('creates new record when none exists', async () => {
        const cid = nextChild();
        await insertChild(cid);

        const result = await upsertModuleProgress(cid, '语文', 'characters', 2);

        expect(result.subject).toBe('语文');
        expect(result.moduleKey).toBe('characters');
        expect(result.stars).toBe(2);
        expect(result.best).toBe(2);
        expect(result.rounds).toBe(1);
        expect(result.lastPlayed).toBeGreaterThan(0);
      });

      it('takes max of existing stars and new stars', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await upsertModuleProgress(cid, '数学', 'count', 3);
        const result = await upsertModuleProgress(cid, '数学', 'count', 1);

        expect(result.stars).toBe(3);
        expect(result.best).toBe(3);
        expect(result.rounds).toBe(2);
      });

      it('increments rounds on each upsert', async () => {
        const cid = nextChild();
        await insertChild(cid);

        const r1 = await upsertModuleProgress(cid, '英语', 'letters', 2);
        const r2 = await upsertModuleProgress(cid, '英语', 'letters', 2);
        const r3 = await upsertModuleProgress(cid, '英语', 'letters', 3);

        // 第一次 upsert 创建记录 rounds=1，第二次递增为 2，第三次递增为 3
        expect(r1.rounds).toBe(1);
        expect(r2.rounds).toBe(2);
        expect(r3.rounds).toBe(3);
      });

      it('getModuleProgress returns correct data', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await upsertModuleProgress(cid, '语文', 'poems', 3);
        const progress = await getModuleProgress(cid, '语文', 'poems');

        expect(progress).not.toBeNull();
        expect(progress.subject).toBe('语文');
        expect(progress.moduleKey).toBe('poems');
        expect(progress.stars).toBe(3);
        expect(progress.rounds).toBe(1);
      });

      it('getModuleProgress returns null for missing', async () => {
        const cid = nextChild();
        await insertChild(cid);

        const progress = await getModuleProgress(cid, '语文', 'nonexistent');
        expect(progress).toBeNull();
      });

      it('getModuleProgressAll returns all records', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await upsertModuleProgress(cid, '语文', 'characters', 2);
        await upsertModuleProgress(cid, '数学', 'count', 1);
        await upsertModuleProgress(cid, '英语', 'letters', 3);

        const all = await getModuleProgressAll(cid);
        expect(all.length).toBe(3);

        const subjects = all.map(p => p.subject).sort();
        // 排序顺序取决于 locale，只验证包含这三个科目
        expect(subjects).toContain('语文');
        expect(subjects).toContain('数学');
        expect(subjects).toContain('英语');
        expect(subjects.length).toBe(3);
      });
    });

    describe('小任务 get/set', () => {
      it('sets task as done', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await setChildTask(cid, 'task_01', true);
        const tasks = await getChildTasks(cid);

        expect(tasks['task_01']).toBe(true);
      });

      it('returns false for unset task', async () => {
        const cid = nextChild();
        await insertChild(cid);

        const tasks = await getChildTasks(cid);
        expect(tasks['unknown']).toBeUndefined();
      });

      it('updates existing task', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await setChildTask(cid, 'task_01', true);
        let tasks = await getChildTasks(cid);
        expect(tasks['task_01']).toBe(true);

        await setChildTask(cid, 'task_01', false);
        tasks = await getChildTasks(cid);
        // getChildTasks 只返回 done=1 的任务，设为 false 后应不在结果中
        expect(tasks['task_01']).toBeUndefined();
      });
    });

    describe('课本阅读进度', () => {
      it('sets and gets textbook progress', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await setTextbookProgress(cid, 'chinese_g1', 3);
        const progress = await getTextbookProgress(cid);

        expect(progress['chinese_g1']).toBe(3);
      });

      it('returns empty for no progress', async () => {
        const cid = nextChild();
        await insertChild(cid);

        const progress = await getTextbookProgress(cid);
        expect(Object.keys(progress).length).toBe(0);
      });

      it('updates existing progress', async () => {
        const cid = nextChild();
        await insertChild(cid);

        await setTextbookProgress(cid, 'math_g1', 1);
        await setTextbookProgress(cid, 'math_g1', 5);
        const progress = await getTextbookProgress(cid);

        expect(progress['math_g1']).toBe(5);
      });
    });
  });
});
