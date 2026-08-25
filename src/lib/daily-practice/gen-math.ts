import { WORD_PROBLEMS, ORDINALS, CLOCKS } from '../study-data';
import type { PracticeQuestion } from './types';
import { randInt, shuffle } from './types';

/* —— 口算题 —— */
export function genMathQ(hard = false): PracticeQuestion {
  const isAdd = Math.random() < 0.6;
  let a: number, b: number, ans: number, prompt: string;
  if (isAdd) {
    a = randInt(0, hard ? 50 : 10);
    b = randInt(0, hard ? 50 : 10);
    ans = a + b;
    prompt = `${a} + ${b} = ?`;
  } else {
    a = randInt(1, hard ? 99 : 10);
    b = randInt(0, hard ? Math.min(a, 50) : a);
    ans = a - b;
    prompt = `${a} − ${b} = ?`;
  }
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-3, 3);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `ma-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt,
    options: options.map(String),
    answer,
    explain: `${prompt.replace('?', '')} = ${ans}`,
  };
}

/* 应用题 */
export function genWordProblemQ(): PracticeQuestion {
  const p = WORD_PROBLEMS[Math.floor(Math.random() * WORD_PROBLEMS.length)];
  const options = shuffle([...p.options]);
  const answer = options.indexOf(p.answer);
  return {
    id: `wp-${p.text.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.text,
    options,
    answer,
    explain: `答案是 ${p.answer}`,
  };
}

/* 序数题 */
export function genOrdinalQ(): PracticeQuestion {
  const o = ORDINALS[Math.floor(Math.random() * ORDINALS.length)];
  const allOpts = ['第1', '第2', '第3', '第4', '第5'].filter((x) => x !== o.answer);
  const shuffled = shuffle([o.answer, ...shuffle(allOpts).slice(0, 3)]);
  const answer = shuffled.indexOf(o.answer);
  return {
    id: `od-${o.ask}`,
    kind: 'math',
    subject: '数学',
    prompt: o.question,
    options: shuffled,
    answer,
    explain: o.answer,
  };
}

/* 比大小题 */
export function genCompareQ(): PracticeQuestion {
  const a = randInt(0, 10);
  const b = randInt(0, 10);
  const correct = a > b ? '>' : a < b ? '<' : '=';
  const options = shuffle(['>', '<', '=']);
  const answer = options.indexOf(correct);
  return {
    id: `cmp-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} __ ${b}（填 > < 或 =）`,
    options,
    answer,
    explain: `${a} ${correct} ${b}`,
  };
}

/* 钟表题 */
export function genClockQ(): PracticeQuestion {
  const c = CLOCKS[Math.floor(Math.random() * CLOCKS.length)];
  const distractors = shuffle(CLOCKS.filter((x) => x.hour !== c.hour)).slice(0, 3).map((x) => x.label);
  const options = shuffle([c.label, ...distractors]);
  const answer = options.indexOf(c.label);
  return {
    id: `ck-${c.hour}`,
    kind: 'math',
    subject: '数学',
    prompt: `这是几点？`,
    options,
    answer,
    explain: c.label,
  };
}

/* 比大小题（数字版） */
export function genCompareNumQ(): PracticeQuestion {
  const a = randInt(0, 10);
  const b = randInt(0, 10);
  const correct = a > b ? '>' : a < b ? '<' : '=';
  const options = shuffle(['>', '<', '=']);
  const answer = options.indexOf(correct);
  return {
    id: `cmp-num-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} __ ${b}（填 > < 或 =）`,
    options,
    answer,
    explain: `${a} ${correct} ${b}`,
  };
}