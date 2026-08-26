/**
 * SM-2 Algorithm Implementation for Spaced Repetition
 * 
 * SM-2 is the classic spaced repetition algorithm used by Anki, SuperMemo, etc.
 * 
 * Key concepts:
 * - easiness factor (EF): starts at 2.5, adjusted based on quality of recall
 * - interval: days until next review
 * - repetitions: number of successful recalls in a row
 * - quality: 0-5 rating of recall quality (0=complete blackout, 5=perfect recall)
 * 
 * Quality grades:
 * 0 - Complete blackout (no recall)
 * 1 - Incorrect response, but remembered after seeing answer
 * 2 - Incorrect response, but felt familiar
 * 3 - Correct with difficulty
 * 4 - Correct with slight hesitation
 * 5 - Perfect response
 */

export interface SM2State {
  /** Easiness factor, minimum 1.3, starts at 2.5 */
  easinessFactor: number;
  /** Number of consecutive successful recalls */
  repetitions: number;
  /** Days until next review */
  interval: number;
  /** Next review date (YYYY-MM-DD) */
  nextReview: string;
  /** Whether the card is mature (graduated) */
  isMature: boolean;
}

/** Quality rating from 0-5 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/** Default SM-2 initial state */
export const INITIAL_SM2_STATE: SM2State = {
  easinessFactor: 2.5,
  repetitions: 0,
  interval: 0,
  nextReview: '',
  isMature: false,
};

/**
 * Calculate next review state using SM-2 algorithm
 * 
 * @param state Current SM-2 state
 * @param quality Quality of recall (0-5)
 * @param today Today's date in YYYY-MM-DD format
 * @returns Updated SM-2 state
 */
export function calculateSM2Next(
  state: SM2State,
  quality: SM2Quality,
  today: string
): SM2State {
  let { easinessFactor, repetitions, interval } = state;
  let nextReview: string;

  if (quality < 3) {
    // Failed recall - reset repetitions, short interval
    return {
      easinessFactor: Math.max(1.3, easinessFactor - 0.2),
      repetitions: 0,
      interval: 1,
      nextReview: addDays(new Date(), 1).toISOString().split('T')[0],
      isMature: false,
    };
  }

  // Successful recall
  const newRepetitions = state.repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(state.interval * state.easinessFactor);
  }

  // Cap interval at 365 days
  const cappedInterval = Math.min(newInterval, 365);

  // Adjust easiness factor based on quality
  // EF' = EF + (0.1 - (5-quality)*(0.08 + (5-quality)*0.02))
  const q = quality;
  const newEasinessFactor = Math.max(1.3, easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // Next review date
  const nextReviewDate = addDays(new Date(), newInterval);

  return {
    easinessFactor: newEasinessFactor,
    repetitions: newRepetitions,
    interval: Math.round(state.interval === 0 ? 1 : newInterval), // First interval is 1 day
    nextReview: nextReviewDate.toISOString().split('T')[0],
    isMature: newRepetitions >= 4,
  };
}

/**
 * Convert a simple 0-1 correct/incorrect to SM-2 quality
 * - correct: true -> quality 4 (correct with slight hesitation)
 * - correct: false -> quality 1 (incorrect but remembered after seeing answer)
 */
export function binaryToQuality(correct: boolean): 1 | 4 {
  return correct ? 4 : 1;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return formatDate(new Date());
}

/**
 * Add days to a date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  return formatDate(addDays(date, days));
}

// ============================================================
// 增强功能：遗忘曲线、进度追踪、智能推荐
// ============================================================

/** 遗忘曲线数据点 */
export interface ForgettingCurvePoint {
  day: number;           // 第 N 天
  retention: number;     // 记忆保持率 0-1
  isReviewDay: boolean;  // 是否为复习日
}

/** 复习进度统计 */
export interface ReviewProgress {
  totalCards: number;
  dueToday: number;
  dueThisWeek: number;
  matureCards: number;
  learningCards: number;
  averageEasiness: number;
  averageInterval: number;
  streakDays: number;
  longestStreak: number;
}

/** 单张卡片的复习历史 */
export interface CardReviewHistory {
  cardId: string;
  reviews: ReviewRecord[];
  createdAt: string;
  firstReviewAt: string | null;
  lastReviewAt: string | null;
}

