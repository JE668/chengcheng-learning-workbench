import { 
  WORD_PROBLEMS, 
  ORDINALS, 
  CLOCKS, 
  CLOCK_HALF,
  SHAPES,
  ANGLES,
  COMPARE_MORE,
  WEEK_CALENDAR,
  SOLID_SHAPES,
  POSITIONS,
  NUMBERS_1120,
  SPLITS,
} from '../study-data';
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

/* 多步应用题 */
export function genMultiStepWordProblemQ(): PracticeQuestion {
  const templates = [
    {
      text: '小明有 15 颗糖，吃了 4 颗，又分给弟弟 3 颗，还剩几颗？',
      answer: '8',
      emoji: '🍬',
    },
    {
      text: '书架上有 12 本书，妈妈买了 8 本，程程借走 5 本，现在有几本？',
      answer: '15',
      emoji: '📚',
    },
    {
      text: '果园里有 20 个苹果，摘了 7 个，又长了 4 个，现在有几个？',
      answer: '17',
      emoji: '🍎',
    },
    {
      text: '停车场有 18 辆车，开走 6 辆，又进来 9 辆，现在有几辆？',
      answer: '21',
      emoji: '🚗',
    },
    {
      text: '程程做了 25 道题，对了 18 道，错了几道？',
      answer: '7',
      emoji: '📝',
    },
    {
      text: '爱心萌可有 30 朵花，送了 12 朵，又做了 10 朵，一共有几朵？',
      answer: '28',
      emoji: '💗',
    },
  ];
  
  const p = templates[Math.floor(Math.random() * templates.length)];
  const ans = Number(p.answer);
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-5, 5);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set).slice(0, 4));
  const answer = options.indexOf(ans);
  return {
    id: `mwp-${p.text.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.text,
    options: options.map(String),
    answer,
    explain: `答案是 ${ans}`,
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

/* 比轻重/比长短题 */
export function genCompareMoreQ(): PracticeQuestion {
  const p = COMPARE_MORE[Math.floor(Math.random() * COMPARE_MORE.length)];
  const shuffled = shuffle([p.answer, ...p.options.filter((x) => x !== p.answer)]);
  const answer = shuffled.indexOf(p.answer);
  return {
    id: `cmpm-${p.question}`,
    kind: 'math',
    subject: '数学',
    prompt: `${p.a} ${p.b} ${p.question}`,
    options: shuffled,
    answer,
    explain: `答案是 ${p.answer}`,
    emoji: '⚖️',
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

/* 进位加法题 */
export function genCarryAddQ(): PracticeQuestion {
  const a = randInt(5, 9);
  const b = randInt(10 - a, 9);
  const ans = a + b;
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-5, 5);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `carry-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} + ${b} = ?（凑十法）`,
    options: options.map(String),
    answer,
    explain: `${a} + ${b} = ${ans}（${a} 凑十得 ${10 - a}，剩 ${b - (10 - a)})`,
    emoji: '➕',
  };
}

/* 退位减法题 */
export function genBorrowSubQ(): PracticeQuestion {
  const a = randInt(11, 18);
  const b = randInt(a - 9, 9);
  const ans = a - b;
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-3, 3);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `borrow-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} − ${b} = ?（退位法）`,
    options: options.map(String),
    answer,
    explain: `${a} − ${b} = ${ans}（退位计算）`,
    emoji: '➖',
  };
}

/* 分数题 */
export function genFractionQ(): PracticeQuestion {
  const fractions = [
    { q: '把一个苹果平均分成 2 份，每份是？', a: '1/2', opts: ['1/2', '1/3', '2/1', '1/4'], e: '🍎' },
    { q: '把一块饼干平均分成 3 份，每份是？', a: '1/3', opts: ['1/3', '1/2', '2/3', '1/4'], e: '🍪' },
    { q: '把一张纸平均分成 4 份，每份是？', a: '1/4', opts: ['1/4', '1/2', '3/4', '1/3'], e: '📄' },
    { q: '小明吃了 1/2 个苹果，还剩几分之几？', a: '1/2', opts: ['1/2', '1/3', '1/4', '2/1'], e: '🍎' },
    { q: '圆形分成 4 等份，涂 3 份，涂了几分之几？', a: '3/4', opts: ['3/4', '1/4', '1/2', '2/3'], e: '⭕' },
    { q: '长方形分成 2 等份，涂 1 份，涂了几分之几？', a: '1/2', opts: ['1/2', '1/3', '2/1', '1/4'], e: '🟫' },
    { q: '把 8 颗糖平均分给 4 个小朋友，每人几颗？', a: '2', opts: ['2', '3', '4', '1'], e: '🍬' },
    { q: '12 块饼干，每人分 3 块，能分给几个小朋友？', a: '4', opts: ['4', '3', '5', '6'], e: '🍪' },
  ];
  
  const p = fractions[Math.floor(Math.random() * fractions.length)];
  const shuffled = shuffle([p.a, ...p.opts.filter((x) => x !== p.a)]).slice(0, 4);
  const answer = shuffled.indexOf(p.a);
  return {
    id: `frac-${p.q.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.q,
    options: shuffled,
    answer,
    explain: `答案是 ${p.a}`,
    emoji: p.e,
  };
}

