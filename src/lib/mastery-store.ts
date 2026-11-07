import { getDb } from './db-core';
import { addDays, dateStr } from './date';
import { safeJsonParse } from './safe-json';
import {
  MAX_PRACTICE_RESPONSE_MS,
  MIN_MASTERY_ATTEMPTS,
  knowledgePointForQuestion,
  rankWeakKnowledgePoints,
  weakestKnowledgePoint,
  toWeaknessRecommendation,
  type KnowledgeMastery,
  type KnowledgePoint,
  type MasteryAggregate,
  type MasterySubject,
  type WeaknessRecommendation,
} from './mastery';
import type { PracticeQuestion } from './daily-practice/types';

/** 一次答题的耗时上限：超过 15 分钟的点击不计入速度分。 */
export const MAX_RESPONSE_MS = MAX_PRACTICE_RESPONSE_MS;

const MASTERY_WINDOW_DAYS = 30;

interface StoredAggregate {
  point: KnowledgePoint;
  attempts: number;
  correct: number;
  totalResponseMs: number;
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function asMasterySubject(value: unknown): MasterySubject | null {
  return value === 'chinese' || value === 'math' || value === 'english' ? value : null;
}

/**
 * 写入今天、按知识点聚合的「首次作答」证据。
 *
 * 设计约束：
 * - 只看 firstAnswers，不把答错后的重选当成掌握；
 * - 任一元数据不合法就整批忽略，绝不因埋点字段影响正常打卡；
 * - 用绝对值 upsert，重复 POST 不会把 attempts / 耗时越加越大。
 */
export async function recordPracticeMastery(
  childId: number,
  answerCount: number,
  firstAnswers: unknown,
  responseMs: unknown
): Promise<number> {
  if (!Number.isSafeInteger(childId) || childId <= 0) return 0;
  if (!Number.isSafeInteger(answerCount) || answerCount < 0) return 0;
  if (!Array.isArray(firstAnswers) || !Array.isArray(responseMs)) return 0;
  if (firstAnswers.length !== answerCount || responseMs.length !== answerCount) return 0;

  const db = getDb();
  const today = dateStr();
  const row = (
    await db.execute({
      sql: 'SELECT questions FROM daily_practice WHERE child_id = ? AND day = ?',
      args: [childId, today],
    })
  ).rows[0];
  if (!row?.questions) return 0;

  const questions = safeJsonParse<PracticeQuestion[]>(String(row.questions), []);
  if (!Array.isArray(questions) || questions.length !== answerCount) return 0;

  const aggregates = new Map<string, StoredAggregate>();
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const firstAnswer = firstAnswers[i];
    const elapsed = responseMs[i];
    if (!question || !Array.isArray(question.options)) return 0;
    if (!isSafeNonNegativeInteger(firstAnswer) || firstAnswer >= question.options.length) return 0;
    if (!isSafeNonNegativeInteger(elapsed) || elapsed > MAX_RESPONSE_MS) return 0;

    const point = knowledgePointForQuestion(question);
    const existing = aggregates.get(point.key);
    const correct = firstAnswer === question.answer ? 1 : 0;
    if (existing) {
      existing.attempts += 1;
      existing.correct += correct;
      existing.totalResponseMs += elapsed;
    } else {
      aggregates.set(point.key, {
        point,
        attempts: 1,
        correct,
        totalResponseMs: elapsed,
      });
    }
  }

  for (const item of aggregates.values()) {
    await db.execute({
      sql: `INSERT INTO mastery_daily
              (child_id, day, knowledge_point, subject, attempts, correct, total_response_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(child_id, day, knowledge_point) DO UPDATE SET
              subject = excluded.subject,
              attempts = excluded.attempts,
              correct = excluded.correct,
              total_response_ms = excluded.total_response_ms,
              updated_at = CURRENT_TIMESTAMP`,
      args: [
        childId,
        today,
        item.point.key,
        item.point.subject,
        item.attempts,
        item.correct,
        item.totalResponseMs,
      ],
    });
  }

  return aggregates.size;
}

function rowToAggregate(row: Record<string, unknown>): MasteryAggregate | null {
  const subject = asMasterySubject(row.subject);
  if (!subject) return null;
  return {
    knowledgePoint: String(row.knowledge_point ?? ''),
    subject,
    attempts: Number(row.attempts ?? 0),
    correct: Number(row.correct ?? 0),
    totalResponseMs: Number(row.total_response_ms ?? 0),
  };
}

async function loadAggregates(childId: number, today: string): Promise<MasteryAggregate[]> {
  if (!Number.isSafeInteger(childId) || childId <= 0) return [];
  const start = addDays(today, -(MASTERY_WINDOW_DAYS - 1));
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT
            knowledge_point,
            subject,
            SUM(attempts) AS attempts,
            SUM(correct) AS correct,
            SUM(total_response_ms) AS total_response_ms
          FROM mastery_daily
          WHERE child_id = ? AND day >= ? AND day <= ?
          GROUP BY knowledge_point, subject`,
    args: [childId, start, today],
  });

  return res.rows
    .map((row) => rowToAggregate(row as Record<string, unknown>))
    .filter((row): row is MasteryAggregate => row !== null);
}

/** 最近 30 天、至少作答过一次的知识点掌握度，按薄弱优先排序。 */
export async function getKnowledgeMasteryProfile(
  childId: number,
  today = dateStr()
): Promise<KnowledgeMastery[]> {
  const aggregates = await loadAggregates(childId, today);
  return rankWeakKnowledgePoints(aggregates, 0);
}

/** 首页推荐入口：样本不足或无数据时返回 null，不制造“薄弱点”。 */
export async function getWeakestKnowledgePoint(
  childId: number,
  today = dateStr()
): Promise<WeaknessRecommendation | null> {
  const aggregates = await loadAggregates(childId, today);
  return toWeaknessRecommendation(weakestKnowledgePoint(aggregates, MIN_MASTERY_ATTEMPTS));
}
