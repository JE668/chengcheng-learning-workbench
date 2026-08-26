import { getKysely, withTransaction } from '@/lib/db/kysely';
import { DB } from '@/lib/db/schema';
import { dateStr, LOCAL_DAY_COL } from '@/lib/date';

type TaskRow = DB['tasks'];
type CompletionRow = DB['completions'];
type RedemptionRow = DB['redemptions'];
type WishRow = DB['wishes'];

export interface Task {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  points: number;
  createdBy: number;
  createdAt: string;
  completed?: boolean;
}

export interface TaskWithCompletion extends Task {
  completed: boolean;
  completionId?: number;
}

export class TaskRepository {
  private db = getKysely();

  /** 创建任务 */
  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const row = await this.db
      .insertInto('tasks')
      .values({
        title: task.title,
        subject: task.subject,
        description: task.description,
        points: task.points,
        created_by: task.createdBy,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.toTask(row);
  }

  /** 获取家长创建的所有任务 */
  async findByParent(parentId: number): Promise<Task[]> {
    const rows = await this.db
      .selectFrom('tasks')
      .selectAll()
      .where('created_by', '=', parentId)
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map(this.toTask);
  }

  /** 获取孩子的待完成任务 */
  async findPendingByChild(childId: number): Promise<TaskWithCompletion[]> {
    const rows = await this.db
      .selectFrom('tasks')
      .leftJoin('completions', (join) =>
        join
          .onRef('completions.task_id', '=', 'tasks.id')
          .on('completions.child_id', '=', childId)
      )
      .select([
        'tasks.id',
        'tasks.title',
        'tasks.subject',
        'tasks.description',
        'tasks.points',
        'tasks.created_by',
        'tasks.created_at',
        'completions.id as completion_id',
      ])
      .where('completions.id', 'is', null)
      .orderBy('tasks.created_at', 'desc')
      .execute();

    return rows.map(r => ({
      ...this.toTask(r),
      completed: false,
      completionId: r.completion_id ?? undefined,
    }));
  }

  /** 完成任务 */
  async complete(childId: number, taskId: number, points: number, source?: string): Promise<void> {
    await withTransaction(async (trx) => {
      await trx
        .insertInto('completions')
        .values({
          task_id: taskId,
          child_id: childId,
          points,
          source: source ?? 'task',
        })
        .execute();

      // 记录成长事件
      const task = await trx
        .selectFrom('tasks')
        .select(['title'])
        .where('id', '=', taskId)
        .executeTakeFirst();

      if (task) {
        await trx
          .insertInto('growth_events')
          .values({
            child_id: childId,
            day: dateStr(),
            type: 'task',
            emoji: '✅',
            title: '完成任务',
            desc: `完成「${task.title}」，获得 ${points} 积分`,
          })
          .execute();
      }
    });
  }

  /** 删除任务 */
  async delete(taskId: number, parentId: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom('tasks')
      .where('id', '=', taskId)
      .where('created_by', '=', parentId)
      .execute();
    return (result.numAffectedRows ?? 0n) > 0n;
  }

  private toTask(row: TaskRow & { completion_id?: number }): Task {
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      description: row.description,
      points: row.points,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }
}

export class RedemptionRepository {
  private db = getKysely();

  /** 申请兑换 */
  async request(childId: number, rewardName: string, cost: number): Promise<RedemptionRow> {
    return this.db
      .insertInto('redemptions')
      .values({
        child_id: childId,
        reward_name: rewardName,
        cost,
        status: 'pending',
        created_by: childId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /** 获取孩子的兑换记录 */
  async findByChild(childId: number): Promise<RedemptionRow[]> {
    return this.db
      .selectFrom('redemptions')
      .selectAll()
      .where('child_id', '=', childId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /** 家长审批 */
  async approve(id: number, parentId: number, approve: boolean): Promise<void> {
    await withTransaction(async (trx) => {
      const redemption = await trx
        .selectFrom('redemptions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow();

      if (redemption.status !== 'pending') {
        throw new Error('已经处理过');
      }

      if (approve) {
        await trx
          .updateTable('redemptions')
          .set({ status: 'approved' })
          .where('id', '=', id)
          .execute();
      } else {
        await trx
          .updateTable('redemptions')
          .set({ status: 'rejected' })
          .where('id', '=', id)
          .execute();
        // 拒绝时退还星星币（通过 castleRepo）
      }
    });
  }
}

export class WishRepository {
  private db = getKysely();

  /** 许愿 */
  async create(childId: number, text: string): Promise<WishRow> {
    return this.db
      .insertInto('wishes')
      .values({ child_id: childId, text, status: 'pending' })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /** 获取愿望列表 */
  async findByChild(childId: number): Promise<WishRow[]> {
    return this.db
      .selectFrom('wishes')
      .selectAll()
      .where('child_id', '=', childId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /** 审批愿望 */
  async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<void> {
    await this.db
      .updateTable('wishes')
      .set({ status })
      .where('id', '=', id)
      .execute();
  }
}

export const taskRepo = new TaskRepository();
export const redemptionRepo = new RedemptionRepository();
export const wishRepo = new WishRepository();