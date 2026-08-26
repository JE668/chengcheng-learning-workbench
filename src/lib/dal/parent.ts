import { userRepo } from '@/lib/repos/user.repo';
import { taskRepo, redemptionRepo, wishRepo } from '@/lib/repos/task.repo';
import { castleRepo } from '@/lib/repos/castle.repo';
import { dailyPracticeRepo } from '@/lib/repos/learning.repo';
import { exportLearningDataCSV } from '@/lib/dal/child';
import { getKysely } from '@/lib/db/kysely';
import { dateStr } from '@/lib/date';

export async function getParentDashboardData(parentId: number) {
  const parent = await userRepo.findById(parentId);
  const children = await userRepo.findChildrenByParent(parentId);
  const selectedChildId = parent?.id; // 实际应从 selected_child_id 读取

  const childData = await Promise.all(
    children.map(async (child) => {
      const [points, castle, practice, streak] = await Promise.all([
        getChildPoints(child.id),
        castleRepo.getState(child.id),
        dailyPracticeRepo.getToday(child.id),
        dailyPracticeRepo.getStreak(child.id),
      ]);

      return {
        child,
        points: points ?? 0,
        castle: castle ? {
          starCoins: castle.starCoins,
          prosperity: castle.prosperity,
          streakDays: castle.streakDays,
          sunlight: castle.sunlight,
        } : null,
        practiceDone: practice?.completed ?? false,
        streak,
      };
    })
  );

  // 本周积分趋势
  const weekTrend = await getWeekPointsTrend(children.map(c => c.id));

  return {
    children: childData,
    selectedChildId: selectedChildId ? children.find(c => c.id === selectedChildId)?.id ?? children[0]?.id : children[0]?.id,
    weekTrend,
  };
}

async function getChildPoints(childId: number): Promise<number> {
  const db = getKysely();
  const result = await db
    .selectFrom('completions')
    .select(({ fn }) => fn.sum('points').as('total'))
    .where('child_id', '=', childId)
    .executeTakeFirst();
  return Number(result?.total ?? 0);
}

async function getWeekPointsTrend(childIds: number[]) {
  const db = getKysely();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  const startStr = startDate.toISOString().split('T')[0];

  const rows = await db
    .selectFrom('completions')
    .select(['child_id', 'created_at', 'points'])
    .where('child_id', 'in', childIds)
    .where('created_at', '>=', startStr)
    .execute();

  // 按天聚合
  const byDay: Record<string, Record<number, number>> = {};
  for (const row of rows) {
    const day = row.created_at.split('T')[0];
    if (!byDay[day]) byDay[day] = {};
    byDay[day][row.child_id] = (byDay[day][row.child_id] ?? 0) + row.points;
  }

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }

  return days.map(day => ({
    day,
    children: childIds.map(id => ({ childId: id, points: byDay[day]?.[id] ?? 0 })),
  }));
}

export async function getParentTasksData(parentId: number) {
  const tasks = await taskRepo.findByParent(parentId);
  return { tasks };
}

export async function createTask(
  parentId: number,
  data: { title: string; subject: string; description?: string; points: number }
) {
  return taskRepo.create({ ...data, createdBy: parentId });
}

export async function deleteTask(taskId: number, parentId: number) {
  return taskRepo.delete(taskId, parentId);
}

export async function getRedemptionsData(parentId: number) {
  const children = await userRepo.findChildrenByParent(parentId);
  const allRedemptions = await Promise.all(
    children.map(child => redemptionRepo.findByChild(child.id))
  );
  return { redemptions: allRedemptions.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) };
}

export async function approveRedemption(redemptionId: number, parentId: number, approve: boolean) {
  return redemptionRepo.approve(redemptionId, parentId, approve);
}

export async function getWishesData(parentId: number) {
  const children = await userRepo.findChildrenByParent(parentId);
  const allWishes = await Promise.all(
    children.map(child => wishRepo.findByChild(child.id))
  );
  return { wishes: allWishes.flat() };
}

export async function updateWishStatus(wishId: number, status: 'approved' | 'rejected') {
  return wishRepo.updateStatus(wishId, status);
}

export async function getSettingsData(parentId: number) {
  const children = await userRepo.findChildrenByParent(parentId);
  return { children };
}

export async function updateChildPassword(childId: number, newPasswordHash: string) {
  return userRepo.updatePassword(childId, newPasswordHash);
}

export async function updateParentPassword(parentId: number, newPasswordHash: string) {
  return userRepo.updatePassword(parentId, newPasswordHash);
}

export async function exportChildDataCSV(childId: number): Promise<string> {
  return exportLearningDataCSV(childId);
}

export async function exportAllDataJSON(parentId: number): Promise<string> {
  const db = getKysely();
  const children = await userRepo.findChildrenByParent(parentId);
  const childIds = children.map(c => c.id);

  const tables = [
    'users', 'sessions', 'tasks', 'completions', 'redemptions', 'wishes',
    'castle_state', 'moko_owned', 'daily_checkins', 'inventory', 'troublemakers',
    'mistakes', 'growth_events', 'story_progress', 'daily_practice', 'capture_tickets',
    'story_read', 'story_quiz', 'cert_requests', 'module_progress', 'child_tasks',
    'textbook_progress',
  ];

  const data: Record<string, any[]> = {};
  for (const table of tables) {
    if (['users', 'tasks', 'sessions'].includes(table)) {
      data[table] = await db.selectFrom(table as any).selectAll().execute();
    } else {
      data[table] = await db.selectFrom(table as any).selectAll().where('child_id', 'in', childIds).execute();
    }
  }

  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    parentId,
    data,
  }, null, 2);
}

export async function importAllDataJSON(parentId: number, json: string): Promise<void> {
  const { data } = JSON.parse(json);
  const db = getKysely();

  await db.transaction().execute(async (trx) => {
    // 清空现有数据（保留 users 表中的家长账号）
    const childIds = Object.values(data)
      .flat()
      .filter((r: any) => r.child_id)
      .map((r: any) => r.child_id);

    if (childIds.length > 0) {
      const tables = [
        'sessions', 'completions', 'redemptions', 'wishes',
        'castle_state', 'moko_owned', 'daily_checkins', 'inventory', 'troublemakers',
        'mistakes', 'growth_events', 'story_progress', 'daily_practice', 'capture_tickets',
        'story_read', 'story_quiz', 'cert_requests', 'module_progress', 'child_tasks',
        'textbook_progress',
      ];

      for (const table of tables) {
        await trx.deleteFrom(table as any).where('child_id', 'in', childIds).execute();
      }
      await trx.deleteFrom('tasks').where('created_by', 'in', childIds).execute();
      await trx.deleteFrom('users').where('id', 'in', childIds).execute();
    }

    // 导入新数据（按依赖顺序）
    const importOrder = [
      'users', 'tasks', 'sessions', 'completions', 'redemptions', 'wishes',
      'castle_state', 'moko_owned', 'daily_checkins', 'inventory', 'troublemakers',
      'mistakes', 'growth_events', 'story_progress', 'daily_practice', 'capture_tickets',
      'story_read', 'story_quiz', 'cert_requests', 'module_progress', 'child_tasks',
      'textbook_progress',
    ];

    for (const table of importOrder) {
      if (data[table]?.length) {
        for (const row of data[table]) {
          await trx.insertInto(table as any).values(row).execute();
        }
      }
    }
  });
}