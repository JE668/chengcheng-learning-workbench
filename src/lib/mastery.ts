import type { PracticeQuestion } from './daily-practice/types';

export type MasterySubject = 'chinese' | 'math' | 'english';

export interface KnowledgePoint {
  key: string;
  label: string;
  subject: MasterySubject;
  subjectLabel: '语文' | '数学' | '英语';
  href: string;
}

export interface MasteryAggregate {
  knowledgePoint: string;
  subject: MasterySubject;
  attempts: number;
  correct: number;
  totalResponseMs: number;
}

export interface KnowledgeMastery {
  point: KnowledgePoint;
  attempts: number;
  correct: number;
  accuracy: number;
  avgResponseMs: number;
  mastery: number;
}

export interface WeaknessRecommendation {
  point: KnowledgePoint;
  mastery: number;
  accuracy: number;
  attempts: number;
}

/** 低于 3 次作答的样本不参与推荐，避免一道偶然错题就改变首页路径。 */
export const MIN_MASTERY_ATTEMPTS = 3;

/** 掌握度达到 90 不再占用首页推荐位，避免把“已经掌握”包装成薄弱点。 */
export const MASTERY_RECOMMENDATION_CEILING = 90;

/** 15 秒达到速度分下限；更慢仍只计 0 分，不会把掌握度算成负数。 */
export const SLOW_RESPONSE_MS = 15_000;

/** 一次答题的最长可信耗时，前后端共用，避免超长挂机页污染速度分。 */
export const MAX_PRACTICE_RESPONSE_MS = 15 * 60 * 1000;

const SUBJECT_LABELS: Record<MasterySubject, KnowledgePoint['subjectLabel']> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};

function point(key: string, label: string, subject: MasterySubject, href: string): KnowledgePoint {
  return { key, label, subject, subjectLabel: SUBJECT_LABELS[subject], href };
}

export const KNOWLEDGE_POINTS = {
  'chinese.pinyin': point('chinese.pinyin', '拼音', 'chinese', '/study/chinese/pinyin'),
  'chinese.dictation': point('chinese.dictation', '听写', 'chinese', '/study/dictation'),
  'chinese.characters': point('chinese.characters', '识字', 'chinese', '/study/chinese/characters'),
  'chinese.antonyms': point('chinese.antonyms', '反义词', 'chinese', '/study/chinese/antonyms'),
  'chinese.proverbs': point('chinese.proverbs', '谚语', 'chinese', '/study/chinese/proverbs'),
  'chinese.riddles': point('chinese.riddles', '谜语', 'chinese', '/study/chinese/riddles'),
  'chinese.poem': point('chinese.poem', '古诗', 'chinese', '/study/chinese/poem-fun'),
  'mistake.review.chinese': point('mistake.review.chinese', '错题复习', 'chinese', '/study/review'),
  'mistake.review.math': point('mistake.review.math', '错题复习', 'math', '/study/review'),
  'mistake.review.english': point('mistake.review.english', '错题复习', 'english', '/study/review'),
  'chinese.general': point('chinese.general', '语文', 'chinese', '/study/chinese'),
  'math.calc': point('math.calc', '加减法', 'math', '/study/math/calc'),
  'math.mult-table': point('math.mult-table', '乘法口诀', 'math', '/study/math/mult-table'),
  'math.clock': point('math.clock', '认识钟表', 'math', '/study/math/clock'),
  'math.clock-half': point('math.clock-half', '钟表半时', 'math', '/study/math/clock-half'),
  'math.compare': point('math.compare', '比大小', 'math', '/study/math/compare'),
  'math.ordinal': point('math.ordinal', '序数', 'math', '/study/math/ordinal'),
  'math.word-problem': point('math.word-problem', '应用题', 'math', '/study/math/word-problem'),
  'math.algorithm': point('math.algorithm', '算法思维', 'math', '/algorithm'),
  'math.general': point('math.general', '数学', 'math', '/study/math'),
  'english.listen': point('english.listen', '英语听词', 'english', '/study/english/listen'),
  'english.en-initial': point(
    'english.en-initial',
    '英语首音',
    'english',
    '/study/english/en-initial'
  ),
  'english.general': point('english.general', '英语', 'english', '/study/english'),
};

export type KnowledgePointKey = keyof typeof KNOWLEDGE_POINTS;

/**
 * 将每日一练题目映射到稳定知识点。
 *
 * 题目 id 由生成器定义，是跨刷新不变的语义标识；不能用选项下标或题面文本，
 * 否则同一知识点每天都会被拆成不同 key。
 */
