/**
 * 萌可算法 - 题目生成器
 * 每个技巧生成 10 个关卡（每关 10 道题），共 100 道题
 * 难度递增：参数范围随关卡编号扩大
 */

import type { AlgorithmQuestion, StepField, StepInput } from './types';
import { randInt, shuffle } from '@/lib/daily-practice/types';

// ============================================================================
// 工具函数
// ============================================================================

/** 生成输入框 ID */
const inp = (stepId: string, idx: number) => `${stepId}-${idx}`;

/** 创建单步输入框 */
const makeInput = (
  stepId: string,
  idx: number,
  expectedValue: number,
  prefix?: string,
  suffix?: string,
  placeholder?: string,
): StepInput => ({
  id: inp(stepId, idx),
  prefix,
  suffix,
  expectedValue,
  placeholder: placeholder ?? String(expectedValue).length > 1 ? '?' : '数字',
});

/** 创建单步 */
const makeStep = (
  id: string,
  title: string,
  description: string,
  display: string,
  inputs: StepInput[],
  hint: string,
): StepField => ({ id, title, description, display, inputs, hint });

// ============================================================================
// 1. 凑十法生成器（9/8/7/6/5 加几）
// ============================================================================

/**
 * 凑十法核心逻辑
 * @param a 较大的数（不是 10）
 * @param b 要凑十的小数（不是 10）
 * @returns 分步填写数据
 */
function genMakingTenSteps(a: number, b: number): { display1: string; b1: number; b2: number; sum10: number; answer: number } {
  const b1 = 10 - a; // 需要凑的数
  const b2 = b - b1;  // 剩余的数
  const sum10 = 10;   // 凑成 10
  const answer = a + b;
  return {
    display1: `把 ${b} 拆成 ${b1} 和 ${b2}`,
    b1,
    b2,
    sum10,
    answer,
  };
}

/** 生成一道凑十法题目 */
export function genMakingTenQ(level: number): AlgorithmQuestion {
  // 10 个关卡：a 从 9 逐渐扩展到 5，b 从 1-9 到全范围
  const patterns: [number, number][] = [];
  if (level <= 2) {
    // 关 1-2：9 加几
    patterns.push([9, randInt(2, 9)]);
  } else if (level <= 4) {
    // 关 3-4：8/9 加几
    patterns.push([randInt(8, 9), randInt(2, 9)]);
  } else if (level <= 6) {
    // 关 5-6：7/8/9 加几
    patterns.push([randInt(7, 9), randInt(2, 9)]);
  } else if (level <= 8) {
    // 关 7-8：5/6/7/8/9 加几
    patterns.push([randInt(5, 9), randInt(3, 9)]);
  } else {
    // 关 9-10：进阶带 4 - 任意 5-9 加任意
    patterns.push([randInt(5, 9), randInt(2, 9)]);
  }

  const [a, b] = shuffle(patterns)[0];
  // 确保 a > b 且 a < 10 且 a + b > 10
  if (a >= 10 || b <= 0 || a + b <= 10) {
    // 重新生成
    return genMakingTenQ(level);
  }

  const step = genMakingTenSteps(a, b);

  const s1: StepField = makeStep(
    'step1',
    `第一步：把 ${b} 拆开`,
    `看到 ${a}，要想到 ${step.b1}（因为 ${a} + ${step.b1} = 10）。把 ${b} 拆成「${step.b1} 和 ${step.b2}」`,
    `${b} = ${step.b1} + ?`,
    [
      {
        id: inp('step1', 0),
        expectedValue: step.b2,
        placeholder: '?',
      },
    ],
    `${a} 加 1 等于 10，需要 ${10 - a}`,
  );

  const s2: StepField = makeStep(
    'step2',
    `第二步：凑成 10`,
    `把 ${a} 和 ${step.b1} 相加，凑成 10`,
    `${a} + ${step.b1} = ?`,
    [
      {
        id: inp('step2', 0),
        expectedValue: step.sum10,
        placeholder: '?',
      },
    ],
    `${a} + ${step.b1} = 10`,
  );

  const s3: StepField = makeStep(
    'step3',
    '第三步：加上剩余',
    `10 加上刚才剩下的 ${step.b2}，就是最终答案`,
    `10 + ${step.b2} = ?`,
    [
      {
        id: inp('step3', 0),
        expectedValue: step.answer,
        placeholder: '?',
      },
    ],
    `10 + ${step.b2} = ${step.answer}`,
  );

  return {
    id: `making-ten-${a}-${b}-${level}`,
    topicId: 'making-ten',
    prompt: `${a} + ${b} = ?`,
    digits: [a, b],
    operator: '+',
    answer: step.answer,
    stepFields: [s1, s2, s3],
    explain: `${a} 加 ${b}，把 ${b} 拆成 ${step.b1} 和 ${step.b2}。${a} + ${step.b1} = 10，10 + ${step.b2} = ${step.answer}`,
    mantra: `看到 ${a}，想到 ${10 - a}。把它拆开凑成 10！`,
  };
}

