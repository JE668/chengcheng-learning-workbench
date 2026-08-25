import { describe, it, expect } from 'vitest';
import { passThreshold } from '../daily-practice/types';

describe('passThreshold', () => {
  it('should pass when correct >= 80% (ceil)', () => {
    expect(passThreshold(4, 5)).toBe(true);  // 80% - need 4, got 4
    expect(passThreshold(4, 4)).toBe(true);  // 100% - need 4, got 4
    expect(passThreshold(1, 1)).toBe(true);  // 100%
    expect(passThreshold(8, 10)).toBe(true); // 80% - need 8, got 8
  });

  it('should fail when correct < 80% (ceil)', () => {
    expect(passThreshold(3, 5)).toBe(false); // 60% - need 4, got 3
    expect(passThreshold(2, 3)).toBe(false); // ceil(2.4)=3, need 3, got 2
    expect(passThreshold(0, 5)).toBe(false); // 0%
    expect(passThreshold(3, 4)).toBe(false); // ceil(3.2)=4, need 4, got 3
    expect(passThreshold(2, 4)).toBe(false); // ceil(3.2)=4, need 4, got 2
  });

  it('should handle edge cases', () => {
    expect(passThreshold(0, 0)).toBe(false); // total <= 0
    expect(passThreshold(5, 0)).toBe(false); // total <= 0
  });
});

describe('passThreshold edge cases', () => {
  it('1题需对1题', () => {
    expect(passThreshold(1, 1)).toBe(true);
    expect(passThreshold(0, 1)).toBe(false);
  });

  it('2题需对2题 (ceil(1.6)=2)', () => {
    expect(passThreshold(2, 2)).toBe(true);
    expect(passThreshold(1, 2)).toBe(false);
  });

  it('3题需对3题 (ceil(2.4)=3)', () => {
    expect(passThreshold(3, 3)).toBe(true);
    expect(passThreshold(2, 3)).toBe(false);
  });

  it('4题需对4题 (ceil(3.2)=4)', () => {
    expect(passThreshold(4, 4)).toBe(true);
    expect(passThreshold(3, 4)).toBe(false);
    expect(passThreshold(2, 4)).toBe(false);
  });

  it('5题需对4题 (ceil(4.0)=4)', () => {
    expect(passThreshold(4, 5)).toBe(true);
    expect(passThreshold(3, 5)).toBe(false);
  });

  it('6题需对5题 (ceil(4.8)=5)', () => {
    expect(passThreshold(5, 6)).toBe(true);
    expect(passThreshold(4, 6)).toBe(false);
  });

  it('10题需对8题 (ceil(8.0)=8)', () => {
    expect(passThreshold(8, 10)).toBe(true);
    expect(passThreshold(7, 10)).toBe(false);
  });
});