export function knowledgePointForQuestion(question: PracticeQuestion): KnowledgePoint {
  const id = question.id;

  switch (question.kind) {
    case 'pinyin':
      return KNOWLEDGE_POINTS['chinese.pinyin'];
    case 'dictation':
      return KNOWLEDGE_POINTS['chinese.dictation'];
    case 'chinese-quiz':
      return KNOWLEDGE_POINTS['chinese.characters'];
    case 'antonym':
      return KNOWLEDGE_POINTS['chinese.antonyms'];
    case 'proverb':
      return KNOWLEDGE_POINTS['chinese.proverbs'];
    case 'riddle':
      return KNOWLEDGE_POINTS['chinese.riddles'];
    case 'poem':
      return KNOWLEDGE_POINTS['chinese.poem'];
    case 'mistake':
      return mistakeKnowledgePoint(question.subject);
    case 'math':
      if (id.startsWith('algo-')) return KNOWLEDGE_POINTS['math.algorithm'];
      if (id.startsWith('mul-')) return KNOWLEDGE_POINTS['math.mult-table'];
      if (id.startsWith('clockh-')) return KNOWLEDGE_POINTS['math.clock-half'];
      if (id.startsWith('clock-')) return KNOWLEDGE_POINTS['math.clock'];
      if (id.startsWith('cmp-')) return KNOWLEDGE_POINTS['math.compare'];
      if (id.startsWith('od-')) return KNOWLEDGE_POINTS['math.ordinal'];
      if (id.startsWith('wp-') || id.startsWith('mwp-')) {
        return KNOWLEDGE_POINTS['math.word-problem'];
      }
      if (id.startsWith('ma-')) return KNOWLEDGE_POINTS['math.calc'];
      return KNOWLEDGE_POINTS['math.general'];
    case 'english':
      if (id.startsWith('en-init-')) return KNOWLEDGE_POINTS['english.en-initial'];
      if (id.startsWith('en-')) return KNOWLEDGE_POINTS['english.listen'];
      return KNOWLEDGE_POINTS['english.general'];
  }
}

function mistakeKnowledgePoint(subject: PracticeQuestion['subject']): KnowledgePoint {
  const subjectKey: MasterySubject =
    subject === '数学' ? 'math' : subject === '英语' ? 'english' : 'chinese';
  if (subjectKey === 'math') return KNOWLEDGE_POINTS['mistake.review.math'];
  if (subjectKey === 'english') return KNOWLEDGE_POINTS['mistake.review.english'];
  return KNOWLEDGE_POINTS['mistake.review.chinese'];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 准确率 75% + 速度 25%，返回 0~100 的整数。 */
export function calculateMastery(
  attempts: number,
  correct: number,
  totalResponseMs: number
): number {
  if (attempts <= 0) return 0;
  const accuracy = clamp(correct / attempts, 0, 1);
  const avgResponseMs = totalResponseMs / attempts;
  const speed = clamp(1 - avgResponseMs / SLOW_RESPONSE_MS, 0, 1);
  return Math.round(accuracy * 75 + speed * 25);
}

export function summarizeMastery(aggregate: MasteryAggregate): KnowledgeMastery | null {
  const point = KNOWLEDGE_POINTS[aggregate.knowledgePoint as KnowledgePointKey];
  if (!point) return null;
  const attempts = Math.max(0, Math.floor(aggregate.attempts));
  const correct = clamp(Math.floor(aggregate.correct), 0, attempts);
  const totalResponseMs = Math.max(0, Math.floor(aggregate.totalResponseMs));
  if (attempts === 0) return null;
  return {
    point,
    attempts,
    correct,
    accuracy: correct / attempts,
    avgResponseMs: totalResponseMs / attempts,
    mastery: calculateMastery(attempts, correct, totalResponseMs),
  };
}

/**
 * 推荐排序刻意保持确定性：
 * 掌握度低 → 正确率低 → 平均耗时高 → 样本多 → key 字典序。
 *
 * 前四项都相同时才用 key 兜底，因此不依赖数据库返回顺序，同分结果也不会抖动。
 */
export function rankWeakKnowledgePoints(
  aggregates: MasteryAggregate[],
  minAttempts = MIN_MASTERY_ATTEMPTS
): KnowledgeMastery[] {
  return aggregates
    .map(summarizeMastery)
    .filter((item): item is KnowledgeMastery => item !== null && item.attempts >= minAttempts)
    .sort((a, b) => {
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if (a.avgResponseMs !== b.avgResponseMs) return b.avgResponseMs - a.avgResponseMs;
      if (a.attempts !== b.attempts) return b.attempts - a.attempts;
      return a.point.key.localeCompare(b.point.key, 'zh-CN');
    });
}

export function weakestKnowledgePoint(
  aggregates: MasteryAggregate[],
  minAttempts = MIN_MASTERY_ATTEMPTS
): KnowledgeMastery | null {
  const weakest = rankWeakKnowledgePoints(aggregates, minAttempts)[0] ?? null;
  if (!weakest || weakest.mastery >= MASTERY_RECOMMENDATION_CEILING) return null;
  return weakest;
}

export function toWeaknessRecommendation(
  mastery: KnowledgeMastery | null
): WeaknessRecommendation | null {
  if (!mastery) return null;
  return {
    point: mastery.point,
    mastery: mastery.mastery,
    accuracy: mastery.accuracy,
    attempts: mastery.attempts,
  };
}