// ============================================================================
// 2. 破十法生成器（十几减几）
// ============================================================================

export function genBreakingTenQ(level: number): AlgorithmQuestion {
  // 关卡渐进：11-15 → 11-19
  let a: number; // 被减数（十几）
  let b: number; // 减数
  if (level <= 2) {
    a = randInt(11, 13); // 关 1-2: 11-13
  } else if (level <= 4) {
    a = randInt(11, 15); // 关 3-4: 11-15
  } else if (level <= 6) {
    a = randInt(11, 17); // 关 5-6
  } else if (level <= 8) {
    a = randInt(11, 19); // 关 7-8: 全范围
  } else {
    a = randInt(11, 19); // 关 9-10: 综合
  }
  b = randInt(1, 9);
  if (b >= a % 10) b = (a % 10) - 1 || 1; // 确保 b < a 个位
  if (b <= 0 || b >= a % 10) b = randInt(1, Math.max(1, (a % 10) - 1));

  const ones = a % 10;
  const sub1 = 10 - b; // 10 - b 的答案
  const answer = a - b;

  const s1: StepField = makeStep(
    'step1',
    `第一步：把 ${a} 拆开`,
    `把 ${a} 拆成 10 和 ${ones}，让 10 去和 ${b} 战斗`,
    `${a} = 10 + ?`,
    [
      {
        id: inp('step1', 0),
        expectedValue: ones,
        placeholder: '?',
      },
    ],
    `把 ${a} 分成 10 和 ${ones}`,
  );

  const s2: StepField = makeStep(
    'step2',
    `第二步：10 减去 ${b}`,
    `先用 10 减去 ${b} 这个「小怪兽」`,
    `10 - ${b} = ?`,
    [
      {
        id: inp('step2', 0),
        expectedValue: sub1,
        placeholder: '?',
      },
    ],
    `10 - ${b} = ${sub1}`,
  );

  const s3: StepField = makeStep(
    'step3',
    '第三步：加上援军',
    `刚才拆出来的 ${ones} 是援军，加回来就是答案`,
    `${sub1} + ${ones} = ?`,
    [
      {
        id: inp('step3', 0),
        expectedValue: answer,
        placeholder: '?',
      },
    ],
    `${sub1} + ${ones} = ${answer}`,
  );

  return {
    id: `breaking-ten-${a}-${b}-${level}`,
    topicId: 'breaking-ten',
    prompt: `${a} - ${b} = ?`,
    digits: [a, b],
    operator: '-',
    answer,
    stepFields: [s1, s2, s3],
    explain: `${a} 减 ${b}，把 ${a} 拆成 10 和 ${ones}。10 - ${b} = ${sub1}，${sub1} + ${ones} = ${answer}`,
    mantra: `十几减几，10 来帮忙，10 减去几，加剩余`,
  };
}

// ============================================================================
// 3. 平十法生成器（十几减几）
// ============================================================================

