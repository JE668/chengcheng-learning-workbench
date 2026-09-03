import { castleRepo } from '@/lib/repos/castle.repo';
import { userRepo } from '@/lib/repos/user.repo';
import { dailyPracticeRepo, captureTicketRepo, moduleProgressRepo, childTaskRepo, storyRepo, mistakeRepo } from '@/lib/repos/learning.repo';
import { taskRepo, redemptionRepo, wishRepo } from '@/lib/repos/task.repo';
import { dateStr } from '@/lib/date';
import { getKysely } from '@/lib/db/kysely';
import { getSelectedChildId } from '@/lib/users';

/**
 * Data Access Layer - 供 Server Components 直接调用
 * 封装多个 Repository 的组合查询，不包含业务逻辑
 */

// ==================== 孩子端 DAL ====================

export async function getChildDashboardData(childId: number) {
  const [points, castle, practice, tasks, modules, todayCheckins, captureTickets] = await Promise.all([
    getChildPoints(childId),
    castleRepo.getState(childId),
    dailyPracticeRepo.getToday(childId),
    taskRepo.findPendingByChild(childId),
    moduleProgressRepo.getAll(childId),
    castleRepo.getTodayCheckins(childId, dateStr()),
    captureTicketRepo.get(childId),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayModules = modules.filter(p => p.lastPlayed >= todayStart.getTime());
  const todayStars = todayModules.reduce((sum, p) => sum + p.stars, 0);

  const checkedSubjects = new Set(todayCheckins.map(c => c.subject));

  const ownedMokos = await castleRepo.getOwnedMokos(childId);
  const carouselItems = ownedMokos.map(m => ({ mokoKey: m.mokoKey }));

  return {
    points,
    castle: castle ? { ...castle, gallery: carouselItems } : null,
    practice,
    pendingTasks: tasks,
    modules: todayModules,
    todayStars,
    checkedSubjects,
    captureTickets,
    ownedCount: ownedMokos.length,
  };
}

export async function getChildPoints(childId: number): Promise<number> {
  const db = getKysely();
  const result = await db
    .selectFrom('completions')
    .select(({ fn }) => fn.sum('points').as('total'))
    .where('child_id', '=', childId)
    .executeTakeFirst();
  return Number(result?.total ?? 0);
}

export async function getCastleFullData(childId: number) {
  const [state, owned, troublemakers, inventory, growthEvents, harvestable] = await Promise.all([
    castleRepo.ensureState(childId),
    castleRepo.getOwnedMokos(childId),
    castleRepo.getTroublemakers(childId),
    castleRepo.getInventory(childId),
    castleRepo.getGrowthEvents(childId),
    getHarvestableInfo(childId),
  ]);

  // 构建图鉴数据
  const gallery = await buildGallery(owned);

  return {
    ...state,
    gallery,
    residents: owned.filter(m => m.status === 'resident').map(m => ({
      key: m.mokoKey,
      img: `/moko/${m.mokoKey}.png`,
      emoji: getMokoEmoji(m.mokoKey),
      name: getMokoName(m.mokoKey),
    })),
    troublemakers,
    inventory,
    growthEvents,
    harvestableStars: harvestable.stars,
    friendTotal: harvestable.friendTotal,
    friendHarvestedToday: harvestable.lastHarvestDay === dateStr(),
    checkins: await getTodayCheckinsWithSubjects(childId),
  };
}

async function getHarvestableInfo(childId: number) {
  const state = await castleRepo.getState(childId);
  if (!state) return { stars: 0, friendTotal: 0, lastHarvestDay: '' };

  const owned = await castleRepo.getOwnedMokos(childId);
  const friends = owned.filter(m => m.status === 'resident').length;
  const stars = friends * 5;

  return {
    stars,
    friendTotal: friends,
    lastHarvestDay: state.lastSettledDay ?? '',
  };
}

async function getTodayCheckinsWithSubjects(childId: number) {
  const today = dateStr();
  const checkins = await castleRepo.getTodayCheckins(childId, today);
  const subjects = ['语文', '数学', '英语'];

  return subjects.map(subject => {
    const ci = checkins.find(c => c.subject === subject);
    return {
      subject,
      status: ci?.status ?? 'pending',
      childDoneAt: ci?.child_done_at ?? null,
      confirmedAt: ci?.confirmed_at ?? null,
    };
  });
}

async function buildGallery(owned: Awaited<ReturnType<typeof castleRepo.getOwnedMokos>>) {
  // 这里应该从 moko.ts 读取完整图鉴，简化返回
  return owned.map(m => ({
    key: m.mokoKey,
    name: getMokoName(m.mokoKey),
    img: `/moko/${m.mokoKey}.png`,
    owned: true,
    subject: m.subject,
  }));
}

function getMokoName(key: string): string {
  const names: Record<string, string> = {
    'col_01_爱心萌可_render': '爱心萌可',
    'col_01_正正萌可_render': '正正萌可',
    'col_01_唱唱萌可_render': '唱唱萌可',
    // ... 更多映射
  };
  return names[key] ?? key;
}

function getMokoEmoji(key: string): string {
  const emojis: Record<string, string> = {
    'col_01_爱心萌可_render': '💗',
    'col_01_正正萌可_render': '🦁',
    'col_01_唱唱萌可_render': '🎤',
  };
  return emojis[key] ?? '🧸';
}

// ==================== 学习模块 DAL ====================

export async function getStudyModulesData(childId: number) {
  const [progress, doneTasks, mistakes] = await Promise.all([
    moduleProgressRepo.getAll(childId),
    childTaskRepo.getDone(childId),
    mistakeRepo.getDue(childId, 10),
  ]);

  return {
    progress,
    doneTaskKeys: new Set(doneTasks),
    dueMistakes: mistakes,
  };
}

export async function getDailyPracticeFullData(childId: number) {
  const [practice, tickets, streak] = await Promise.all([
    dailyPracticeRepo.getToday(childId),
    captureTicketRepo.get(childId),
    dailyPracticeRepo.getStreak(childId),
  ]);

  // 获取各科打卡状态
  const checkins = await castleRepo.getTodayCheckins(childId, dateStr());
  const subjectStatus = {
    语文: checkins.find(c => c.subject === '语文')?.status ?? 'pending',
    数学: checkins.find(c => c.subject === '数学')?.status ?? 'pending',
    英语: checkins.find(c => c.subject === '英语')?.status ?? 'pending',
  };

  return {
    practice,
    tickets,
    streak,
    subjectStatus,
  };
}

export async function getStoryFullData(childId: number) {
  const [progress, readChapters, quizPassed] = await Promise.all([
    storyRepo.getProgress(childId),
    getAllReadChapters(childId),
    getAllQuizPassed(childId),
  ]);

  return {
    capturedChapters: new Set(progress),
    readChapters: new Set(readChapters),
    quizPassedChapters: new Set(quizPassed),
  };
}

async function getAllReadChapters(childId: number) {
  const db = getKysely();
  const rows = await db
    .selectFrom('story_read')
    .select('chapter_id')
    .where('child_id', '=', childId)
    .execute();
  return rows.map(r => r.chapter_id);
}

async function getAllQuizPassed(childId: number) {
  const db = getKysely();
  const rows = await db
    .selectFrom('story_quiz')
    .select('chapter_id')
    .where('child_id', '=', childId)
    .execute();
  return rows.map(r => r.chapter_id);
}

// ==================== 家长端 DAL ====================

export async function getParentDashboardData(parentId: number) {
  const children = await userRepo.findChildrenByParent(parentId);
  // 选中孩子：读取 users.selected_child_id（含回退到第一个孩子），而非家长自己的 id。
  const selectedChildId = await getSelectedChildId(parentId);
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
        } : null,
        practiceDone: practice?.completed ?? false,
        streak,
      };
    })
  );

  return { children: childData, selectedChildId };
}

