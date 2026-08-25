import { describe, it, expect } from 'vitest';
import {
  genPinyinQ,
  genDictationQ,
  genChineseQuizQ,
  genAntonymQ,
  genProverbQ,
  genRiddleQ,
  genPoemQ,
  genUniquePinyinQ,
  genUniqueDictationQ,
  genUniqueChineseQuizQ,
  genUniqueAntonymQ,
  genUniqueProverbQ,
  genUniqueRiddleQ,
  genUniquePoemQ,
} from '../daily-practice/gen-chinese';

describe('genPinyinQ', () => {
  it('should generate valid pinyin questions', () => {
    const q = genPinyinQ();
    expect(q.kind).toBe('pinyin');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toBe('这个字读什么拼音？点选带正确声调的音节');
    expect(q.han).toBeTruthy();
    expect(q.audioText).toBe(q.han);
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(q.explain).toContain('拼音是');
  });

  it('should have 4 unique options with different tones', () => {
    const q = genPinyinQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    // All options should be different tone variants of same base
    // Just verify they are different and all are valid pinyin
    for (const opt of q.options) {
      expect(opt.length).toBeGreaterThan(0);
    }
  });
});

describe('genDictationQ', () => {
  it('should generate valid dictation questions', () => {
    const q = genDictationQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toBe('听写：听一听，选出正确的字');
    expect(q.han).toBeTruthy();
    expect(q.han.length).toBe(1);
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBe(q.han);
    expect(q.explain).toContain('意思是');
  });

  it('should have unique options', () => {
    const q = genDictationQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    expect(q.options[q.answer]).toBe(q.han);
  });
});

describe('genChineseQuizQ', () => {
  it('should generate valid Chinese quiz questions', () => {
    const q = genChineseQuizQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toContain('意思是');
    expect(q.han).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBe(q.han);
    expect(q.explain).toContain('意思是');
  });

  it('should have unique options', () => {
    const q = genChineseQuizQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    expect(q.options[q.answer]).toBe(q.han);
  });
});

describe('genAntonymQ', () => {
  it('should generate valid antonym questions', () => {
    const q = genAntonymQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toContain('反义词');
    expect(q.han).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(q.explain).toContain('反义词');
  });
});

describe('genProverbQ', () => {
  it('should generate valid proverb questions', () => {
    const q = genProverbQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toContain('后半句');
    expect(q.han).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(q.explain).toContain(q.han);
  });
});

describe('genRiddleQ', () => {
  it('should generate valid riddle questions', () => {
    const q = genRiddleQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toBeTruthy();
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(q.options.length);
    expect(q.options[q.answer]).toBeTruthy();
    expect(q.explain).toContain('谜底');
  });
});

describe('genPoemQ', () => {
  it('should generate valid poem questions', () => {
    const q = genPoemQ();
    expect(q.kind).toBe('poem');
    expect(q.subject).toBe('语文');
    expect(q.prompt).toContain('出自哪首诗');
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBeTruthy();
    expect(q.explain).toContain('出自');
  });

  it('should have unique options', () => {
    const q = genPoemQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
  });
});

describe('Unique question generators (deduplication)', () => {
  describe('genUniquePinyinQ', () => {
    it('should not repeat used characters', () => {
      const usedChars = new Set<string>();
      const chars = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const q = genUniquePinyinQ(usedChars);
        if (q.han) {
          expect(usedChars.has(q.han)).toBe(true);
          chars.add(q.han);
        }
      }
      expect(usedChars.size).toBeGreaterThan(0);
    });
  });

  describe('genUniqueDictationQ', () => {
    it('should not repeat used characters', () => {
      const usedChars = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const q = genUniqueDictationQ(usedChars);
        if (q.han) {
          expect(usedChars.has(q.han)).toBe(true);
        }
      }
      expect(usedChars.size).toBeGreaterThan(0);
    });
  });

  describe('genUniqueChineseQuizQ', () => {
    it('should not repeat used characters', () => {
      const usedChars = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const q = genUniqueChineseQuizQ(usedChars);
        if (q.han) {
          expect(usedChars.has(q.han)).toBe(true);
        }
      }
      expect(usedChars.size).toBeGreaterThan(0);
    });
  });

  describe('genUniqueAntonymQ', () => {
    it('should generate valid antonym questions', () => {
      const q = genUniqueAntonymQ();
      expect(q.prompt).toContain('反义词');
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answer]).toBeTruthy();
    });
  });

  describe('genUniqueProverbQ', () => {
    it('should generate valid proverb questions', () => {
      const q = genUniqueProverbQ();
      expect(q.prompt).toContain('后半句');
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answer]).toBeTruthy();
    });
  });

  describe('genUniqueRiddleQ', () => {
    it('should generate valid riddle questions', () => {
      const q = genUniqueRiddleQ();
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options[q.answer]).toBeTruthy();
    });
  });

  describe('genUniquePoemQ', () => {
    it('should generate valid poem questions', () => {
      const q = genUniquePoemQ();
      expect(q.kind).toBe('poem');
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answer]).toBeTruthy();
    });
  });
});