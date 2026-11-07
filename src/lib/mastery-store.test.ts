// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureSchema, getDb } from './db';
import { addDays, dateStr } from './date';
import type { PracticeQuestion } from './daily-practice/types';
import {
  getKnowledgeMasteryProfile,
  getWeakestKnowledgePoint,
  recordPracticeMastery,
} from './mastery-store';

const CHILD_A = 7611;
const CHILD_B = 7612;

function fixtureQuestions(): PracticeQuestion[] {
  const math = (id: string): PracticeQuestion => ({
    id,
    kind: 'math',
    subject: '数学',
    prompt: '1 + 1 = ?',
    options: ['2', '3'],
    answer: 0,
    explain: '1 + 1 = 2',
  });

  return [
    math('ma-1-1'),
    math('ma-1-2'),
    math('ma-1-3'),
    math('ma-1-4'),
    {
      id: 'en-cat',
      kind: 'english',
      subject: '英语',
      prompt: '听一听',
      word: 'cat',
      cn: '猫',
      emoji: '🐱',
      options: ['cat', 'dog', 'pig', 'fox'],
      answer: 0,
      explain: 'cat = 猫',
    },
  ];
}

async function resetChild(childId: number): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM mastery_daily WHERE child_id = ?', args: [childId] });
  await db.execute({ sql: 'DELETE FROM daily_practice WHERE child_id = ?', args: [childId] });
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [childId] });
  await db.execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name)
          VALUES (?, ?, '', 'child', ?)`,
    args: [childId, `mastery-${childId}`, `孩子${childId}`],
  });
}

beforeEach(async () => {
  await ensureSchema();
  await resetChild(CHILD_A);
  await resetChild(CHILD_B);
  await getDb().execute({
    sql: `INSERT INTO daily_practice (child_id, day, completed, correct, total, questions)
          VALUES (?, ?, 1, 4, 5, ?)`,
    args: [CHILD_A, dateStr(), JSON.stringify(fixtureQuestions())],
  });
});

describe('掌握度证据写入', () => {
  it('重复提交按绝对值覆盖，不重复累计', async () => {
    const firstAnswers = [0, 0, 0, 1, 0];
    const responseMs = [1000, 1000, 1000, 2000, 3000];

    expect(await recordPracticeMastery(CHILD_A, 5, firstAnswers, responseMs)).toBe(2);
    expect(await recordPracticeMastery(CHILD_A, 5, firstAnswers, responseMs)).toBe(2);

    const res = await getDb().execute({
      sql: `SELECT attempts, correct, total_response_ms
            FROM mastery_daily
            WHERE child_id = ? AND day = ? AND knowledge_point = 'math.calc'`,
      args: [CHILD_A, dateStr()],
    });
    expect(res.rows).toHaveLength(1);
    expect(Number(res.rows[0].attempts)).toBe(4);
    expect(Number(res.rows[0].correct)).toBe(3);
    expect(Number(res.rows[0].total_response_ms)).toBe(5000);
  });

  it('非法或长度不匹配的元数据整批忽略', async () => {
    expect(await recordPracticeMastery(CHILD_A, 5, [0, 0, 0, 1.5, 0], [0, 0, 0, 0, 0])).toBe(0);
    expect(await recordPracticeMastery(CHILD_A, 4, [0, 0, 0, 1, 0], [0, 0, 0, 0, 0])).toBe(0);
    const res = await getDb().execute({
      sql: 'SELECT COUNT(*) AS n FROM mastery_daily WHERE child_id = ?',
      args: [CHILD_A],
    });
    expect(Number(res.rows[0]?.n)).toBe(0);
  });

  it('不同孩子完全隔离', async () => {
    await recordPracticeMastery(CHILD_A, 5, [1, 1, 1, 1, 1], [0, 0, 0, 0, 0]);

    expect(await getWeakestKnowledgePoint(CHILD_A)).not.toBeNull();
    expect(await getWeakestKnowledgePoint(CHILD_B)).toBeNull();
  });
});

describe('最近 30 天薄弱点', () => {
  it('只聚合 30 天窗口，并按掌握度选最低项', async () => {
    const today = dateStr();
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO mastery_daily
              (child_id, day, knowledge_point, subject, attempts, correct, total_response_ms)
            VALUES (?, ?, 'math.calc', 'math', 3, 3, 300)`,
      args: [CHILD_B, today],
    });
    await db.execute({
      sql: `INSERT INTO mastery_daily
              (child_id, day, knowledge_point, subject, attempts, correct, total_response_ms)
            VALUES (?, ?, 'math.calc', 'math', 100, 0, 0)`,
      args: [CHILD_B, addDays(today, -30)],
    });

    const profile = await getKnowledgeMasteryProfile(CHILD_B, today);
    expect(profile).toHaveLength(1);
    expect(profile[0].attempts).toBe(3);
    expect(profile[0].correct).toBe(3);
    expect(profile[0].mastery).toBeGreaterThanOrEqual(75);
  });

  it('没有有效样本时首页保持原推荐', async () => {
    await getDb().execute({
      sql: `INSERT INTO mastery_daily
              (child_id, day, knowledge_point, subject, attempts, correct, total_response_ms)
            VALUES (?, ?, 'math.calc', 'math', 1, 0, 0)`,
      args: [CHILD_B, addDays(dateStr(), -1)],
    });
    expect(await getWeakestKnowledgePoint(CHILD_B)).toBeNull();
  });
});
