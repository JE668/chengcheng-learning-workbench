import type { WeaknessRecommendation } from './mastery';

export interface ParentReportInputs {
  fullDays: number;
  activeDays: number;
  practiceDays: number;
  pointsWeek: number;
  minutesWeek: number;
  resolvedMistakes: number;
  unsolvedMistakes: number;
  weakestMastery: WeaknessRecommendation | null;
}

export interface ParentReportInsights {
  doingWell: string;
  needsAttention: string;
  practiceToday: string;
}

const WEEK_DAYS = 7;

export function buildParentReportInsights(input: ParentReportInputs): ParentReportInsights {
  const strongParts: string[] = [];
  if (input.fullDays > 0) {
    strongParts.push(`本周有 ${input.fullDays} 天完成三科打卡`);
  }
  if (input.resolvedMistakes > 0) {
    strongParts.push(`累计攻克 ${input.resolvedMistakes} 道错题`);
  }
  if (input.pointsWeek > 0) {
    strongParts.push(`获得 ${input.pointsWeek} 点积分`);
  }
  if (strongParts.length === 0) {
    strongParts.push('本周还没有稳定记录，先从一次短练习开始就好');
  }

  if (input.weakestMastery) {
    const { point, mastery, attempts, accuracy } = input.weakestMastery;
    return {
      doingWell: `${strongParts.join('，')}。`,
      needsAttention: `${point.subjectLabel}「${point.label}」最近 30 天掌握度 ${mastery}%（${attempts} 次作答，正确率 ${Math.round(
        accuracy * 100
      )}%），建议优先补这 1 个点。`,
      practiceToday: `今天陪孩子练 3 分钟「${point.label}」，先从最近错的题型开始，不用追求数量。`,
    };
  }

  if (input.unsolvedMistakes > 0) {
    return {
      doingWell: `${strongParts.join('，')}。`,
      needsAttention: `还有 ${input.unsolvedMistakes} 道错题未掌握，暂时没有足够的掌握度样本判断具体薄弱知识点。`,
      practiceToday: '今天陪孩子做 5 分钟错题复习，重做一遍再听解释。',
    };
  }

  if (input.activeDays < WEEK_DAYS || input.practiceDays < WEEK_DAYS * 0.6) {
    return {
      doingWell: `${strongParts.join('，')}。`,
      needsAttention: `本周打卡 ${input.activeDays} 天、一练 ${input.practiceDays} 天，学习节奏还不稳定。`,
      practiceToday: '今天先完成一科 3 分钟小练习，把节奏稳住，不急着补完所有内容。',
    };
  }

  return {
    doingWell: `${strongParts.join('，')}。`,
    needsAttention: '暂无足够风险信号；继续保持当前节奏，并留意下周是否出现新的错题类型。',
    practiceToday: `今天可以继续当前节奏${
      input.minutesWeek > 0 ? `，学习时长已累计 ${input.minutesWeek} 分钟` : ''
    }。`,
  };
}
