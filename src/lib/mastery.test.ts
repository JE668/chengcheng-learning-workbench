// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_POINTS,
  MIN_MASTERY_ATTEMPTS,
  SLOW_RESPONSE_MS,
  calculateMastery,
  knowledgePointForQuestion,
  rankWeakKnowledgePoints,
  weakestKnowledgePoint,
  type MasteryAggregate,
} from './mastery';
import type { PracticeQuestion } from './daily-practice/types';
import { STUDY_MODULES } from './study-modules';

function aggregate(
  knowledgePoint: string,
  attempts: number,
  correct: number,
  totalResponseMs: number
): MasteryAggregate {
  return { knowledgePoint, subject: 'math', attempts, correct, totalResponseMs };
}

function question(kind: PracticeQuestion['kind'], id: string): PracticeQuestion {
  return {
    id,
    kind,
    subject: '数学',
    prompt: '测试题',
    options: ['1', '2', '3', '4'],
    answer: 0,
    explain: '测试',
  } as unknown as PracticeQuestion;
}

describe('掌握度计算', () => {
  it('全对且秒答为 100，全对但达到速度下限仍有 75', () => {
    expect(calculateMastery(4, 4, 0)).toBe(100);
    expect(calculateMastery(4, 4, SLOW_RESPONSE_MS * 4)).toBe(75);
  });

  it('越慢或正确率越低，掌握度越低', () => {
    const fast = calculateMastery(4, 4, 2_000 * 4);
    const slow = calculateMastery(4, 4, 10_000 * 4);
    const wrong = calculateMastery(4, 2, 2_000 * 4);
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(wrong);
  });
});

describe('知识点映射', () => {
  it('按 kind 与稳定 id 前缀细分数学和英语知识点', () => {
    expect(knowledgePointForQuestion(question('pinyin', 'py-a-1')).key).toBe('chinese.pinyin');
    expect(knowledgePointForQuestion(question('math', 'ma-3-4')).key).toBe('math.calc');
    expect(knowledgePointForQuestion(question('math', 'mul-3-4')).key).toBe('math.mult-table');
    expect(knowledgePointForQuestion(question('math', 'clockh-3')).key).toBe('math.clock-half');
    expect(knowledgePointForQuestion(question('math', 'wp-a')).key).toBe('math.word-problem');
    expect(knowledgePointForQuestion(question('math', 'algo-1')).key).toBe('math.algorithm');
    expect(knowledgePointForQuestion(question('english', 'en-init-cat')).key).toBe(
      'english.en-initial'
    );
    expect(knowledgePointForQuestion(question('english', 'en-cat')).key).toBe('english.listen');
  });

  it('所有模块链接都指向 STUDY_MODULES 中真实存在的模块', () => {
    for (const point of Object.values(KNOWLEDGE_POINTS)) {
      const parts = point.href.split('/').filter(Boolean);
      if (parts[0] !== 'study' || parts.length !== 3) continue;
      const subject = parts[1] as keyof typeof STUDY_MODULES;
      expect(STUDY_MODULES[subject], `${point.key} 学科不存在`).toBeTruthy();
      expect(
        STUDY_MODULES[subject].some((module) => module.key === parts[2]),
        `${point.key} 指向不存在的模块 ${point.href}`
      ).toBe(true);
    }
  });
});

describe('薄弱点推荐', () => {
  it('没有数据或样本不足时返回 null', () => {
    expect(weakestKnowledgePoint([])).toBeNull();
    expect(
      weakestKnowledgePoint([aggregate('math.calc', MIN_MASTERY_ATTEMPTS - 1, 0, 0)])
    ).toBeNull();
  });

  it('已经掌握的知识点不占用薄弱点推荐位', () => {
    expect(weakestKnowledgePoint([aggregate('math.calc', 5, 5, 0)])).toBeNull();
  });

  it('准确率优先，准确率相同再比较平均响应时间', () => {
    const ranked = rankWeakKnowledgePoints([
      aggregate('math.calc', 3, 3, 3_000),
      aggregate('math.ordinal', 3, 2, 30_000),
      aggregate('math.clock', 3, 2, 9_000),
    ]);
    expect(ranked.map((item) => item.point.key)).toEqual([
      'math.ordinal',
      'math.clock',
      'math.calc',
    ]);
  });

  it('同分时按 key 稳定排序，不受输入顺序影响', () => {
    const left = aggregate('math.clock', 3, 2, 12_000);
    const right = aggregate('math.compare', 3, 2, 12_000);
    const a = rankWeakKnowledgePoints([left, right]).map((item) => item.point.key);
    const b = rankWeakKnowledgePoints([right, left]).map((item) => item.point.key);
    expect(a).toEqual(b);
  });
});
