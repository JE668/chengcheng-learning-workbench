// @vitest-environment node
/**
 * units.ts 派生层的机械校验。
 *
 * 这一层是「从课本生字表推出来」的数据（笔顺字表、单元统计、组词题），
 * 没有手写清单可对照 —— 所以更适合用**不变量**去守：
 *
 * 1. textbookCharsUpTo(n) 必须单调不减，且等于 chapter ≤ n 的实际条数
 * 2. CHAR_UNIT_OPTIONS 的 count 必须等于 strokeOrderByChapter 的实际条数
 *    （两处各自 filter 一次，容易只改一处）
 * 3. buildUnitWordItems 必须守住 WORD_FORM 的**铁律**：
 *    正确词一定含该字、**干扰词一个都不能含该字**（否则它也是正确答案）
 */
import { describe, expect, it } from 'vitest';
import {
  CHAR_UNIT_OPTIONS,
  GRADE1_CHAR_UNITS,
  TEXTBOOK_CHARACTERS,
  buildUnitWordItems,
  strokeOrderByChapter,
  textbookCharsUpTo,
} from '../study-data';

const CHAPTERS = [...new Set(GRADE1_CHAR_UNITS.map((u) => u.chapter))].sort((a, b) => a - b);

describe('派生层 · 笔顺字表与单元统计', () => {
  it('textbookCharsUpTo(n) 单调不减，且等于 chapter ≤ n 的实际条数', () => {
    let prev = -1;
    for (const c of CHAPTERS) {
      const got = textbookCharsUpTo(c).length;
      const want = TEXTBOOK_CHARACTERS.filter((x) => x.chapter <= c).length;
      expect(got, 'chapter ' + c).toBe(want);
      expect(got).toBeGreaterThanOrEqual(prev);
      prev = got;
    }
  });

  it('CHAPTER 0 表示全册', () => {
    expect(textbookCharsUpTo(999).length).toBe(TEXTBOOK_CHARACTERS.length);
    expect(strokeOrderByChapter(0).length).toBe(TEXTBOOK_CHARACTERS.length);
  });

  it('⚠️ CHAR_UNIT_OPTIONS 的 count 必须与 strokeOrderByChapter 一致', () => {
    const bad = CHAR_UNIT_OPTIONS.filter((o) => o.count !== strokeOrderByChapter(o.chapter).length).map(
      (o) => o.unit + ' 写着 ' + o.count + ' 实际 ' + strokeOrderByChapter(o.chapter).length
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('每个单元选项都要有单元名与 emoji', () => {
    const bad = CHAR_UNIT_OPTIONS.filter((o) => !o.unit?.trim() || !o.emoji?.trim()).map((o) => String(o.chapter));
    expect(bad).toEqual([]);
  });
});

describe('派生层 · 组词题', () => {
  it('⚠️ 铁律：正确词必含该字、干扰词一个都不能含该字', () => {
    const bad: string[] = [];
    for (const it of buildUnitWordItems()) {
      if (!it.word.includes(it.char)) bad.push(it.char + ' 的正确词「' + it.word + '」不含该字');
      for (const w of it.wrongWords) {
        if (w.includes(it.char)) bad.push(it.char + ' 的干扰词「' + w + '」也含该字 → 同样是正确答案');
      }
    }
    expect([...new Set(bad)].slice(0, 6), JSON.stringify([...new Set(bad)].slice(0, 6))).toEqual([]);
  });

  it('每题 3 个互不相同的干扰词，且都不等于正确词', () => {
    const bad: string[] = [];
    for (const it of buildUnitWordItems()) {
      if (it.wrongWords.length !== 3) bad.push(it.char + ' 干扰词不是 3 个');
      if (new Set(it.wrongWords).size !== 3) bad.push(it.char + ' 干扰词有重复');
      if (it.wrongWords.includes(it.word)) bad.push(it.char + ' 干扰词里出现了正确词');
    }
    expect(bad.slice(0, 6)).toEqual([]);
  });

  it('(字, 词) 组合不得重复', () => {
    const items = buildUnitWordItems();
    const keys = items.map((i) => i.char + '|' + i.word);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
