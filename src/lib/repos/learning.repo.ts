import { getKysely, withTransaction } from '@/lib/db/kysely';
import { DB } from '@/lib/db/schema';
import { dateStr } from '@/lib/date';

type DailyPracticeRow = DB['daily_practice'];
type CaptureTicketRow = DB['capture_tickets'];
type ModuleProgressRow = DB['module_progress'];
type ChildTaskRow = DB['child_tasks'];
type TextbookProgressRow = DB['textbook_progress'];
type MistakeRow = DB['mistakes'];
type StoryProgressRow = DB['story_progress'];
type StoryReadRow = DB['story_read'];
type StoryQuizRow = DB['story_quiz'];

export interface DailyPracticeData {
  childId: number;
  day: string;
  completed: boolean;
  correct: number;
  total: number;
  questions: string | null;
  completedAt: string | null;
  streakRewarded: boolean;
  practiceStreak: number;
  nextMilestone: number;
}

export interface ModuleProgress {
  id: number;
  childId: number;
  subject: string;
  moduleKey: string;
  stars: number;
  rounds: number;
  lastPlayed: number;
}

export interface MistakeData {
  id: number;
  childId: number;
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string | null;
  createdAt: string;
  nextReview: string;
  intervalDays: number;
  reps: number;
  easinessFactor: number;
  resolved: number;
  sourceModule: string | null;
  chapter: string | null;
}

export class DailyPracticeRepository {
  private db = getKysely();

  /** 获取今日练习 */
  async getToday(childId: number): Promise<DailyPracticeData | null> {
    const today = dateStr();
    const row = await this.db
      .selectFrom('daily_practice')
      .selectAll()
      .where('child_id', '=', childId)
      .where('day', '=', today)
      .executeTakeFirst();

    if (!row) {
      return {
        childId,
        day: today,
        completed: false,
        correct: 0,
        total: 0,
        questions: null,
        completedAt: null,
        streakRewarded: false,
        practiceStreak: await this.getStreak(childId),
        nextMilestone: await this.getNextMilestone(childId),
      };
    }

    return {
      childId: row.child_id,
      day: row.day,
      completed: row.completed === 1,
      correct: row.correct,
      total: row.total,
      questions: row.questions,
      completedAt: row.completed_at,
      streakRewarded: row.streak_rewarded === 1,
      practiceStreak: await this.getStreak(childId),
      nextMilestone: await this.getNextMilestone(childId),
    };
  }

  /** 保存练习结果 */
  async saveResult(
    childId: number,
    day: string,
    correct: number,
    total: number,
    questions: string,
    completed: boolean
  ): Promise<void> {
    await this.db
      .insertInto('daily_practice')
      .values({
        child_id: childId,
        day,
        completed: completed ? 1 : 0,
        correct,
        total,
        questions,
        completed_at: completed ? new Date().toISOString() : null,
        streak_rewarded: 0,
      })
      .onConflict((oc) => oc.columns(['child_id', 'day']).doUpdateSet({
        completed: completed ? 1 : 0,
        correct,
        total,
        questions,
        completed_at: completed ? new Date().toISOString() : null,
      }))
      .execute();
  }

  /** 获取连续天数 */
  async getStreak(childId: number): Promise<number> {
    const rows = await this.db
      .selectFrom('daily_practice')
      .select('day')
      .where('child_id', '=', childId)
      .where('completed', '=', 1)
      .orderBy('day', 'desc')
      .execute();

    if (rows.length === 0) return 0;

    let streak = 0;
    let expectedDay = dateStr();

    for (const row of rows) {
      if (row.day === expectedDay) {
        streak++;
        const d = new Date(expectedDay);
        d.setDate(d.getDate() - 1);
        expectedDay = d.toISOString().split('T')[0];
      } else if (row.day < expectedDay) {
        break;
      }
    }
    return streak;
  }

  /** 获取下一个里程碑天数 */
  async getNextMilestone(childId: number): Promise<number> {
    const milestones = [7, 14, 21, 30, 60, 100, 200, 365];
    const streak = await this.getStreak(childId);
    return milestones.find(m => m > streak) ?? 365;
  }

  /** 标记连续奖励已发放 */
  async markStreakRewarded(childId: number, day: string): Promise<void> {
    await this.db
      .updateTable('daily_practice')
      .set({ streak_rewarded: 1 })
      .where('child_id', '=', childId)
      .where('day', '=', day)
      .execute();
  }

  /** 获取历史练习记录 */
  async getHistory(childId: number, limit = 30): Promise<DailyPracticeData[]> {
    const rows = await this.db
      .selectFrom('daily_practice')
      .selectAll()
      .where('child_id', '=', childId)
      .orderBy('day', 'desc')
      .limit(limit)
      .execute();

    return rows.map(r => ({
      childId: r.child_id,
      day: r.day,
      completed: r.completed === 1,
      correct: r.correct,
      total: r.total,
      questions: r.questions,
      completedAt: r.completed_at,
      streakRewarded: r.streak_rewarded === 1,
      practiceStreak: 0,
      nextMilestone: 0,
    }));
  }
}

