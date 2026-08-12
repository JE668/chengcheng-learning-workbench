import { describe, expect, it } from 'vitest';
import {
  GRADE1_CHAR_UNITS,
  TEXTBOOK_CHARACTERS,
  WORD_FORM,
  buildUnitWordItems,
  textbookCharsUpTo,
} from '@/lib/study-data';

/**
 * 组词题的铁律：干扰词绝不能含被组词的那个字。
 * 否则干扰词也是正确答案，孩子答对反而被判错（旧数据真踩过这个坑）。
 */
describe('语文 · 组词题数据', () => {
  it('WORD_FORM：正确词含该字，干扰词一律不含', () => {
    for (const it of WORD_FORM) {
      expect(it.word, `${it.char} 的正确词`).toContain(it.char);
      for (const w of it.wrongWords) {
        expect(w.includes(it.char), `${it.char} 的干扰词「${w}」含了该字`).toBe(false);
      }
      const opts = [it.word, ...it.wrongWords];
      expect(new Set(opts).size, `${it.char} 的选项有重复`).toBe(opts.length);
    }
  });

  it('生字表派生的组词题同样守规则，且四个选项互不相同', () => {
    const items = buildUnitWordItems();
    expect(items.length).toBeGreaterThan(50);
    for (const it of items) {
      expect(it.word, `${it.char} 的正确词`).toContain(it.char);
      expect(it.wrongWords).toHaveLength(3);
      for (const w of it.wrongWords) {
        expect(w.includes(it.char), `${it.char} 的干扰词「${w}」含了该字`).toBe(false);
      }
      const opts = [it.word, ...it.wrongWords];
      expect(new Set(opts).size, `${it.char} 的选项有重复`).toBe(opts.length);
    }
  });
});

describe('语文 · 识字闯关题库（跟课本生字表同源）', () => {
  it('题库里的字都来自生字表，且不重复', () => {
    const inTable = new Set(GRADE1_CHAR_UNITS.flatMap((u) => u.chars));
    const seen = new Set<string>();
    for (const c of TEXTBOOK_CHARACTERS) {
      expect(inTable.has(c.char), `${c.char} 不在生字表里`).toBe(true);
      expect(seen.has(c.char), `${c.char} 重复出题`).toBe(false);
      seen.add(c.char);
      expect(c.meaning.length).toBeGreaterThan(0);
    }
  });

  it('各难度题库都够出「1 正确 + 3 干扰」', () => {
    for (const pool of [textbookCharsUpTo(2), textbookCharsUpTo(7), TEXTBOOK_CHARACTERS]) {
      expect(pool.length).toBeGreaterThanOrEqual(4);
      // 释义撞车会让干扰项也变成正确答案，入门段尤其要够多不同释义
      expect(new Set(pool.map((c) => c.meaning)).size).toBeGreaterThanOrEqual(4);
    }
  });
});
