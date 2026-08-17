import { describe, expect, it } from 'vitest';
import { passThreshold } from '@/lib/daily-practice';

/**
 * 每日一练单科通过门槛 = 正确题数 ≥ 总题数 × 80%（ceil 向上取整）。
 * 覆盖「允许错 1 题」的真正边界，防止判定逻辑被悄悄改坏。
 */
describe('passThreshold：每日一练 80% 通过门槛', () => {
  it('0 题直接不通过', () => {
    expect(passThreshold(0, 0)).toBe(false);
  });

  it('单题：对 1 题通过，对 0 题不通过', () => {
    expect(passThreshold(1, 1)).toBe(true);
    expect(passThreshold(0, 1)).toBe(false);
  });

  it('5 题：对 4 题通过（允许错 1 题），对 3 题不通过', () => {
    expect(passThreshold(4, 5)).toBe(true);
    expect(passThreshold(3, 5)).toBe(false);
  });

  it('10 题：对 8 题通过，对 7 题不通过', () => {
    expect(passThreshold(8, 10)).toBe(true);
    expect(passThreshold(7, 10)).toBe(false);
  });

  it('3 题：ceil(3×0.8)=3，必须全对才通过（错 1 题不通过）', () => {
    expect(passThreshold(3, 3)).toBe(true);
    expect(passThreshold(2, 3)).toBe(false);
  });

  it('正确数恰好等于阈值边界（ceil）时通过', () => {
    // ceil(7×0.8)=6、ceil(9×0.8)=8、ceil(20×0.8)=16
    expect(passThreshold(6, 7)).toBe(true);
    expect(passThreshold(8, 9)).toBe(true);
    expect(passThreshold(16, 20)).toBe(true);
  });
});
