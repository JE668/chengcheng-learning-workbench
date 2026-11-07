// @vitest-environment node
/**
 * 数学题生成器的**全局**不变量回归（gen-math.ts 此前 45% 覆盖）。
 *
 * ## 与同目录 gen-math.test.ts 的分工
 * 那边守 3 个具体题型的历史 P0（分与合选项重复、减法去括号出负数、破十法退化题）。
 * 这里守的是**所有 21 个生成器共同的底线**：新增一个题型时，不需要想起来
 * 单独写「选项别重复」——本文件自动把它纳入扫描。
 *
 * ## 为什么这些断言值得钉死
 * 每日一练是孩子每天第一次打开就做的模块，出题逻辑出错不会报错，
 * 只会安静地发一张「正确答案不在选项里」或「0.5 个苹果」的题面。
 * 而且这些题会写进 SM2 错题本：一道答案本身有错的题，会把孩子往错的方向
 * 反复巩固，属于「越用越坏」的故障，比普通 500 更难被发现。
 *
 * ## 用种子随机而不是 Math.random
 * 生成器全是随机的，纯随机扫描一旦在 CI 变红就极难复现。这里把 Math.random
 * 换成固定种子的 LCG：扫描次数一样，但每次跑的是同一批题，红了直接原样重跑。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MATH_QUESTION_GENERATORS,
  genMathQ,
  genMathQByType,
  genRandomMathQ,
  getAvailableMathTypes,
} from './gen-math';

const SEED = 20261107;
const SAMPLES = 800;
const realRandom = Math.random;

/** 32 位 LCG（数值配方同 Numerical Recipes），够均匀且完全可复现。 */
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

beforeEach(() => {
  Math.random = seededRandom(SEED);
});
afterEach(() => {
  Math.random = realRandom;
});

/**
 * 各题型的**合法选项数**。不是「必须是 4 个」，而是把「为什么这三个题型更少」写下来：
 * 角只有锐/直/钝三种，星期题只有数据里的三个候选，比轻重是二选一。
 * 有人改坏了选项池（比如把干扰项生成删了）会立刻在这里露出来。
 */
const EXPECTED_OPTION_COUNT: Record<string, number> = {
  genAngleQ: 3,
  genCalendarQ: 3,
  genCompareQ: 3, // > = < 三选一
  genCompareMoreQ: 2, // 二选一
};

type Q = {
  id: string;
  kind: string;
  subject: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
};

/**
 * 从题面解析 a op b。**三个捕获组**（a、op、b），所以 b 是 m[3]。
 * 若把中段的运算符写成不加括号的 [+\-−×÷]，就只剩两个捕获组，m[3] 变 undefined，
 * Number(undefined) = NaN，于是「NaN !== 正确选项」这类断言看着在跑、实际永不成立。
 * 本文件第一版就在下面 hard 难度那两处踩了这个坑，所以统一收口到这里。
 */
function parseArith(prompt: unknown): { a: number; op: string; b: number } | null {
  const m = /^(\d+)\s*([+\-−×÷])\s*(\d+)\s*=\s*\?$/.exec(String(prompt ?? '').trim());
  if (!m) return null;
  return { a: Number(m[1]), op: m[2], b: Number(m[3]) };
}

/** 独立重算题面值：不复用生成器自己算出的 ans，避免「自己证明自己对」。 */
function evalArith({ a, op, b }: { a: number; op: string; b: number }): number {
  if (op === '+') return a + b;
  if (op === '-' || op === '−') return a - b;
  if (op === '×') return a * b;
  return a / b;
}

/** 跑 n 道题，返回违反的不变量清单（空数组 = 全部通过）。 */
function violationsOf(gen: () => Q, n: number): string[] {
  const bad: string[] = [];
  const push = (tag: string, q: unknown) => {
    if (bad.length < 6) bad.push(`${tag} ← ${JSON.stringify(q)}`);
  };
  for (let i = 0; i < n; i++) {
    const q = gen();
    if (!q || !Array.isArray(q.options)) {
      push('没产出题目或没有 options', q);
      continue;
    }
    // 1. 选项本身
    if (new Set(q.options).size !== q.options.length) push('选项有重复（孩子会看到两个正确项）', q);
    if (q.options.some((o) => o === '' || o == null)) push('选项里有空串', q);
    // 2. answer 是下标，不是值 —— 越界会直接渲染成「正确答案是 undefined」
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      push('answer 不是合法选项下标', q);
    }
    // 3. 题面/解析里漏进 NaN / undefined / Infinity，孩子看得见
    if (/NaN|undefined|Infinity/.test(JSON.stringify(q))) push('字段含 NaN/undefined/Infinity', q);
    if (!String(q.prompt ?? '').trim()) push('题面为空', q);
    if (!String(q.explain ?? '').trim()) push('解析为空', q);
    // 4. 算术自洽：题面是 a op b = ? 时，正确选项必须真的等于算式的值
    const arith = parseArith(q.prompt);
    if (arith) {
      const want = evalArith(arith);
      if (Number(q.options[q.answer]) !== want) push('正确选项与算式不符', q);
      // 小学题库不该出现负数与小数答案（除法另说，本目录保证整除）
      if (want < 0) push('答案为负数', q);
      if (!Number.isInteger(want)) push('答案不是整数', q);
    }
  }
  return bad;
}

