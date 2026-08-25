import { describe, it, expect } from 'vitest';
import { genEnglishQ, genEnPicQ, genEnInitialQ } from '../daily-practice/gen-english';

describe('genEnglishQ', () => {
  it('should generate valid English listening questions', () => {
    const q = genEnglishQ();
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    expect(q.prompt).toBe('听一听，选出你听到的单词：');
    expect(q.word).toBeTruthy();
    expect(q.cn).toBeTruthy();
    expect(q.emoji).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBe(q.word);
    expect(q.explain).toContain(q.word);
    expect(q.explain).toContain(q.cn);
  });

  it('should have unique options', () => {
    const q = genEnglishQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    expect(q.options[q.answer]).toBe(q.word);
  });

  it('should use valid word from ALL_EN_WORDS', () => {
    const words = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const q = genEnglishQ();
      words.add(q.word);
    }
    expect(words.size).toBeGreaterThan(1);
  });
});

describe('genEnPicQ', () => {
  it('should generate valid picture questions', () => {
    const q = genEnPicQ();
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    expect(q.prompt).toContain('这个图片是哪个单词？');
    expect(q.word).toBeTruthy();
    expect(q.cn).toBeTruthy();
    expect(q.emoji).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBe(q.word);
    expect(q.explain).toContain(q.word);
    expect(q.explain).toContain(q.cn);
  });

  it('should have unique options', () => {
    const q = genEnPicQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    expect(q.options[q.answer]).toBe(q.word);
  });

  it('should use emoji as prompt hint', () => {
    const q = genEnPicQ();
    expect(q.prompt).toContain(q.emoji);
  });
});

describe('genEnInitialQ', () => {
  it('should generate valid initial letter questions', () => {
    const q = genEnInitialQ();
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    expect(q.subtype).toBe('initial');
    expect(q.prompt).toBe('听一听，这个单词以哪个字母开头？');
    expect(q.word).toBeTruthy();
    expect(q.cn).toBeTruthy();
    expect(q.emoji).toBeTruthy();
    expect(q.options).toHaveLength(4);
    expect(q.answer).toMatch(/^[A-Z]$/);
    expect(q.explain).toContain('开头');
  });

  it('should have single letter options', () => {
    const q = genEnInitialQ();
    expect(q.options.every(o => o.length === 1 && /^[A-Z]$/.test(o))).toBe(true);
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
  });

  it('answer should match first letter of word', () => {
    const q = genEnInitialQ();
    const expectedFirst = q.word[0].toUpperCase();
    expect(q.answer).toBe(expectedFirst);
  });
});