/**
 * 算法练习自适应难度工具
 * 根据用户近期表现推荐合适的难度等级
 */

export interface AlgorithmPerformance {
  topicId: string;
  avgAccuracy: number; // 0-1
  totalAttempts: number;
  recentLevels: number[];
}

export interface DifficultyRecommendation {
  currentLevel: number;
  suggestedLevel: number;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * 根据近期表现推荐难度等级
 * 规则：
 * - 练习 >= 3 次且正确率 >= 90%：建议升 1 级（不超第 10 关）
 * - 正确率 >= 70%：保持当前等级
 * - 正确率 < 70%：建议降 1 级（不低于第 1 关）
 *
 * recentLevels 约定（由 computePerformance 生成）：按 completedAt 降序，最近的在前。
 */
export function recommendDifficulty(performance: AlgorithmPerformance): DifficultyRecommendation {
  const { avgAccuracy, totalAttempts, recentLevels } = performance;
  // ⚠️ recentLevels 是「最近的在前」（见 computePerformance 的降序排序）。
  // 原实现取了 length-1 —— 也就是最近几条里最旧的那条：
  // 用户依次打完第 1~5 关时，currentLevel 会算成 1 而不是 5，升降级建议就全反了。
  const currentLevel = recentLevels.length > 0 ? recentLevels[0] : 1;

  // 数据不足，返回默认推荐
  if (totalAttempts < 3) {
    return {
      currentLevel,
      suggestedLevel: currentLevel,
      reason: '练习数据不足，建议从当前等级继续',
      confidence: 'low',
    };
  }

  // 根据正确率推荐
  if (avgAccuracy >= 0.9 && currentLevel < 10) {
    return {
      currentLevel,
      suggestedLevel: currentLevel + 1,
      reason: `表现优秀（正确率 ${(avgAccuracy * 100).toFixed(0)}%），可以尝试更高难度`,
      confidence: 'high',
    };
  }

  if (avgAccuracy >= 0.7) {
    return {
      currentLevel,
      suggestedLevel: currentLevel,
      reason: `表现良好（正确率 ${(avgAccuracy * 100).toFixed(0)}%），继续保持`,
      confidence: 'medium',
    };
  }

  if (currentLevel > 1) {
    return {
      currentLevel,
      suggestedLevel: currentLevel - 1,
      reason: `正确率较低（${(avgAccuracy * 100).toFixed(0)}%），建议先巩固基础`,
      confidence: 'high',
    };
  }

  return {
    currentLevel,
    suggestedLevel: currentLevel,
    reason: `继续练习第 1 关，打好基础`,
    confidence: 'medium',
  };
}

/**
 * 从进度数据计算表现指标
 */
export function computePerformance(
  progress: Array<{
    level: number;
    correctCount: number;
    totalCount: number;
    bestStars: number;
    completedAt?: string | null;
  }>
): AlgorithmPerformance {
  const totalAttempts = progress.reduce((sum, p) => sum + p.totalCount, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctCount, 0);
  const avgAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  const recentLevels = progress
    .filter((p) => p.completedAt != null)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 5)
    .map((p) => p.level);

  return {
    topicId: '',
    avgAccuracy,
    totalAttempts,
    recentLevels,
  };
}