describe('全部数学生成器的共同不变量', () => {
  it('生成器数量与注册题型数量一致（新增题型必须两边都登记）', () => {
    // getAvailableMathTypes() 决定 UI 上能选哪些题型，genMathQByType() 决定能不能出题。
    // 两边漏一个，就会出现「面板里有这个选项，选中后一道题都出不来」。
    expect(getAvailableMathTypes()).toHaveLength(MATH_QUESTION_GENERATORS.length);
  });

  for (const gen of MATH_QUESTION_GENERATORS) {
    it(`${gen.name}：${SAMPLES} 道题的选项/下标/算式都自洽`, () => {
      expect(violationsOf(gen as () => Q, SAMPLES)).toEqual([]);
    });
  }

  it('选项数量稳定，且与 EXPECTED_OPTION_COUNT 一致', () => {
    for (const gen of MATH_QUESTION_GENERATORS) {
      const expected = EXPECTED_OPTION_COUNT[gen.name] ?? 4;
      const seen = new Set<number>();
      for (let i = 0; i < 200; i++) seen.add(gen().options.length);
      expect([...seen], `${gen.name} 的选项数量应当恒定`).toEqual([expected]);
    }
  });
});

describe('hard 模式（此前只有 non-hard 被覆盖）', () => {
  it('hard=true 也不产出负数选项与负数答案', () => {
    // 历史修复：hard 下 a>10 时 randInt(10-a, …) 会生成负的加数 b。
    for (let i = 0; i < 2000; i++) {
      const q = genMathQ(true);
      expect(Number(q.options[q.answer])).toBeGreaterThanOrEqual(0);
      const arith = parseArith(q.prompt);
      expect(arith, `hard 题面应当是 a op b = ?：${q.prompt}`).not.toBeNull();
      expect(Number.isFinite(arith!.a), `操作数应为有限数：${q.prompt}`).toBe(true);
      expect(Number.isFinite(arith!.b), `操作数应为有限数：${q.prompt}`).toBe(true);
      expect(arith!.a).toBeGreaterThanOrEqual(0);
      expect(arith!.b).toBeGreaterThanOrEqual(0);
    }
  });

  it('hard 的口算确实比默认模式更难（上限更大）', () => {
    const maxOperand = (hard: boolean) => {
      let max = 0;
      for (let i = 0; i < 3000; i++) {
        const arith = parseArith(genMathQ(hard).prompt);
        expect(arith, '口算题面应当可解析').not.toBeNull();
        max = Math.max(max, arith!.a, arith!.b);
      }
      expect(Number.isFinite(max)).toBe(true); // NaN 会一路传染到比较，先在这里拦住
      return max;
    };
    expect(maxOperand(true)).toBeGreaterThan(maxOperand(false));
  });
});

describe('题型注册表', () => {
  it('每个已登记题型都能出题，且科目是数学', () => {
    for (const type of getAvailableMathTypes()) {
      const q = genMathQByType(type);
      expect(q, `题型 ${type} 注册了却出不了题`).not.toBeNull();
      expect(q!.subject).toBe('数学');
      expect(violationsOf(() => genMathQByType(type) as Q, 60)).toEqual([]);
    }
  });

  it('未知题型返回 null 而不是抛错或随便出一道题', () => {
    for (const t of ['', 'nope', 'BASIC', '数学', 'basic ']) {
      expect(genMathQByType(t), `未知题型 ${JSON.stringify(t)} 应当返回 null`).toBeNull();
    }
  });
});

describe('genRandomMathQ', () => {
  it('随机抽题 300 次都产出可用题目，且覆盖到多个题型', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const q = genRandomMathQ();
      expect(q.subject).toBe('数学');
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      kinds.add(q.prompt);
    }
    expect(kinds.size).toBeGreaterThan(50); // 只出同一道题 = 抽取逻辑坏了
  });

  it('hard=true 一路透传到基础口算（别让参数在分发处丢掉）', () => {
    // genRandomMathQ 只对 genMathQ 传 hard；若分发写错，这里会退回默认上限 10。
    let sawBig = false;
    for (let i = 0; i < 4000 && !sawBig; i++) {
      const q = genRandomMathQ(true);
      const arith = parseArith(q.prompt);
      if (arith && (arith.a > 10 || arith.b > 10)) sawBig = true;
    }
    expect(sawBig).toBe(true);
  });
});
