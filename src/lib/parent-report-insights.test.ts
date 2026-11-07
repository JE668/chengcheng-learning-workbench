// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildParentReportInsights } from './parent-report-insights';
import { KNOWLEDGE_POINTS } from './mastery';

const base = {
  fullDays: 3,
  activeDays: 7,
  practiceDays: 7,
  pointsWeek: 120,
  minutesWeek: 80,
  resolvedMistakes: 4,
  unsolvedMistakes: 0,
  weakestMastery: null,
};

describe('家长报告三条结论', () => {
  it('优先使用掌握度画像，并给出明确陪练动作', () => {
    const insight = buildParentReportInsights({
      ...base,
      unsolvedMistakes: 8,
      weakestMastery: {
        point: KNOWLEDGE_POINTS['chinese.pinyin'],
        accuracy: 0.4,
        attempts: 5,
        mastery: 52,
      },
    });

    expect(insight.doingWell).toContain('3 天完成三科打卡');
    expect(insight.needsAttention).toContain('语文「拼音」最近 30 天掌握度 52%');
    expect(insight.practiceToday).toContain('3 分钟「拼音」');
  });

  it('掌握度样本不足时，用未掌握错题给出保守建议', () => {
    const insight = buildParentReportInsights({ ...base, unsolvedMistakes: 3 });
    expect(insight.needsAttention).toContain('3 道错题未掌握');
    expect(insight.practiceToday).toContain('5 分钟错题复习');
  });

  it('没有薄弱证据时，不编造结论', () => {
    const insight = buildParentReportInsights(base);
    expect(insight.needsAttention).toContain('暂无足够风险信号');
    expect(insight.practiceToday).toContain('学习时长已累计 80 分钟');
  });
});