/* 几何图形识别题 */
export function genShapeQ(): PracticeQuestion {
  const shapeType = Math.random() < 0.5 ? 'plane' : 'solid';
  
  if (shapeType === 'plane') {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const opts = ['圆形', '正方形', '长方形', '三角形', '椭圆形', '半圆形', '五角星']
      .filter((x) => x !== s.name);
    const shuffled = shuffle([s.name, ...shuffle(opts).slice(0, 3)]);
    const answer = shuffled.indexOf(s.name);
    return {
      id: `shape-${s.name}`,
      kind: 'math',
      subject: '数学',
      prompt: `${s.emoji} 这是什么形状？`,
      options: shuffled,
      answer,
      explain: `${s.name}：${s.desc}`,
      emoji: s.emoji,
    };
  } else {
    const s = SOLID_SHAPES[Math.floor(Math.random() * SOLID_SHAPES.length)];
    const opts = ['长方体', '正方体', '圆柱', '球']
      .filter((x) => x !== s.name);
    const shuffled = shuffle([s.name, ...shuffle(opts).slice(0, 3)]);
    const answer = shuffled.indexOf(s.name);
    return {
      id: `solid-${s.name}`,
      kind: 'math',
      subject: '数学',
      prompt: `${s.emoji} 这是什么立体图形？`,
      options: shuffled,
      answer,
      explain: `${s.name}：${s.desc}`,
      emoji: s.emoji,
    };
  }
}

