import { getDb } from './db';

/** 错题本一条记录（对应 mistakes 表） */
export interface MistakeRow {
  id: number;
  child_id: number;
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string | null;
  next_review: string;
  interval_days: number;
  reps: number;
  easiness_factor: number;
  resolved: number;
}

function localDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toMistakeRow(r: Record<string, unknown>): MistakeRow {
  return {
    id: Number(r.id),
    child_id: Number(r.child_id),
    subject: String(r.subject ?? ''),
    kind: String(r.kind ?? ''),
    prompt: String(r.prompt ?? ''),
    answer: String(r.answer ?? ''),
    wrong: r.wrong == null ? null : String(r.wrong),
    next_review: String(r.next_review ?? ''),
    interval_days: Number(r.interval_days ?? 1),
    reps: Number(r.reps ?? 0),
    easiness_factor: Number(r.easiness_factor ?? 2.5),
    resolved: Number(r.resolved ?? 0),
  };
}

/**
 * 取「今天到期」的错题（按到期日升序，最久没复习的排前面）。
 */
export async function getDueMistakes(childId: number, limit = 2): Promise<MistakeRow[]> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT id, child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved
          FROM mistakes
          WHERE child_id = ? AND resolved = 0 AND next_review <= ?
          ORDER BY next_review ASC, id ASC
          LIMIT ?`,
    args: [childId, localDate(), limit],
  });
  return res.rows.map(toMistakeRow);
}

/**
 * 使用 SM-2 算法进行间隔重复推进。
 * 
 * 质量评分：
 * - 正确 (correct=true) -> 质量 4 (正确但稍有犹豫)
 * - 错误 (correct=false) -> 质量 1 (错误但看到答案后回忆起来)
 * 
 * SM-2 规则：
 * - 质量 < 3: 重置重复次数为 0，间隔设为 1 天，easiness factor -0.2
 * - 质量 >= 3: 重复次数 +1，间隔按 SM-2 计算，easiness factor 根据质量调整
 * - 连续 4 次成功后标记为成熟 (isMature)
 * - easiness factor 最小 1.3，初始 2.5
 * - 间隔上限 365 天
 * 
 * 幂等保护：同一天重复提交只按第一次的结果算
 * 
 * @returns true 表示成功处理，false 表示今日已复习过跳过
 */
export async function reviewMistake(childId: number, id: number, correct: boolean): Promise<boolean> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT reps, interval_days, easiness_factor, next_review FROM mistakes WHERE id = ? AND child_id = ?',
    args: [id, childId],
  });
  if (!res.rows.length) return false;
  const row = res.rows[0];
  
  // 幂等保护：同一天重复提交只按第一次的结果算
  if (String(row.next_review ?? '') > localDate()) return false;

  const currentEasiness = Number(row.easiness_factor ?? 2.5);
  const currentReps = Number(row.reps ?? 0);
  const currentInterval = Number(row.interval_days ?? 1);

  // SM-2 质量：正确=4, 错误=1
  const quality = correct ? 4 : 1;

  if (quality < 3) {
    // 失败：重置重复次数，间隔 1 天，easiness -0.2
    const newEasiness = Math.max(1.3, Number(row.easiness_factor ?? 2.5) - 0.2);
    await db.execute({
      sql: 'UPDATE mistakes SET reps = 0, interval_days = 1, easiness_factor = ?, next_review = ?, resolved = 0 WHERE id = ? AND child_id = ?',
      args: [newEasiness, localDate(1), id, childId],
    });
  } else {
    // 成功：SM-2 计算
    let actualInterval: number;
    
    if (Number(row.reps ?? 0) === 0) {
      actualInterval = 1;
    } else if (Number(row.reps ?? 0) === 1) {
      actualInterval = 6;
    } else {
      actualInterval = Math.round(Number(row.interval_days ?? 1) * Number(row.easiness_factor ?? 2.5));
    }
    
    // 间隔上限 365 天
    actualInterval = Math.min(actualInterval, 365);
    
    // 质量调整 easiness factor (quality=4 -> +0.02)
    const newEasiness = Math.max(1.3, Number(row.easiness_factor ?? 2.5) + 0.02);
    
    const newReps = Number(row.reps ?? 0) + 1;
    const isMature = newReps >= 4;
    
    const nextReviewDays = Number(row.reps ?? 0) === 0 ? 1 :
                          Number(row.reps ?? 0) === 1 ? 6 :
                          Math.round(Number(row.interval_days ?? 1) * Number(row.easiness_factor ?? 2.5));
    
    const nextReviewDate = localDate(Math.min(365, nextReviewDays));
    
    await db.execute({
      sql: 'UPDATE mistakes SET reps = ?, interval_days = ?, easiness_factor = ?, next_review = ?, resolved = ? WHERE id = ? AND child_id = ?',
      args: [Number(row.reps ?? 0) + 1, 
             Math.min(365, Math.round(Number(row.interval_days ?? 1) * Number(row.easiness_factor ?? 2.5))), 
             Math.max(1.3, Number(row.easiness_factor ?? 2.5) + 0.02), 
             localDate(Math.min(365, nextReviewDays)), 
             correct ? 1 : 0, 
             id, childId],
    });
  }
  return true;
}

function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}