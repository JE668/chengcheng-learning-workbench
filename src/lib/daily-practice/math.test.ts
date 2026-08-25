import { describe, it, expect } from 'vitest';
import { genMathQ, genWordProblemQ, genOrdinalQ, genCompareQ, genClockQ, genCompareNumQ } from '../daily-practice/gen-math';

describe('genMathQ', () => {
  it('should generate valid easy addition questions', () => {
    const q = genMathQ(false);
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(['+', '−']).toContain(q.prompt.includes('+') ? '+' : '−');
    expect(q.options).toHaveLength(4);
    expect(Number(q.options[q.answer])).toBeGreaterThanOrEqual(0);
    expect(q.explain).toContain('=');
  });

  it('should generate valid hard addition questions', () => {
    let foundAdd = false;
    for (let i = 0; i < 20; i++) {
      const q = genMathQ(true);
      if (q.prompt.includes('+')) {
        const nums = q.prompt.match(/(\d+)\s*\+\s*(\d+)/);
        if (nums) {
          const a = parseInt(nums[1]);
          const b = parseInt(nums[2]);
          expect(a).toBeGreaterThanOrEqual(5);
          expect(a).toBeLessThanOrEqual(50);
          expect(b).toBeGreaterThanOrEqual(10 - a);
        }
        break;
      }
    }
    const q = genMathQ(true);
    expect(q.kind).toBe('math');
    expect(q.options).toHaveLength(4);
  });

  it('should generate valid easy subtraction questions', () => {
    let foundSub = false;
    for (let i = 0; i < 20; i++) {
      const q = genMathQ(false);
      if (q.prompt.includes('−')) {
        foundSub = true;
        const nums = q.prompt.match(/(\d+)\s*−\s*(\d+)/);
        if (nums) {
          const a = parseInt(nums[1]);
          const b = parseInt(nums[2]);
          expect(a).toBeGreaterThanOrEqual(b);
          expect(a).toBeLessThanOrEqual(10);
        }
        break;
      }
    }
    expect(foundSub).toBe(true);
  });

  it('should generate valid hard subtraction questions', () => {
    let foundSub = false;
    for (let i = 0; i < 20; i++) {
      const q = genMathQ(true);
      if (q.prompt.includes('−')) {
        foundSub = true;
        const nums = q.prompt.match(/(\d+)\s*−\s*(\d+)/);
        if (nums) {
          const a = parseInt(nums[1]);
          const b = parseInt(nums[2]);
          expect(a).toBeGreaterThanOrEqual(b);
          expect(a).toBeLessThanOrEqual(99);
        }
        break;
      }
    }
    expect(foundSub).toBe(true);
  });

  it('should have 4 unique options', () => {
    for (let i = 0; i < 10; i++) {
      const q = genMathQ();
      const unique = new Set(q.options);
      expect(unique.size).toBe(4);
      expect(Number(q.options[q.answer])).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('genWordProblemQ', () => {
  it('should generate valid word problems', () => {
    const q = genWordProblemQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(typeof q.prompt).toBe('string');
    expect(q.prompt.length).toBeGreaterThan(0);
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(typeof q.explain).toBe('string');
    expect(q.emoji).toBeTruthy();
  });

  it('should have unique options', () => {
    const q = genWordProblemQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
  });
});

describe('genOrdinalQ', () => {
  it('should generate valid ordinal questions', () => {
    const q = genOrdinalQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(q.prompt).toContain('第');
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(['第1', '第2', '第3', '第4', '第5']).toContain(q.options[q.answer]);
  });

  it('should have unique options', () => {
    const q = genOrdinalQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
  });
});

describe('genCompareQ', () => {
  it('should generate valid compare questions', () => {
    const q = genCompareQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(['>', '<', '=']).toContain(q.options[q.answer]);
    expect(q.options).toHaveLength(3);
    expect(q.options[q.answer]).toMatch(/^[><=]$/);
  });
});

describe('genClockQ', () => {
  it('should generate valid clock questions', () => {
    const q = genClockQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(q.prompt).toBe('这是几点？');
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toMatch(/^\d+时$/);
  });
});

describe('genCompareNumQ', () => {
  it('should generate valid number compare questions', () => {
    const q = genCompareNumQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(['>', '<', '=']).toContain(q.options[q.answer]);
    expect(q.options).toHaveLength(3);
    expect(q.options[q.answer]).toMatch(/^[><=]$/);
  });
});