export function genLevelingTenQ(level: number): AlgorithmQuestion {
  let a: number; // 十几
  let b: number; // 要拆成两段的减数
  if (level <= 2) {
    a = randInt(11, 13);
    b = randInt(2, 5);
  } else if (level <= 4) {
    a = randInt(11, 15);
    b = randInt(4, 8);
  } else if (level <= 6) {
    a = randInt(11, 17);
    b = randInt(6, 9);
  } else {
    a = randInt(11, 19);
    b = randInt(1, 9);
  }
  if (a % 10 >= b) b = (a % 10) + 1; // 保证两次相减都为正
  if (b >= a) return genLevelingTenQ(level); // 重新

  const ones = a % 10; // 个位
  const b1 = ones; // 先减到 10
  const b2 = b - b1; // 剩余
  const afterFirst = 10; // 减完之后是 10
  const answer = a - b;

  const s1: StepField = makeStep(
    'step1',
    `第一步：拆出能减到 10 的数`,
    `${a} 的个位是 ${ones}，所以从 ${b} 里拆出 ${b1}（先减到 10）`,
    `${b} = ${b1} + ?`,
    [
      {
        id: inp('step1', 0),
        expectedValue: b2,
        placeholder: '?',
      },
    ],
    `${a} 减 ${b1} 变成 10`,
  );

  const s2: StepField = makeStep(
    'step2',
    `第二步：先减到 10`,
    `${a} - ${b1} 等于 ${afterFirst}`,
    `${a} - ${b1} = ?`,
    [
      {
        id: inp('step2', 0),
        expectedValue: afterFirst,
        placeholder: '?',
      },
    ],
    `${a} - ${b1} = ${afterFirst}`,
  );

  const s3: StepField = makeStep(
    'step3',
    '第三步：减剩下的',
    `现在是 ${afterFirst}，再减去剩下的 ${b2}，就是答案`,
    `${afterFirst} - ${b2} = ?`,
    [
      {
        id: inp('step3', 0),
        expectedValue: answer,
        placeholder: '?',
      },
    ],
    `${afterFirst} - ${b2} = ${answer}`,
  );

  return {
    id: `leveling-ten-${a}-${b}-${level}`,
    topicId: 'leveling-ten',
    prompt: `${a} - ${b} = ?`,
    digits: [a, b],
    operator: '-',
    answer,
    stepFields: [s1, s2, s3],
    explain: `${a} 减 ${b}，把 ${b} 拆成 ${b1} 和 ${b2}。先 ${a} - ${b1} = 10，再 10 - ${b2} = ${answer}`,
    mantra: '减数分两段，先减到十整，再减剩下数',
  };
}

// ============================================================================
// 4. 交换律生成器
// ============================================================================

export function genCommutativeQ(level: number): AlgorithmQuestion {
  // 两个两位数相加，交换后好算
  const a = randInt(20, 70);
  const b = randInt(20, 80);
  const answer = a + b;

  const s1: StepField = makeStep(
    'step1',
    '想一想：哪个顺序更好算？',
    `加法交换律：a + b = b + a。我们可以选择「先算哪个」`,
    `${a} + ${b}`,
    [],
    `两个数相加，前后可以交换位置，结果不变`,
  );

  const s2: StepField = makeStep(
    'step2',
    '计算',
    `现在算 ${b} + ${a}（换过来后更容易算）`,
    `${b} + ${a} = ?`,
    [
      {
        id: inp('step2', 0),
        expectedValue: answer,
        placeholder: '?',
      },
    ],
    `${b} + ${a} = ${answer}`,
  );

  return {
    id: `commutative-${a}-${b}-${level}`,
    topicId: 'commutative',
    prompt: `${a} + ${b} = ?`,
    digits: [a, b],
    operator: '+',
    answer,
    stepFields: [s1, s2],
    explain: `交换律：${a} + ${b} = ${b} + ${a} = ${answer}`,
    mantra: '加数交换和不变',
  };
}

// ============================================================================
// 5. 结合律生成器
// ============================================================================

export function genAssociativeQ(level: number): AlgorithmQuestion {
  // 三个数相加，找好朋友
  const friendlyPairs: [number, number][] = [
    [27, 13], [38, 12], [19, 21], [45, 15], [26, 14],
    [32, 18], [44, 16], [57, 23], [33, 27], [46, 24],
  ];
  const [a, b] = shuffle(friendlyPairs)[0];
  const c = randInt(30, 70);
  const answer = a + b + c;

  const sum12 = a + b;

  const s1: StepField = makeStep(
    'step1',
    '找好朋友',
    `${a} 和 ${b} 是好朋友！${a} + ${b} = ${sum12}（能凑成整十）`,
    `${a} + ${b} = ?`,
    [
      {
        id: inp('step1', 0),
        expectedValue: sum12,
        placeholder: '?',
      },
    ],
    `${a} + ${b} = ${sum12}`,
  );

  const s2: StepField = makeStep(
    'step2',
    '再和第三个数相加',
    `好朋友凑成 ${sum12} 之后，再加上 ${c}`,
    `${sum12} + ${c} = ?`,
    [
      {
        id: inp('step2', 0),
        expectedValue: answer,
        placeholder: '?',
      },
    ],
    `${sum12} + ${c} = ${answer}`,
  );

  return {
    id: `associative-${a}-${b}-${c}-${level}`,
    topicId: 'associative',
    prompt: `${a} + ${b} + ${c} = ?`,
    digits: [a, b, c],
    operator: '+',
    answer,
    stepFields: [s1, s2],
    explain: `先把 ${a} 和 ${b} 结合：${a} + ${b} = ${sum12}，再算 ${sum12} + ${c} = ${answer}`,
    mantra: '好朋友先抱在一起，凑成整十再相加',
  };
}

// ============================================================================
// 6. 减法去括号生成器
// ============================================================================

