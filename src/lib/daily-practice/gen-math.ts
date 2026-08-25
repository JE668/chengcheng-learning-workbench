import { WORD_PROBLEMS, ORDINALS, CLOCKS } from '../study-data';
import type { PracticeQuestion } from './types';
import { randInt, shuffle } from './types';

/* —— 口算题 —— */
export function genMathQ(hard = false): PracticeQuestion {
  const isAdd = Math.random() < 0.6;
  let a: number, b: number, ans: number, prompt: string;
  if (isAdd) {
    a = randInt(hard ? 5 : 0, hard ? 50 : 10);
    b = randInt(hard ? (10 - a) : 0, hard ? 50 : 10);
    ans = a + b;
    prompt = `${a} + ${b} = ?`;
  } else {
    a = randInt(hard ? 5 : 1, hard ? 99 : 10);
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
  const baseOptions = shuffle([...p.options]);
  // 如果选项少于4个，添加干扰项
  while (baseOptions.length < 4) {
    const num = Number(p.answer) + Math.floor(Math.random() * 5) - 2;
    if (num >= 0 && !baseOptions.includes(String(num))) {
      baseOptions.push(String(num));
    }
  }
  const options = shuffle(baseOptions.slice(0, 4));
  const answer = options.indexOf(p.answer);
  return {
    id: `wp-${p.text.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.text,
    options,
    answer: options.indexOf(p.answer),
    explain: `答案是 ${p.answer}`,
    emoji: p.emoji || '🧮',
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


/* 乘法题 */
export function genMultiplyQ(): PracticeQuestion {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const ans = a * b;
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-5, 5);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `mul-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} × ${b} = ?`,
    options: options.map(String),
    answer,
    explain: `${a} × ${b} = ${ans}`,
  };
}

/* 除法题 */
export function genDivideQ(): PracticeQuestion {
  const b = randInt(2, 9);
  const ans = randInt(2, 9);
  const a = b * ans;
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-3, 3);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `div-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} ÷ ${b} = ?`,
    options: options.map(String),
    answer,
    explain: `${a} ÷ ${b} = ${ans}`,
  };
}