/* 角度识别题 */
export function genAngleQ(): PracticeQuestion {
  const a = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const opts = ['锐角', '直角', '钝角'].filter((x) => x !== a.name);
  const shuffled = shuffle([a.name, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(a.name);
  return {
    id: `angle-${a.name}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a.emoji} 这个角是 ${a.desc}，是什么角？`,
    options: shuffled,
    answer,
    explain: `${a.name}：${a.desc}（${a.deg}°）`,
    emoji: a.emoji,
  };
}

/* 钟表题（整时） */
export function genClockQ(): PracticeQuestion {
  const c = CLOCKS[Math.floor(Math.random() * CLOCKS.length)];
  const opts = CLOCKS.filter((x) => x.hour !== c.hour).map((x) => x.label);
  const shuffled = shuffle([c.label, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(c.label);
  return {
    id: `clock-${c.hour}`,
    kind: 'math',
    subject: '数学',
    prompt: '🕐 现在是几点？',
    options: shuffled,
    answer,
    explain: `答案是 ${c.label}`,
    emoji: '🕐',
    clockHour: c.hour,
  };
}

/* 钟表题（半时） */
export function genClockHalfQ(): PracticeQuestion {
  const c = CLOCK_HALF[Math.floor(Math.random() * CLOCK_HALF.length)];
  const opts = CLOCK_HALF.filter((x) => x.hour !== c.hour).map((x) => x.label);
  const shuffled = shuffle([c.label, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(c.label);
  return {
    id: `clockh-${c.hour}`,
    kind: 'math',
    subject: '数学',
    prompt: '🕐 现在是几点半？',
    options: shuffled,
    answer,
    explain: `答案是 ${c.label}`,
    emoji: '🕐',
    clockHour: c.hour,
    clockHalf: true,
  };
}

/* 星期/日历题 */
export function genCalendarQ(): PracticeQuestion {
  const p = WEEK_CALENDAR[Math.floor(Math.random() * WEEK_CALENDAR.length)];
  const shuffled = shuffle([p.answer, ...p.options.filter((x) => x !== p.answer)]).slice(0, 4);
  const answer = shuffled.indexOf(p.answer);
  return {
    id: `cal-${p.question.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.question,
    options: shuffled,
    answer,
    explain: `答案是 ${p.answer}`,
    emoji: p.emoji,
  };
}

/* 位置词题 */
export function genPositionQ(): PracticeQuestion {
  const p = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  const opts = POSITIONS.filter((x) => x.word !== p.word).map((x) => x.word);
  const shuffled = shuffle([p.word, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(p.word);
  return {
    id: `pos-${p.word}`,
    kind: 'math',
    subject: '数学',
    prompt: `请选出"${p.example}"中的位置词`,
    options: shuffled,
    answer,
    explain: `${p.word}：${p.desc}`,
    emoji: p.emoji,
  };
}

/* 数字组成题（11-20） */
export function genNumber1120Q(): PracticeQuestion {
  const n = NUMBERS_1120[Math.floor(Math.random() * NUMBERS_1120.length)];
  const opts = ['10+1', '10+2', '10+3', '10+4', '10+5', '10+6', '10+7', '10+8', '10+9']
    .filter((x) => x !== n.compose);
  const shuffled = shuffle([n.compose, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(n.compose);
  return {
    id: `n1120-${n.num}`,
    kind: 'math',
    subject: '数学',
    prompt: `${n.num} = 10 + 几？`,
    options: shuffled,
    answer,
    explain: `${n.num} = ${n.compose}`,
    emoji: '🔢',
  };
}

/* 分与合题 */
export function genSplitQ(): PracticeQuestion {
  const s = SPLITS[Math.floor(Math.random() * SPLITS.length)];
  const opts = s.pairs.filter((p) => p[0] !== 0 && p[1] !== 0).map((p) => `${p[0]}+${p[1]}`);
  if (opts.length < 3) {
    opts.push('1+1', '2+2', '3+3');
  }
  const correct = `${s.pairs[0][0]}+${s.pairs[0][1]}`;
  const shuffled = shuffle([correct, ...shuffle(opts).slice(0, 3)]);
  const answer = shuffled.indexOf(correct);
  return {
    id: `split-${s.num}`,
    kind: 'math',
    subject: '数学',
    prompt: `${s.num} 可以分成？`,
    options: shuffled,
    answer,
    explain: `${s.num} = ${s.pairs[0][0]} + ${s.pairs[0][1]}`,
    emoji: '🧩',
  };
}

/* 找规律题 */
export function genPatternQ(): PracticeQuestion {
  const patterns = [
    { seq: '2, 4, 6, 8, ?', ans: '10', opts: ['10', '9', '12', '14'], e: '➕2' },
    { seq: '10, 8, 6, 4, ?', ans: '2', opts: ['2', '0', '1', '3'], e: '➖2' },
    { seq: '3, 6, 9, 12, ?', ans: '15', opts: ['15', '14', '18', '13'], e: '➕3' },
    { seq: '1, 4, 7, 10, ?', ans: '13', opts: ['13', '12', '14', '11'], e: '➕3' },
    { seq: '20, 15, 10, 5, ?', ans: '0', opts: ['0', '1', '-5', '5'], e: '➖5' },
    { seq: '1, 2, 4, 8, ?', ans: '16', opts: ['16', '12', '14', '10'], e: '×2' },
    { seq: '5, 10, 15, 20, ?', ans: '25', opts: ['25', '24', '30', '22'], e: '➕5' },
    { seq: '100, 90, 80, 70, ?', ans: '60', opts: ['60', '65', '55', '50'], e: '➖10' },
  ];
  
  const p = patterns[Math.floor(Math.random() * patterns.length)];
  const shuffled = shuffle([p.ans, ...p.opts.filter((x) => x !== p.ans)]).slice(0, 4);
  const answer = shuffled.indexOf(p.ans);
  return {
    id: `pat-${p.seq.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: `找规律：${p.seq}`,
    options: shuffled,
    answer,
    explain: `规律是 ${p.e}`,
    emoji: '🔍',
  };
}

/* 所有题型池 */
export const MATH_QUESTION_GENERATORS = [
  genMathQ,
  genWordProblemQ,
  genMultiStepWordProblemQ,
  genOrdinalQ,
  genCompareQ,
  genCompareMoreQ,
  genMultiplyQ,
  genDivideQ,
  genCarryAddQ,
  genBorrowSubQ,
  genFractionQ,
  genShapeQ,
  genAngleQ,
  genClockQ,
  genClockHalfQ,
  genCalendarQ,
  genPositionQ,
  genNumber1120Q,
  genSplitQ,
  genPatternQ,
];

/** 随机生成一道数学题（可指定难度） */
export function genRandomMathQ(hard = false): PracticeQuestion {
  const generator = MATH_QUESTION_GENERATORS[Math.floor(Math.random() * MATH_QUESTION_GENERATORS.length)];
  // 对于基础口算题，传递 hard 参数
  if (generator === genMathQ) {
    return generator(hard);
  }
  return generator();
}

/** 按题型生成题目 */
export function genMathQByType(type: string): PracticeQuestion | null {
  const typeMap: Record<string, () => PracticeQuestion> = {
    basic: genMathQ,
    word: genWordProblemQ,
    multiword: genMultiStepWordProblemQ,
    ordinal: genOrdinalQ,
    compare: genCompareQ,
    comparemore: genCompareMoreQ,
    multiply: genMultiplyQ,
    divide: genDivideQ,
    carry: genCarryAddQ,
    borrow: genBorrowSubQ,
    fraction: genFractionQ,
    shape: genShapeQ,
    angle: genAngleQ,
    clock: genClockQ,
    clockhalf: genClockHalfQ,
    calendar: genCalendarQ,
    position: genPositionQ,
    number1120: genNumber1120Q,
    split: genSplitQ,
    pattern: genPatternQ,
  };
  
  const generator = typeMap[type];
  return generator ? generator() : null;
}

/** 获取可用的数学题型列表 */
export function getAvailableMathTypes(): string[] {
  return Object.keys({
    basic: '基础口算',
    word: '应用题',
    multiword: '多步应用题',
    ordinal: '序数题',
    compare: '比大小',
    comparemore: '比轻重/比长短',
    multiply: '乘法',
    divide: '除法',
    carry: '进位加法',
    borrow: '退位减法',
    fraction: '分数',
    shape: '平面图形',
    angle: '角度',
    clock: '钟表（整时）',
    clockhalf: '钟表（半时）',
    calendar: '星期/日历',
    position: '位置词',
    number1120: '11-20数字组成',
    split: '分与合',
    pattern: '找规律',
  });
}