export function genSubtractionParensQ(level: number): AlgorithmQuestion {
  // a - (b - c) = a - b + c
  const a = randInt(30, 99);
  const c = randInt(10, 30);
  const b = a - c + randInt(5, 30); // 让 b > a - c 但 < a + c
  const inParen = b - c; // 括号里的结果
  const answer = a - inParen;

  const s1: StepField = makeStep(
    'step1',
    '去括号',
    `括号前面是减号，去掉括号后里面的符号要翻转。\n-(${b} - ${c}) 变成 -${b} + ${c}`,
    `${a} - (${b} - ${c})`,
    [],
    `-(${b} - ${c}) → -${b} + ${c}`,
  );

  const s2: StepField = makeStep(
    'step2',
    '变号后的式子',
    `现在式子变成：${a} - ${b} + ${c}`,
    `${a} - ${b} + ${c}`,
    [],
    `先算 ${a} - ${b}，再加 ${c}`,
  );

  const intermediate = a - b;
  const s3: StepField = makeStep(
    'step3',
    '分步计算',
    `第一步：${a} - ${b} = ?`,
    `${a} - ${b} = ?`,
    [
      {
        id: inp('step3', 0),
        expectedValue: intermediate,
        placeholder: '?',
      },
    ],
    `${a} - ${b} = ${intermediate}`,
  );

  const s4: StepField = makeStep(
    'step4',
    '最后一步',
    `第二步：${intermediate} + ${c} = ?`,
    `${intermediate} + ${c} = ?`,
    [
      {
        id: inp('step4', 0),
        expectedValue: answer,
        placeholder: '?',
      },
    ],
    `${intermediate} + ${c} = ${answer}`,
  );

  return {
    id: `subtraction-parens-${a}-${b}-${c}-${level}`,
    topicId: 'subtraction-parens',
    prompt: `${a} - (${b} - ${c}) = ?`,
    digits: [a, b, c],
    operator: '-',
    answer,
    stepFields: [s1, s2, s3, s4],
    explain: `${a} - (${b} - ${c}) = ${a} - ${b} + ${c} = ${intermediate} + ${c} = ${answer}`,
    mantra: '括号前面是减号，去括号要变号',
  };
}

// ============================================================================
// 7-10. 其他生成器（简化版，保持结构一致）
// ============================================================================

export function genAdditionParensQ(level: number): AlgorithmQuestion {
  const a = randInt(20, 60);
  const b = randInt(10, 40);
  const c = randInt(10, 40);
  const innerSum = b + c;
  const answer = a + innerSum;

  const s1: StepField = makeStep('step1', '去括号', `括号前面是加号，去掉括号不变号`, `${a} + (${b} + ${c})`, [], `+(${b}+${c}) → +${b}+${c}`);
  const s2: StepField = makeStep('step2', '去括号后的算式', `式子变成：${a} + ${b} + ${c}`, `${a} + ${b} + ${c}`, [], `从左到右依次计算`);
  const s3: StepField = makeStep('step3', '第一步', `${a} + ${b} = ?`, `${a} + ${b} = ?`, [{ id: inp('step3', 0), expectedValue: a + b, placeholder: '?' }], `${a} + ${b} = ${a + b}`);
  const s4: StepField = makeStep('step4', '第二步', `${a + b} + ${c} = ?`, `${a + b} + ${c} = ?`, [{ id: inp('step4', 0), expectedValue: answer, placeholder: '?' }], `${a + b} + ${c} = ${answer}`);

  return {
    id: `addition-parens-${a}-${b}-${c}-${level}`,
    topicId: 'addition-parens',
    prompt: `${a} + (${b} + ${c}) = ?`,
    digits: [a, b, c],
    operator: '+',
    answer,
    stepFields: [s1, s2, s3, s4],
    explain: `${a} + (${b} + ${c}) = ${a} + ${b} + ${c} = ${answer}`,
    mantra: '括号前面是加号，去括号不变号',
  };
}

