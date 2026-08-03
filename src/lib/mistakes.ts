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
  resolved: number;
}

export function localDate(offset = 0): string {
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
    resolved: Number(r.resolved ?? 0),
  };
}

/**
 * 取「今天到期」的错题（按到期日升序，最久没复习的排前面）。
 */
export async function getDueMistakes(childId: number, limit = 2): Promise<MistakeRow[]> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT id, child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, resolved
          FROM mistakes
          WHERE child_id = ? AND resolved = 0 AND next_review <= ?
          ORDER BY next_review ASC, id ASC
          LIMIT ?`,
    args: [childId, localDate(), limit],
  });
  return res.rows.map(toMistakeRow);
}

/**
 * 间隔重复推进：答对 1→3→7→翻倍（上限 30 天），连对 4 次归档；答错则重置为明天再来。
 * 复习成功返回 true；该题今天还没到期（说明今天已经复习过了）则跳过并返回 false。
 */
export async function reviewMistake(childId: number, id: number, correct: boolean): Promise<boolean> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT reps, interval_days, next_review FROM mistakes WHERE id = ? AND child_id = ?',
    args: [id, childId],
  });
  if (!res.rows.length) return false;
  const row = res.rows[0];
  // 幂等保护：同一天重复提交只按第一次的结果算
  if (String(row.next_review ?? '') > localDate()) return false;

  const reps = Number(row.reps ?? 0);
  if (correct) {
    const newReps = reps + 1;
    let interval = 1;
    if (newReps === 1) interval = 3;
    else if (newReps === 2) interval = 7;
    else interval = Math.min(30, (Number(row.interval_days) || 1) * 2);
    const resolved = newReps >= 4 ? 1 : 0;
    await db.execute({
      sql: 'UPDATE mistakes SET reps = ?, interval_days = ?, next_review = ?, resolved = ? WHERE id = ? AND child_id = ?',
      args: [newReps, interval, localDate(interval), resolved, id, childId],
    });
  } else {
    await db.execute({
      sql: 'UPDATE mistakes SET reps = 0, interval_days = 1, next_review = ? WHERE id = ? AND child_id = ?',
      args: [localDate(1), id, childId],
    });
  }
  return true;
}
