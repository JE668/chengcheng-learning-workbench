/**
 * 出题器正确性回归测试（对应全量审查发现的 P0 缺陷）。
 *
 * 覆盖两个「100% 可复现」的数学逻辑缺陷：
 *
 * 1. **分与合题选项重复**：原实现把 pairs 全量映射成干扰项（**含 pairs[0]，
 *    即正确项本身**），又单独把 correct 塞进数组 → 同一表达式出现 2~3 次，
 *    干扰项彻底失效，孩子点第二份相同答案会被判错。实测重复率 59%~100%。
 *
 * 2. **减法去括号产出负数答案**：`b = a - c + randInt(5, 30)` 无上界，
 *    导致 `a - b` 中间结果与最终答案出现负数 —— 一年级题目不该出现负数。
 *
 * 这些断言在修复前必然失败。
 */
import { describe, it, expect } from 'vitest';
import { genSplitQ } from './gen-math';
import { genSubtractionParensQ } from '../algorithm/generators';

describe('genSplitQ · 分与合题选项唯一性（P0 回归）', () => {
  it('选项互不重复（修复前重复率 59%~100%，此项必然失败）', () => {
    for (let i = 0; i < 500; i++) {
      const q = genSplitQ();
      const uniq = new Set(q.options);
      expect(uniq.size, `出现重复选项: ${JSON.stringify(q.options)}`).toBe(q.options.length);
    }
  });

  it('正确答案只出现一次，且只有一份', () => {
    for (let i = 0; i < 500; i++) {
      const q = genSplitQ();
      expect(q.answer).toBeGreaterThanOrEqual(0);
      // 正确项在选项里的出现次数必须恰好为 1
      const correctText = q.options[q.answer];
      const occurrences = q.options.filter((o) => o === correctText).length;
      expect(occurrences, `正确项重复出现: ${JSON.stringify(q.options)}`).toBe(1);
    }
  });

  it('始终产出 4 个选项，且 answer 指向的表达式确实等于 num', () => {
    for (let i = 0; i < 300; i++) {
      const q = genSplitQ();
      expect(q.options).toHaveLength(4);
      const picked = q.options[q.answer];
      const m = picked.match(/^(\d+)\+(\d+)$/);
      expect(m, `选项格式异常: ${picked}`).not.toBeNull();
      const num = Number(q.prompt.match(/^(\d+)/)?.[1]);
      expect(Number(m![1]) + Number(m![2]), `拆分不等于总数: ${picked}`).toBe(num);
    }
  });

  it('恰好一个选项是正确的分法（干扰项的和必须 ≠ num）', () => {
    for (let i = 0; i < 500; i++) {
      const q = genSplitQ();
      const num = Number(q.prompt.match(/^(\d+)/)?.[1]);
      const valid = q.options.filter((opt) => {
        const m = opt.match(/^(\d+)\+(\d+)$/);
        return m ? Number(m[1]) + Number(m[2]) === num : false;
      });
      // num=5 时 1+4 与 2+3 都成立，若两者同时出现，孩子点任一都会被判错
      expect(valid.length, `出现多个正确答案: ${JSON.stringify(q.options)} (num=${num})`).toBe(1);
      // 且那唯一正确项必须正好落在 answer 下标上
      expect(q.options[q.answer]).toBe(valid[0]);
    }
  });
});

describe('genSubtractionParensQ · 减法去括号不出负数（P0 回归）', () => {
  it('答案恒为非负数（修复前 20 万次抽样中 5.53% 为负）', () => {
    for (let i = 0; i < 3000; i++) {
      const q = genSubtractionParensQ(5);
      expect(q.answer, `出现负数答案: ${q.prompt} = ${q.answer}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('各步骤 inputs 的 expectedValue 恒为非负（修复前 38.38% 中间值为负）', () => {
    for (let i = 0; i < 2000; i++) {
      const q = genSubtractionParensQ(5);
      for (const step of q.stepFields) {
        for (const input of step.inputs) {
          if (input.expectedValue === undefined || input.expectedValue === null) continue;
          expect(
            Number(input.expectedValue),
            `步骤 ${step.id} (${step.title}) 出现负数: ${step.display}`
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('a - (b - c) 的展开式与答案自洽', () => {
    for (let i = 0; i < 2000; i++) {
      const q = genSubtractionParensQ(5);
      const m = q.prompt.match(/(\d+)\s*-\s*\((\d+)\s*-\s*(\d+)\)/);
      if (!m) continue;
      const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
      // a - (b - c) === a - b + c
      expect(q.answer).toBe(a - b + c);
      // 括号内也应非负（避免第一步就教负数）
      expect(b - c).toBeGreaterThanOrEqual(0);
    }
  });
});
describe('genBreakingTenQ · 破十法题型有效（P1 回归）', () => {
  it('减数不超过个位（破十法的前提：个位不够减才需借 10）', async () => {
    const { genBreakingTenQ } = await import('../algorithm/generators');
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 200; i++) {
        const q = genBreakingTenQ(level);
        const m = q.prompt.match(/(\d+)\s*-\s*(\d+)/);
        expect(m, `题目格式异常: ${q.prompt}`).not.toBeNull();
        const a = Number(m![1]);
        const b = Number(m![2]);
        // 破十法：减数不得超过个位
        expect(b, `减数 ${b} 超过个位 ${a % 10}: ${q.prompt}`).toBeLessThanOrEqual(a % 10);
        // 且至少为 1
        expect(b).toBeGreaterThanOrEqual(1);
        // 答案必须正确
        expect(q.answer).toBe(a - b);
      }
    }
  });

  it('不再出现 a=11 的退化题（个位为 1 时无题可出，应重新取样）', async () => {
    const { genBreakingTenQ } = await import('../algorithm/generators');
    for (let i = 0; i < 5000; i++) {
      const q = genBreakingTenQ(10);
      const m = q.prompt.match(/^(\d+)\s*-/);
      if (m) {
        expect(Number(m[1]), `出现了 a=11 的退化题: ${q.prompt}`).not.toBe(11);
      }
    }
  });

  it('减数分布不集中在单一档位（修复前 b=1 独占约 30%）', async () => {
    const { genBreakingTenQ } = await import('../algorithm/generators');
    const dist = new Map<number, number>();
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const q = genBreakingTenQ(10);
      const m = q.prompt.match(/\d+\s*-\s*(\d+)/);
      if (!m) continue;
      const b = Number(m[1]);
      dist.set(b, (dist.get(b) ?? 0) + 1);
    }
    expect(dist.size, `减数只出现了 ${dist.size} 种`).toBeGreaterThanOrEqual(5);
    for (const [b, cnt] of dist) {
      expect(cnt / N, `b=${b} 占比 ${((cnt / N) * 100).toFixed(1)}% 过于集中`).toBeLessThan(0.3);
    }
  });
});