export class CaptureTicketRepository {
  private db = getKysely();

  /** 获取捕捉券 */
  async get(childId: number): Promise<{ total: number; used: number }> {
    const row = await this.db
      .selectFrom('capture_tickets')
      .selectAll()
      .where('child_id', '=', childId)
      .executeTakeFirst();

    if (!row) {
      await this.ensure(childId);
      return { total: 0, used: 0 };
    }
    return { total: row.total, used: row.used };
  }

  /** 确保记录存在 */
  async ensure(childId: number): Promise<void> {
    await this.db
      .insertInto('capture_tickets')
      .values({ child_id: childId, total: 0, used: 0 })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** 增加捕捉券 */
  async add(childId: number, count: number): Promise<void> {
    await this.ensure(childId);
    await this.db
      .updateTable('capture_tickets')
      .set({ total: (eb) => eb('total', '+', count) })
      .where('child_id', '=', childId)
      .execute();
  }

  /** 使用捕捉券 */
  async use(childId: number, count: number = 1): Promise<boolean> {
    const ticket = await this.get(childId);
    if (ticket.total - ticket.used < count) return false;

    await this.db
      .updateTable('capture_tickets')
      .set({ used: ticket.used + count })
      .where('child_id', '=', childId)
      .execute();
    return true;
  }
}

export class ModuleProgressRepository {
  private db = getKysely();

  /** 获取所有模块进度 */
  async getAll(childId: number): Promise<ModuleProgress[]> {
    const rows = await this.db
      .selectFrom('module_progress')
      .selectAll()
      .where('child_id', '=', childId)
      .execute();

    return rows.map(r => ({
      id: r.id,
      childId: r.child_id,
      subject: r.subject,
      moduleKey: r.module_key,
      stars: r.stars,
      rounds: r.rounds,
      lastPlayed: new Date(r.last_played).getTime(),
    }));
  }

  /** 更新模块进度 */
  async updateProgress(
    childId: number,
    subject: string,
    moduleKey: string,
    stars: number,
    rounds: number
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .insertInto('module_progress')
      .values({
        child_id: childId,
        subject,
        module_key: moduleKey,
        stars,
        rounds,
        last_played: now,
      })
      .onConflict((oc) => oc.columns(['child_id', 'subject', 'module_key']).doUpdateSet({
        stars: (eb) => eb('stars', '+', stars),
        rounds: (eb) => eb('rounds', '+', rounds),
        last_played: now,
      }))
      .execute();
  }

  /** 设置模块最佳星数 */
  async setBestStars(childId: number, subject: string, moduleKey: string, stars: number): Promise<void> {
    await this.db
      .insertInto('module_progress')
      .values({
        child_id: childId,
        subject,
        module_key: moduleKey,
        stars,
        rounds: 1,
        last_played: new Date().toISOString(),
      })
      .onConflict((oc) => oc.columns(['child_id', 'subject', 'module_key']).doUpdateSet({
        stars: (eb) => eb.if(eb('stars', '>', stars), eb('stars'), stars),
        rounds: (eb) => eb('rounds', '+', 1),
        last_played: new Date().toISOString(),
      }))
      .execute();
  }
}

export class ChildTaskRepository {
  private db = getKysely();

  /** 获取已完成任务 */
  async getDone(childId: number): Promise<string[]> {
    const rows = await this.db
      .selectFrom('child_tasks')
      .select('task_key')
      .where('child_id', '=', childId)
      .where('done', '=', 1)
      .execute();
    return rows.map(r => r.task_key);
  }

  /** 标记任务完成 */
  async markDone(childId: number, taskKey: string): Promise<void> {
    await this.db
      .insertInto('child_tasks')
      .values({
        child_id: childId,
        task_key: taskKey,
        done: 1,
        done_at: new Date().toISOString(),
      })
      .onConflict((oc) => oc.columns(['child_id', 'task_key']).doUpdateSet({
        done: 1,
        done_at: new Date().toISOString(),
      }))
      .execute();
  }
}

export class TextbookProgressRepository {
  private db = getKysely();

  async getProgress(childId: number, bookKey: string): Promise<number> {
    const row = await this.db
      .selectFrom('textbook_progress')
      .select('chapter_idx')
      .where('child_id', '=', childId)
      .where('book_key', '=', bookKey)
      .executeTakeFirst();
    return row?.chapter_idx ?? 0;
  }

  async setProgress(childId: number, bookKey: string, chapterIdx: number): Promise<void> {
    await this.db
      .insertInto('textbook_progress')
      .values({
        child_id: childId,
        book_key: bookKey,
        chapter_idx: chapterIdx,
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc) => oc.columns(['child_id', 'book_key']).doUpdateSet({
        chapter_idx: chapterIdx,
        updated_at: new Date().toISOString(),
      }))
      .execute();
  }
}

export class MistakeRepository {
  private db = getKysely();

