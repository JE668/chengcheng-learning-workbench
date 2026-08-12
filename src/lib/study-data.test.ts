import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHARACTERS,
  CHINESE_UNITS,
  EN_UNITS,
  EN_WORD_TOPICS,
  GRADE1_CHAR_UNITS,
  MATH_UNITS,
  STROKE_ORDER_CHARS,
  TEXTBOOK_CHARACTERS,
  WORD_FORM,
  buildUnitWordItems,
  strokeOrderByChapter,
  textbookCharsUpTo,
} from '@/lib/study-data';
import { TEXTBOOKS } from '@/lib/textbooks';

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

describe('语文 · 拼音与笔顺（跟生字表同源）', () => {
  it('每个字都有带声调的拼音', () => {
    const toneMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]|[aeiouv]/i;
    for (const c of CHARACTERS) {
      expect(c.pinyin, `${c.char} 缺拼音`).toBeTruthy();
      expect(c.pinyin, `${c.char} 拼音里不该有空格`).not.toContain(' ');
      expect(toneMark.test(c.pinyin), `${c.char} 的拼音「${c.pinyin}」不像拼音`).toBe(true);
    }
  });

  it('笔顺字表覆盖全册生字，且都带音带义', () => {
    expect(STROKE_ORDER_CHARS.length).toBe(TEXTBOOK_CHARACTERS.length);
    expect(STROKE_ORDER_CHARS.length).toBeGreaterThan(200);
    for (const s of STROKE_ORDER_CHARS) {
      expect(s.py, `${s.char} 缺拼音`).toBeTruthy();
      expect(s.mean, `${s.char} 缺释义`).toBeTruthy();
    }
  });

  it('按单元取笔顺字，加起来正好是全册', () => {
    const sum = GRADE1_CHAR_UNITS.reduce((n, u) => n + strokeOrderByChapter(u.chapter).length, 0);
    expect(sum).toBe(STROKE_ORDER_CHARS.length);
    expect(strokeOrderByChapter(0).length).toBe(STROKE_ORDER_CHARS.length); // 0 = 全册
  });
});

describe('英语 · 单元与词表对齐', () => {
  it('每个主题都归到了某个单元（不然那批词在单元通关里刷不到）', () => {
    const inUnits = new Set(EN_UNITS.flatMap((u) => u.topics));
    for (const topic of Object.keys(EN_WORD_TOPICS)) {
      expect(inUnits.has(topic), `主题「${topic}」没有归入任何单元`).toBe(true);
    }
  });

  it('单元里引用的主题都真实存在，且不重复归属', () => {
    const seen = new Set<string>();
    for (const u of EN_UNITS) {
      expect(u.topics.length, `${u.unit} 没有词表`).toBeGreaterThan(0);
      for (const t of u.topics) {
        expect(EN_WORD_TOPICS[t], `${u.unit} 引用了不存在的主题「${t}」`).toBeTruthy();
        expect(seen.has(t), `主题「${t}」被多个单元重复引用`).toBe(false);
        seen.add(t);
      }
    }
  });
});

describe('数学 · 课本单元与练习模块对齐', () => {
  // 直接读源码取 key，避免在 node 测试环境里 import 一堆 React 组件
  const src = readFileSync(resolve(process.cwd(), 'src/lib/study-modules.ts'), 'utf8');
  const mathBlock = src.slice(src.indexOf('  math: ['), src.indexOf('\n  ],', src.indexOf('  math: [')));
  const mathKeys = Array.from(mathBlock.matchAll(/key: '(.+?)'/g)).map((m) => m[1]);

  it('单元编号与课本章节一一对应', () => {
    const chapters = TEXTBOOKS.find((t) => t.key === 'math')!.chapters.map((c) => c.idx);
    expect(MATH_UNITS.map((u) => u.chapter)).toEqual(chapters);
  });

  it('单元引用的模块 key 都真实存在', () => {
    expect(mathKeys.length).toBeGreaterThan(10);
    for (const u of MATH_UNITS) {
      expect(u.moduleKeys.length, `${u.unit} 没挂练习`).toBeGreaterThan(0);
      for (const k of u.moduleKeys) {
        expect(mathKeys.includes(k), `第 ${u.chapter} 单元引用了不存在的模块「${k}」`).toBe(true);
      }
    }
  });

  it('每个数学模块至少归到一个单元，别有练习被漏掉', () => {
    const used = new Set(MATH_UNITS.flatMap((u) => u.moduleKeys));
    for (const k of mathKeys) {
      expect(used.has(k), `模块「${k}」没归入任何课本单元`).toBe(true);
    }
  });
});

describe('语文 · 课本单元与练习模块对齐', () => {
  const src = readFileSync(resolve(process.cwd(), 'src/lib/study-modules.ts'), 'utf8');
  const chineseBlock = src.slice(src.indexOf("  chinese: ["), src.indexOf('\n  ],', src.indexOf('  chinese: [')));
  const chineseKeys = Array.from(chineseBlock.matchAll(/key: '(.+?)'/g)).map((m) => m[1]);

  it('单元与 GRADE1_CHAR_UNITS 章节一一对应', () => {
    const chapters = GRADE1_CHAR_UNITS.map((u) => u.chapter);
    expect(CHINESE_UNITS.map((u) => u.chapter)).toEqual(chapters);
  });

  it('单元引用的模块 key 都真实存在', () => {
    expect(chineseKeys.length).toBeGreaterThan(10);
    for (const u of CHINESE_UNITS) {
      expect(u.moduleKeys.length, `${u.unit} 没挂练习`).toBeGreaterThan(0);
      for (const k of u.moduleKeys) {
        expect(chineseKeys.includes(k), `第 ${u.chapter} 单元引用了不存在的模块「${k}」`).toBe(true);
      }
    }
  });

  it('每个语文模块至少归到一个单元，别有练习被漏掉', () => {
    const used = new Set(CHINESE_UNITS.flatMap((u) => u.moduleKeys));
    for (const k of chineseKeys) {
      expect(used.has(k), `模块「${k}」没归入任何课本单元`).toBe(true);
    }
  });
});
