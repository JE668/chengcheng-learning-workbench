import type { MistakeRow } from '../mistakes';
import type { PracticeQuestion } from './types';
import { shuffle } from './types';

/* —— 错题复习题：从到期错题生成，放在一练最前面 —— */

/** 粗略判断答案「形状」，只有同形状的选项混在一起才不别扭（数字 / 英文 / N 个汉字 / emoji…） */
export function shapeOf(s: string): string {
  if (/^-?\d+$/.test(s)) return 'num';
  // eslint-disable-next-line no-control-regex
  if (/^[\u0000-\u007F]+$/.test(s)) return 'ascii';
  if (/^[\u4e00-\u9fa5]+$/.test(s)) return `han${Array.from(s).length}`;
  return 'other';
}

export function buildMistakeOptions(m: MistakeRow, pool: MistakeRow[]): string[] {
  const answer = m.answer;
  const shape = shapeOf(answer);
  const opts: string[] = [answer];
  const push = (v: string | null | undefined) => {
    const t = (v ?? '').trim();
    if (t && !opts.includes(t) && shapeOf(t) === shape && opts.length < 4) opts.push(t);
  };
  push(m.wrong);
  // 同学科的其他错题答案/错答，形状一致才拿来当干扰项
  for (const o of shuffle(pool)) {
    if (o.id === m.id) continue;
    if (o.subject !== m.subject) continue;
    push(o.answer);
    push(o.wrong);
  }
  // 数字类可以直接造相邻数
  if (shape === 'num') {
    const n = Number(answer);
    for (const d of shuffle([1, 2, 3, -1, -2, -3])) {
      if (opts.length >= 4) break;
      const v = n + d;
      if (v >= 0) push(String(v));
    }
  }
  return shuffle(opts);
}

export function genMistakeQ(m: MistakeRow, pool: MistakeRow[]): import('./types').PracticeQuestion | null {
  const options = buildMistakeOptions(m, pool);
  if (options.length < 2) return null; // 连一个干扰项都凑不出来就跳过
  const subject: import('../types').Subject = (['语文', '数学', '英语'] as string[]).includes(m.subject)
    ? (m.subject as import('../types').Subject)
    : '语文';
  return {
    id: `mk-${m.id}`,
    kind: 'mistake',
    subject,
    prompt: m.prompt,
    options,
    answer: options.indexOf(m.answer),
    explain: `正确答案是「${m.answer}」${m.wrong ? `，上次选成了「${m.wrong}」` : ''}`,
    mistakeId: m.id,
    origin: m.kind ? `错题本 · ${m.kind}` : '错题本',
    speakText: shapeOf(m.answer).startsWith('han') ? m.prompt : undefined,
  };
}