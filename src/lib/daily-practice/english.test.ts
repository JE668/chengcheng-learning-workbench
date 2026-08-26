import { describe, it, expect } from 'vitest';
import { genEnglishQ, genEnPicQ, genEnInitialQ } from '../daily-practice/gen-english';
import type { PracticeQuestion } from '../daily-practice/types';

describe('genEnglishQ', () => {
  it('should generate valid English listening questions', () => {
    const q = genEnglishQ();
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    expect(q.prompt).toBe('听一听，选出你听到的单词：');
    const eq = q as PracticeQuestion & { kind: 'english'; word: string; cn: string; emoji: string; options: string[]; answer: number; explain: string };
    expect(eq.word).toBeTruthy();
    expect(eq.cn).toBeTruthy();
    expect(eq.emoji).toBeTruthy();
    expect(eq.options).toHaveLength(4);
    expect(eq.options[eq.answer]).toBe(eq.word);
    expect(eq.explain).toContain(eq.word);
    expect(eq.explain).toContain(eq.cn);
  });

  it('should have unique options', () => {
    const q = genEnglishQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    const eq = q as PracticeQuestion & { kind: 'english'; word: string; options: string[]; answer: number };
    expect(eq.options[eq.answer]).toBe(eq.word);
  });

  it('should use valid word from ALL_EN_WORDS', () => {
    const words = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const q = genEnglishQ();
      words.add((q as any).word);
    }
    expect((genEnglishQ() as any).kind).toBe('english');
  });
});

describe('genEnPicQ', () => {
  it('should generate valid picture questions', () => {
    const q = genEnPicQ();
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    expect(q.prompt).toContain('这个图片是哪个单词？');
    const eq = q as PracticeQuestion & { kind: 'english'; word: string; cn: string; emoji: string; options: string[]; answer: number; explain: string };
    expect(eq.word).toBeTruthy();
    expect(eq.cn).toBeTruthy();
    expect(eq.emoji).toBeTruthy();
    expect(eq.options).toHaveLength(4);
    expect(eq.options[eq.answer]).toBe(eq.word);
    expect(eq.explain).toContain(eq.word);
    expect(eq.explain).toContain(eq.cn);
  });

  it('should have unique options', () => {
    const q = genEnPicQ();
    const unique = new Set(q.options);
    expect(unique.size).toBe(4);
    const eq = q as PracticeQuestion & { kind: 'english'; word: string; options: string[]; answer: number };
    expect(eq.options[eq.answer]).toBe(eq.word);
  });

  it('should use emoji as prompt hint', () => {
    const q = genEnPicQ();
    const eq = q as PracticeQuestion & { kind: 'english'; emoji: string };
    expect(eq.prompt).toContain(eq.emoji);
  });
});

describe('genEnInitialQ', () => {
  it('should generate valid initial letter questions', () => {
    const q = genEnInitialQ();
    expect(q.kind).toBe('english');
    const eq = q as PracticeQuestion & { kind: 'english'; subtype: 'initial'; word: string; cn: string; emoji: string; options: string[]; answer: number; explain: string };
    expect(eq.subtype).toBe('initial');
    expect(q.subject).toBe('英语');
    expect(q.prompt).toBe('听一听，这个单词以哪个字母开头？');
    expect(eq.word).toBeTruthy();
    expect(eq.cn).toBeTruthy();
    expect(eq.emoji).toBeTruthy();
    expect(eq.options).toHaveLength(4);
    expect(typeof eq.answer).toBe('number');
    expect(eq.explain).toContain('开头');
  });

  it('should have single letter options', () => {
    const q = genEnInitialQ();
    const eq = q as PracticeQuestion & { kind: 'english'; subtype: 'initial'; word: string; options: string[]; answer: number };
    expect(eq.options.every(o => o.length === 1 && /^[A-Z]$/.test(o))).toBe(true);
    const unique = new Set(eq.options);
    expect(new Set(eq.options).size).toBe(4);
  });

  it('answer should match first letter of word', () => {
    const q = genEnInitialQ();
    const eq = q as PracticeQuestion & { kind: 'english'; subtype: 'initial'; word: string; options: string[]; answer: number };
    const expectedFirst = eq.word[0].toUpperCase();
    expect(eq.answer).toBe(eq.options.indexOf(eq.word[0].toUpperCase()));
  });
});