export async function getParentTasksData(parentId: number) {
  const tasks = await taskRepo.findByParent(parentId);
  return { tasks };
}

export async function getRedemptionsData(parentId: number) {
  const children = await userRepo.findChildrenByParent(parentId);
  const allRedemptions = await Promise.all(
    children.map(child => redemptionRepo.findByChild(child.id))
  );
  return { redemptions: allRedemptions.flat() };
}

// ==================== 统计/导出 DAL ====================

export async function getLearningStats(childId: number, days = 30) {
  const db = getKysely();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];

  const [checkins, completions, practices, mistakes] = await Promise.all([
    db.selectFrom('daily_checkins')
      .select(['day', 'subject', 'status'])
      .where('child_id', '=', childId)
      .where('day', '>=', startStr)
      .execute(),

    db.selectFrom('completions')
      .select(['created_at', 'points', 'source'])
      .where('child_id', '=', childId)
      .where('created_at', '>=', startStr)
      .execute(),

    db.selectFrom('daily_practice')
      .select(['day', 'correct', 'total', 'completed'])
      .where('child_id', '=', childId)
      .where('day', '>=', startStr)
      .execute(),

    db.selectFrom('mistakes')
      .select(['subject', 'kind', 'created_at', 'resolved'])
      .where('child_id', '=', childId)
      .where('created_at', '>=', startStr)
      .execute(),
  ]);

  return { checkins, completions, practices, mistakes };
}

export async function exportLearningDataCSV(childId: number): Promise<string> {
  const stats = await getLearningStats(childId, 365);
  const headers = ['日期', '类型', '科目', '详情', '积分', '状态'];
  const rows: string[][] = [headers];

  // 打卡记录
  for (const c of stats.checkins) {
    rows.push([c.day, '打卡', c.subject, '', '', c.status]);
  }

  // 完成任务/练习
  for (const c of stats.completions) {
    const date = c.created_at.split('T')[0];
    rows.push([date, '完成', c.source ?? '', '', String(c.points), '完成']);
  }

  // 每日一练
  for (const p of stats.practices) {
    rows.push([p.day, '每日一练', '综合', `${p.correct}/${p.total}`, '', p.completed ? '完成' : '未完成']);
  }

  // 错题
  for (const m of stats.mistakes) {
    rows.push([m.created_at.split('T')[0], '错题', m.subject, m.kind, '', m.resolved ? '已掌握' : '待复习']);
  }

  return rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
}