/** 单次复习记录 */
export interface ReviewRecord {
  date: string;        // YYYY-MM-DD
  quality: SM2Quality;
  interval: number;
  easinessFactor: number;
  wasMature: boolean;
}

/** 智能复习建议 */
export interface SmartReviewSuggestion {
  recommendedTime: string;      // 推荐复习时间 HH:MM
  reason: string;               // 推荐理由
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;    // 预计耗时(分钟)
}

/**
 * 计算遗忘曲线数据点
 * 基于 Ebbinghaus 遗忘曲线公式：R = e^(-t/S)
 * 其中 R 是记忆保持率，t 是时间，S 是记忆强度
 */
export function calculateForgettingCurve(
  state: SM2State,
  days: number = 30
): ForgettingCurvePoint[] {
  const points: ForgettingCurvePoint[] = [];
  const todayDate = new Date(today());
  const nextReviewDate = new Date(state.nextReview + 'T00:00:00');
  
  // 记忆强度 S 与 easiness factor 和 interval 相关
  const S = Math.max(state.easinessFactor * state.interval, 1);
  
  for (let day = 0; day <= days; day++) {
    const currentDate = new Date(todayDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // 计算记忆保持率
    const retention = Math.exp(-day / S);
    
    // 检查是否为复习日
    const isReviewDay = currentDate >= nextReviewDate && 
      formatDate(currentDate) === state.nextReview;
    
    points.push({
      day,
      retention: Math.max(0, Math.min(1, retention)),
      isReviewDay,
    });
  }
  
  return points;
}

/**
 * 计算复习进度统计
 */
export function calculateReviewProgress(
  cards: { state: SM2State }[],
  reviewHistory: Map<string, ReviewRecord[]>
): ReviewProgress {
  const todayStr = today();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const weekLater = new Date(todayDate);
  weekLater.setDate(weekLater.getDate() + 7);
  
  let totalCards = cards.length;
  let dueToday = 0;
  let dueThisWeek = 0;
  let matureCards = 0;
  let learningCards = 0;
  let totalEasiness = 0;
  let totalInterval = 0;
  let streakDays = 0;
  let longestStreak = 0;
  
  for (const card of cards) {
    const { state } = card;
    
    if (state.isMature) matureCards++;
    else learningCards++;
    
    totalEasiness += state.easinessFactor;
    totalInterval += state.interval;
    
    const nextReviewDate = new Date(state.nextReview + 'T00:00:00');
    if (nextReviewDate <= todayDate) {
      dueToday++;
    }
    if (nextReviewDate <= weekLater) {
      dueThisWeek++;
    }
  }
  
  // 计算连续复习天数
  const allReviewDates = new Set<string>();
  for (const [, history] of reviewHistory) {
    for (const record of history) {
      allReviewDates.add(record.date);
    }
  }
  
  // 从今天往前计算连续天数
  let currentStreak = 0;
  let maxStreak = 0;
  let checkDate = new Date(todayDate);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(checkDate);
    if (allReviewDates.has(dateStr)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (currentStreak > 0) {
      // 中断了
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  streakDays = currentStreak;
  longestStreak = maxStreak;
  
  return {
    totalCards,
    dueToday,
    dueThisWeek,
    matureCards,
    learningCards,
    averageEasiness: totalCards > 0 ? totalEasiness / totalCards : 2.5,
    averageInterval: totalCards > 0 ? totalInterval / totalCards : 0,
    streakDays,
    longestStreak,
  };
}

/**
 * 获取智能复习建议
 */
export function getSmartReviewSuggestion(
  progress: ReviewProgress,
  userPreferences: {
    preferredTime?: string;    // HH:MM
    maxSessionMinutes?: number;
    dailyGoal?: number;
  } = {}
): SmartReviewSuggestion[] {
  const suggestions: SmartReviewSuggestion[] = [];
  const preferredTime = userPreferences.preferredTime || '19:00';
  const maxMinutes = userPreferences.maxSessionMinutes || 20;
  const dailyGoal = userPreferences.dailyGoal || 10;
  
  // 高优先级：今天到期
  if (progress.dueToday > 0) {
    const duration = Math.min(progress.dueToday * 2, maxMinutes);
    suggestions.push({
      recommendedTime: preferredTime,
      reason: `有 ${progress.dueToday} 张卡片今天到期，建议优先复习`,
      priority: 'high',
      estimatedDuration: duration,
    });
  }
  
  // 中优先级：本周到期
  if (progress.dueThisWeek > progress.dueToday) {
    const remaining = progress.dueThisWeek - progress.dueToday;
    const duration = Math.min(remaining * 1.5, maxMinutes);
    suggestions.push({
      recommendedTime: preferredTime,
      reason: `本周还有 ${remaining} 张卡片到期，建议分散复习`,
      priority: 'medium',
      estimatedDuration: duration,
    });
  }
  
  // 低优先级：新卡片学习
  if (progress.learningCards > 0 && progress.dueToday < dailyGoal) {
    const newCards = Math.min(progress.learningCards, dailyGoal - progress.dueToday);
    const duration = Math.min(newCards * 3, maxMinutes);
    suggestions.push({
      recommendedTime: preferredTime,
      reason: `有 ${progress.learningCards} 张新卡片可学习，建议每天学习 ${newCards} 张`,
      priority: 'low',
      estimatedDuration: duration,
    });
  }
  
  // 连续打卡激励
  if (progress.streakDays > 0) {
    suggestions.push({
      recommendedTime: preferredTime,
      reason: `已连续复习 ${progress.streakDays} 天，保持连胜！`,
      priority: 'low',
      estimatedDuration: 0,
    });
  }
  
  return suggestions;
}

/**
 * 计算最佳复习时间窗口
 * 基于用户历史复习时间分布
 */
export function calculateOptimalReviewWindow(
  reviewHistory: Map<string, ReviewRecord[]>
): { startHour: number; endHour: number } {
  const hourCounts = new Array(24).fill(0);
  
  for (const [, history] of reviewHistory) {
    for (const record of history) {
      // 从日期字符串无法直接获取小时，这里简化处理
      // 实际应用中需要存储完整的时间戳
    }
  }
  
  // 默认返回晚上 7-9 点
  return { startHour: 19, endHour: 21 };
}

/**
 * 获取卡片的下次复习建议（用于 UI 展示）
 */
export function getNextReviewInfo(state: SM2State): {
  daysUntilReview: number;
  isOverdue: boolean;
  urgency: 'overdue' | 'due-today' | 'due-soon' | 'later';
  label: string;
} {
  const todayDate = new Date(today() + 'T00:00:00');
  const nextReviewDate = new Date(state.nextReview + 'T00:00:00');
  const diffTime = nextReviewDate.getTime() - todayDate.getTime();
  const daysUntilReview = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let urgency: 'overdue' | 'due-today' | 'due-soon' | 'later';
  let label: string;
  
  if (daysUntilReview < 0) {
    urgency = 'overdue';
    label = `逾期 ${Math.abs(daysUntilReview)} 天`;
  } else if (daysUntilReview === 0) {
    urgency = 'due-today';
    label = '今天到期';
  } else if (daysUntilReview <= 3) {
    urgency = 'due-soon';
    label = `${daysUntilReview} 天后到期`;
  } else {
    urgency = 'later';
    label = `${daysUntilReview} 天后复习`;
  }
  
  return {
    daysUntilReview,
    isOverdue: daysUntilReview < 0,
    urgency,
    label,
  };
}

/**
 * 批量计算多张卡片的下次复习信息
 */
export function getBatchReviewInfo(cards: { id: string; state: SM2State }[]): Map<string, ReturnType<typeof getNextReviewInfo>> {
  const result = new Map();
  for (const card of cards) {
    result.set(card.id, getNextReviewInfo(card.state));
  }
  return result;
}

/**
 * 计算预测的复习负载（未来 N 天每天需要复习的卡片数）
 */
export function predictReviewLoad(
  cards: { state: SM2State }[],
  days: number = 14
): Map<string, number> {
  const loadMap = new Map<string, number>();
  const todayDate = new Date(today() + 'T00:00:00');
  
  // 初始化未来 N 天
  for (let i = 0; i < days; i++) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() + i);
    loadMap.set(formatDate(date), 0);
  }
  
  // 统计每天到期的卡片
  for (const card of cards) {
    const nextReview = card.state.nextReview;
    if (loadMap.has(nextReview)) {
      loadMap.set(nextReview, (loadMap.get(nextReview) || 0) + 1);
    }
  }
  
  return loadMap;
}