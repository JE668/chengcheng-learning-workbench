import { describe, expect, it } from 'vitest';
import { chainLabel, speakableMath } from './AlgorithmQuiz';

/**
 * 第五轮审查（2026-11-12）回归：chainLabel 曾把「5 = 1 + ?」这类
 * *未定论的拆数式* 提取上链（孩子会看到「5 = 1」的假等式），且 RHS
 * 组遇空格即停，把「63 = 60 + 3」截成「63 = 60」。重写后的语义：
 * 只提取「含 = 且不含 ?」的结论性等式，链式变形等式整条保留。
 */
describe('chainLabel（算法阶梯链的等式提取）', () => {
  it('拆数式（RHS 未定）不上链——曾错误提取出「5 = 1」', () => {
    expect(chainLabel('5 = 1 + ?')).toBeNull();
    expect(chainLabel('15 = 10 + ?')).toBeNull();
    expect(chainLabel('5 = 3 + ?')).toBeNull();
  });

  it('求值式（等号右侧是 ?）不上链', () => {
    expect(chainLabel('9 + 1 = ?')).toBeNull();
    expect(chainLabel('10 - 3 = ?')).toBeNull();
    expect(chainLabel('15 - (6 - 3) = ?')).toBeNull();
  });

  it('结论性等式完整提取（不被空格截断）', () => {
    expect(chainLabel('10 + 4 = 14')).toBe('10 + 4 = 14');
    expect(chainLabel('63 = 60 + 3')).toBe('63 = 60 + 3');
    expect(chainLabel('13 = 10 + 3')).toBe('13 = 10 + 3');
    expect(chainLabel('38 + 45 = 83')).toBe('38 + 45 = 83');
  });

  it('链式变形等式整条上链（symbol-move / subtraction-parens 结论行）', () => {
    expect(chainLabel('52 - 27 + 3 = 52 + 3 - 27 = 55 - 27 = 28')).toBe(
      '52 - 27 + 3 = 52 + 3 - 27 = 55 - 27 = 28'
    );
  });

  it('纯变形（无等号）与描述句返回 null', () => {
    expect(chainLabel('45 + 38')).toBeNull();
    expect(chainLabel('52 - (27 - 3)')).toBeNull();
    expect(chainLabel('把 5 拆成 1 和 4')).toBeNull();
  });

  it('带括号开头的结论式也能提取（adding-parens）', () => {
    expect(chainLabel('(38 + 62) = 100')).toBe('(38 + 62) = 100');
  });
});

/** speakableMath 原有用例在 speakable-math.test.ts；这里补回放脚本的入口形态。 */
describe('speakableMath（回放朗读）', () => {
  it('explain 里的符号也被转换（回放脚本入口）', () => {
    expect(speakableMath('63 - (28 - 4) = 63 - 28 + 4 = 39')).toContain('等于');
  });
});