export function genRoundingQ(level: number): AlgorithmQuestion {
  const friendly: [number, number][] = [
    [63, 37], [28, 72], [45, 55], [36, 64], [19, 81],
    [42, 58], [77, 23], [55, 45], [38, 62], [61, 39],
  ];
  const [a, b] = shuffle(friendly)[0];
  const tens = Math.floor(a / 10) + Math.floor(b / 10);
  const ones = (a % 10) + (b % 10);
  const answer = a + b;

  const s1: StepField = makeStep('step1', '先拆十位数', `把两位数的十位和个位拆开`, `${a} = ${Math.floor(a / 10) * 10} + ${a % 10}`, [{ id: inp('step1', 0), expectedValue: Math.floor(a / 10) * 10, placeholder: '?' }], `${a} 的十位是 ${Math.floor(a / 10)}`);
  const s2: StepField = makeStep('step2', '十位相加', `把十位的数字相加`, `${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ?`, [{ id: inp('step2', 0), expectedValue: tens * 10, placeholder: '?' }], `十位相加等于 ${tens * 10}`);
  const s3: StepField = makeStep('step3', '个位相加', `个位相加`, `${a % 10} + ${b % 10} = ?`, [{ id: inp('step3', 0), expectedValue: ones, placeholder: '?' }], `个位相加等于 ${ones}`);
  const s4: StepField = makeStep('step4', '合起来', `十位和个位的答案相加`, `${tens * 10} + ${ones} = ?`, [{ id: inp('step4', 0), expectedValue: answer, placeholder: '?' }], `${tens * 10} + ${ones} = ${answer}`);

  return {
    id: `rounding-${a}-${b}-${level}`,
    topicId: 'rounding',
    prompt: `${a} + ${b} = ?`,
    digits: [a, b],
    operator: '+',
    answer,
    stepFields: [s1, s2, s3, s4],
    explain: `${a} + ${b}，十位加十位得 ${tens * 10}，个位加个位得 ${ones}，合起来是 ${answer}`,
    mantra: '好朋友数凑成 100，十位加个位再相加',
  };
}

export function genSymbolMoveQ(level: number): AlgorithmQuestion {
  const a = randInt(30, 80);
  const c = randInt(10, 40);
  const b = randInt(20, 60);
  const answer = a - c + b;

  const s1: StepField = makeStep('step1', '搬家', `把 ${b} 和 -${c} 交换位置，把 -${c} 搬到后面`, `${a} - ${c} + ${b}`, [], `-${c} +${b} → +${b} -${c}`);
  const s2: StepField = makeStep('step2', '搬家后', `式子变成：${a} + ${b} - ${c}`, `${a} + ${b} - ${c}`, [], `先算 ${a} + ${b}，再减 ${c}`);
  const sumAB = a + b;
  const s3: StepField = makeStep('step3', '第一步', `${a} + ${b} = ?`, `${a} + ${b} = ?`, [{ id: inp('step3', 0), expectedValue: sumAB, placeholder: '?' }], `${a} + ${b} = ${sumAB}`);
  const s4: StepField = makeStep('step4', '第二步', `${sumAB} - ${c} = ?`, `${sumAB} - ${c} = ?`, [{ id: inp('step4', 0), expectedValue: answer, placeholder: '?' }], `${sumAB} - ${c} = ${answer}`);

  return {
    id: `symbol-move-${a}-${b}-${c}-${level}`,
    topicId: 'symbol-move',
    prompt: `${a} - ${c} + ${b} = ?`,
    digits: [a, c, b],
    operator: '-',
    answer,
    stepFields: [s1, s2, s3, s4],
    explain: `${a} - ${c} + ${b} = ${a} + ${b} - ${c} = ${sumAB} - ${c} = ${answer}`,
    mantra: '符号跟着数搬家，先算方便的',
  };
}

export function genMiscQ(level: number): AlgorithmQuestion {
  // 综合：混合多种技巧
  const generator = shuffle([
    () => genAssociativeQ(level),
    () => genRoundingQ(level),
    () => genSubtractionParensQ(level),
    () => genSymbolMoveQ(level),
  ])[0];
  return generator();
}

// ============================================================================
// 统一入口
// ============================================================================

/** 主题 ID → 生成器 */
export const ALGORITHM_GENERATORS: Record<string, (level: number) => AlgorithmQuestion> = {
  'making-ten': genMakingTenQ,
  'breaking-ten': genBreakingTenQ,
  'leveling-ten': genLevelingTenQ,
  'commutative': genCommutativeQ,
  'associative': genAssociativeQ,
  'subtraction-parens': genSubtractionParensQ,
  'addition-parens': genAdditionParensQ,
  'rounding': genRoundingQ,
  'symbol-move': genSymbolMoveQ,
  'misc': genMiscQ,
};

/** 为一关生成 10 道题 */
export function genPracticeSet(topicId: string, level: number): AlgorithmQuestion[] {
  const gen = ALGORITHM_GENERATORS[topicId];
  if (!gen) return [];
  const questions: AlgorithmQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (questions.length < 10 && guard++ < 100) {
    const q = gen(level);
    if (!seen.has(q.id)) {
      seen.add(q.id);
      questions.push(q);
    }
  }
  return questions;
}
