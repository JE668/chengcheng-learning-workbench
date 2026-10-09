// @vitest-environment node
/**
 * 退位减法（BorrowModule）出题正确性。
 *
 * ## 已修的问题
 * genBorrow 原来会生成**重复题目**：满足「11~18 减 1~9 且真退位」的组合只有 36 种，
 * 可重复地抽 10 题时 P(至少一次重复) ≈ 1 - exp(-45/36) ≈ **0.71** ——
 * 也就是约七成回合里，同一道题会在同一轮出现两次。已按 (a,b) 去重。
 *
 * ## 同时守住「退位」的语义
 * 这道练习的意义是「个位不够减、要向十位借 1」，
 * 所以每题都必须真的满足 a % 10 < b；否则孩子练的就不是退位减法。
 */
import { describe, expect, it } from 'vitest';
import { genBorrow } from './MathRegroup';

describe('退位减法出题', () => {
  it('⚠️ 每题都必须是真的退位（个位不够减）', () => {
    const bad: string[] = [];
    for (let i = 0; i < 200; i++) {
      for (const q of genBorrow()) {
        if (!(q.a % 10 < q.b)) bad.push(q.a + '-' + q.b + ' 不需要退位');
        if (!(q.b < q.a)) bad.push(q.a + '-' + q.b + ' 结果为负');
        if (q.a < 11 || q.a > 18) bad.push(q.a + ' 超出 11~18');
        if (q.b < 1 || q.b > 9) bad.push(q.b + ' 超出 1~9');
        if (q.op !== '-') bad.push('运算符不是减号');
      }
    }
    expect([...new Set(bad)].slice(0, 5)).toEqual([]);
  });

  it('⚠️ 一轮 10 题不得重复', () => {
    const bad: string[] = [];
    for (let i = 0; i < 200; i++) {
      const qs = genBorrow();
      if (qs.length !== 10) bad.push('只出了 ' + qs.length + ' 题');
      const keys = qs.map((q) => q.a + '-' + q.b);
      if (new Set(keys).size !== keys.length) bad.push('有重复题：' + JSON.stringify(keys));
    }
    expect([...new Set(bad)].slice(0, 3)).toEqual([]);
  });

  it('答案就是 a - b，且都在 0~20 内', () => {
    for (let i = 0; i < 100; i++) {
      for (const q of genBorrow()) {
        const ans = q.a - q.b;
        expect(ans).toBeGreaterThan(0);
        expect(ans).toBeLessThan(20);
      }
    }
  });
});