  /** 添加错题 */
  async add(mistake: Omit<MistakeData, 'id'>): Promise<number> {
    const row = await this.db
      .insertInto('mistakes')
      .values({
        child_id: mistake.childId,
        subject: mistake.subject,
        kind: mistake.kind,
        prompt: mistake.prompt,
        answer: mistake.answer,
        wrong: mistake.wrong,
        created_at: mistake.createdAt,
        next_review: mistake.nextReview,
        interval_days: mistake.intervalDays,
        reps: mistake.reps,
        easiness_factor: mistake.easinessFactor,
        resolved: mistake.resolved,
        source_module: mistake.sourceModule,
        chapter: mistake.chapter,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return Number(row.id);
  }

  /** 获取待复习错题 */
  async getDue(childId: number, limit = 20): Promise<MistakeData[]> {
    const now = new Date().toISOString();
    const rows = await this.db
      .selectFrom('mistakes')
      .selectAll()
      .where('child_id', '=', childId)
      .where('resolved', '=', 0)
      .where('next_review', '<=', now)
      .orderBy('next_review', 'asc')
      .limit(limit)
      .execute();
    return rows.map(this.toMistake);
  }

  /** 复习错题 */
  async review(id: number, correct: boolean): Promise<void> {
    const mistake = await this.db
      .selectFrom('mistakes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (correct) {
      const newInterval = Math.round(mistake.interval_days * mistake.easiness_factor);
      const newEasiness = Math.max(1.3, mistake.easiness_factor + 0.1);
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      await this.db
        .updateTable('mistakes')
        .set({
          interval_days: newInterval,
          reps: mistake.reps + 1,
          easiness_factor: newEasiness,
          next_review: nextReview.toISOString(),
          resolved: newInterval > 30 ? 1 : 0, // 超过30天视为掌握
        })
        .where('id', '=', id)
        .execute();
    } else {
      // 答错重置
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1);

      await this.db
        .updateTable('mistakes')
        .set({
          interval_days: 1,
          reps: 0,
          easiness_factor: Math.max(1.3, mistake.easiness_factor - 0.2),
          next_review: nextReview.toISOString(),
        })
        .where('id', '=', id)
        .execute();
    }
  }

  private toMistake(row: MistakeRow): MistakeData {
    return {
      id: row.id,
      childId: row.child_id,
      subject: row.subject,
      kind: row.kind,
      prompt: row.prompt,
      answer: row.answer,
      wrong: row.wrong,
      createdAt: row.created_at,
      nextReview: row.next_review,
      intervalDays: row.interval_days,
      reps: row.reps,
      easinessFactor: row.easiness_factor,
      resolved: row.resolved,
      sourceModule: row.source_module,
      chapter: row.chapter,
    };
  }
}

export class StoryRepository {
  private db = getKysely();

  /** 获取故事进度 */
  async getProgress(childId: number): Promise<string[]> {
    const rows = await this.db
      .selectFrom('story_progress')
      .select('chapter_id')
      .where('child_id', '=', childId)
      .execute();
    return rows.map(r => r.chapter_id);
  }

  /** 捕捉萌可（完成章节） */
  async capture(childId: number, chapterId: string): Promise<void> {
    await withTransaction(async (trx) => {
      await trx
        .insertInto('story_progress')
        .values({ child_id: childId, chapter_id: chapterId })
        .onConflict((oc) => oc.doNothing())
        .execute();

      await trx
        .insertInto('story_read')
        .values({ child_id: childId, chapter_id: chapterId })
        .onConflict((oc) => oc.doNothing())
        .execute();

      await trx
        .insertInto('story_quiz')
        .values({ child_id: childId, chapter_id: chapterId })
        .onConflict((oc) => oc.doNothing())
        .execute();
    });
  }

  /** 标记已读 */
  async markRead(childId: number, chapterId: string): Promise<void> {
    await this.db
      .insertInto('story_read')
      .values({ child_id: childId, chapter_id: chapterId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** 标记答对 */
  async markQuizPassed(childId: number, chapterId: string): Promise<void> {
    await this.db
      .insertInto('story_quiz')
      .values({ child_id: childId, chapter_id: chapterId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** 检查是否已读 */
  async isRead(childId: number, chapterId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('story_read')
      .select('id')
      .where('child_id', '=', childId)
      .where('chapter_id', '=', chapterId)
      .executeTakeFirst();
    return !!row;
  }

  /** 检查是否已答对 */
  async isQuizPassed(childId: number, chapterId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('story_quiz')
      .select('id')
      .where('child_id', '=', childId)
      .where('chapter_id', '=', chapterId)
      .executeTakeFirst();
    return !!row;
  }
}

export const dailyPracticeRepo = new DailyPracticeRepository();
export const captureTicketRepo = new CaptureTicketRepository();
export const moduleProgressRepo = new ModuleProgressRepository();
export const childTaskRepo = new ChildTaskRepository();
export const textbookProgressRepo = new TextbookProgressRepository();
export const mistakeRepo = new MistakeRepository();
export const storyRepo = new StoryRepository();