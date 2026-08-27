import { getDb } from './db-core';

/**
 * 服务端进度存储层：把「学习进度 / 小任务 / 课本阅读位置」从 localStorage 迁移到 DB，
 * 实现跨设备一致（同一孩子在手机、平板、家长端看到的是同一份数据）。
 * 全部按 child_id 隔离，配合 auth.resolveChildId 使用。
 */

export interface ModuleProgressRow {
  subject: string;
  moduleKey: string;
  /** 历史最佳星数（0~3） */
  stars: number;
  /** 与 stars 同步，便于扩展 */
  best: number;
  /** 完成的轮数 */
  rounds: number;
  /** 最近一次游玩时间戳（epoch ms） */
  lastPlayed: number;
}

export function tsToMs(v: unknown): number {
  if (!v) return 0;
  const t = new Date(String(v)).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 取某个孩子的全部模块进度（用于成长树聚合）。 */
export async function getModuleProgressAll(childId: number): Promise<ModuleProgressRow[]> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT subject, module_key, stars, rounds, last_played FROM module_progress WHERE child_id = ?',
    args: [childId],
  });
  return res.rows.map((r) => ({
    subject: String(r.subject),
    moduleKey: String(r.module_key),
    stars: Number(r.stars),
    best: Number(r.stars),
    rounds: Number(r.rounds),
    lastPlayed: tsToMs(r.last_played),
  }));
}

/** 取单个 (学科, 模块) 的进度；无记录返回 null。 */
export async function getModuleProgress(
  childId: number,
  subject: string,
  moduleKey: string,
): Promise<ModuleProgressRow | null> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT stars, rounds, last_played FROM module_progress WHERE child_id = ? AND subject = ? AND module_key = ?',
    args: [childId, subject, moduleKey],
  });
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return {
    subject,
    moduleKey,
    stars: Number(r.stars),
    best: Number(r.stars),
    rounds: Number(r.rounds),
    lastPlayed: tsToMs(r.last_played),
  };
}

/**
 * 写入一轮成绩：stars 取「历史最佳 vs 本次」的较大值（保护小朋友积极性，不因一次失误掉星），
 * rounds 累加 1，last_played 刷新为当前时间。返回最新记录。
 */
export async function upsertModuleProgress(
  childId: number,
  subject: string,
  moduleKey: string,
  stars: number,
): Promise<ModuleProgressRow> {
  const db = getDb();
  const existing = await getModuleProgress(childId, subject, moduleKey);
  const newStars = Math.max(existing?.stars ?? 0, stars);
  const newRounds = (existing?.rounds ?? 0) + 1;
  await db.execute({
    sql: `INSERT INTO module_progress (child_id, subject, module_key, stars, rounds, last_played)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(child_id, subject, module_key)
          DO UPDATE SET stars = excluded.stars, rounds = excluded.rounds, last_played = CURRENT_TIMESTAMP`,
    args: [childId, subject, moduleKey, newStars, newRounds],
  });
  return { subject, moduleKey, stars: newStars, best: newStars, rounds: newRounds, lastPlayed: Date.now() };
}

/** 取某个孩子的全部小任务完成标记（key -> true）。 */
export async function getChildTasks(childId: number): Promise<Record<string, boolean>> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT task_key FROM child_tasks WHERE child_id = ? AND done = 1',
    args: [childId],
  });
  const m: Record<string, boolean> = {};
  res.rows.forEach((r) => {
    m[String(r.task_key)] = true;
  });
  return m;
}

/** 设置某小任务完成/重置。 */
export async function setChildTask(childId: number, taskKey: string, done: boolean): Promise<void> {
  const db = getDb();
  if (done) {
    await db.execute({
      sql: `INSERT INTO child_tasks (child_id, task_key, done) VALUES (?, ?, 1)
            ON CONFLICT(child_id, task_key) DO UPDATE SET done = 1, done_at = CURRENT_TIMESTAMP`,
      args: [childId, taskKey],
    });
  } else {
    await db.execute({
      sql: 'UPDATE child_tasks SET done = 0 WHERE child_id = ? AND task_key = ?',
      args: [childId, taskKey],
    });
  }
}

/** 取某个孩子的全部课本阅读进度（bookKey -> 章节 idx）。 */
export async function getTextbookProgress(childId: number): Promise<Record<string, number>> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT book_key, chapter_idx FROM textbook_progress WHERE child_id = ?',
    args: [childId],
  });
  const m: Record<string, number> = {};
  res.rows.forEach((r) => {
    m[String(r.book_key)] = Number(r.chapter_idx);
  });
  return m;
}

/** 记录某课本读到的章节 idx（每次打开章节时调用）。 */
export async function setTextbookProgress(childId: number, bookKey: string, chapterIdx: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO textbook_progress (child_id, book_key, chapter_idx) VALUES (?, ?, ?)
          ON CONFLICT(child_id, book_key) DO UPDATE SET chapter_idx = excluded.chapter_idx, updated_at = CURRENT_TIMESTAMP`,
    args: [childId, bookKey, chapterIdx],
  });
}
