// @vitest-environment node
/**
 * 乘法口诀表（孩子直接读的那张表）必须逐条正确。
 *
 * 表里的每一格都是 juci(a, b) 生成的，共 45 条（小数在前）。
 * 这里把标准 45 条作为「标准答案」逐条比对 —— 口诀错一个字，
 * 孩子背下来的就是错的。
 */
import { describe, expect, it } from 'vitest';
import { juci, productWord } from './MathTable';

/** 标准九九乘法口诀（小数在前），共 45 条 */
const STANDARD = [
  '一一得一',
  '一二得二',
  '一三得三',
  '一四得四',
  '一五得五',
  '一六得六',
  '一七得七',
  '一八得八',
  '一九得九',
  '二二得四',
  '二三得六',
  '二四得八',
  '二五一十',
  '二六十二',
  '二七十四',
  '二八十六',
  '二九十八',
  '三三得九',
  '三四十二',
  '三五十五',
  '三六十八',
  '三七二十一',
  '三八二十四',
  '三九二十七',
  '四四十六',
  '四五二十',
  '四六二十四',
  '四七二十八',
  '四八三十二',
  '四九三十六',
  '五五二十五',
  '五六三十',
  '五七三十五',
  '五八四十',
  '五九四十五',
  '六六三十六',
  '六七四十二',
  '六八四十八',
  '六九五十四',
  '七七四十九',
  '七八五十六',
  '七九六十三',
  '八八六十四',
  '八九七十二',
  '九九八十一',
];

describe('乘法口诀表', () => {
  it('⚠️ 45 条口诀必须与标准完全一致', () => {
    const got: string[] = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = a; b <= 9; b++) got.push(juci(a, b));
    }
    expect(got.length).toBe(45);
    const wrong = got
      .map((g, i) => (g === STANDARD[i] ? null : STANDARD[i] + ' → 实际 ' + g))
      .filter(Boolean);
    expect(wrong, JSON.stringify(wrong)).toEqual([]);
  });

  it('⚠️ 口诀不得重复（重复说明两条口诀算成同一句）', () => {
    const all: string[] = [];
    for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) all.push(juci(a, b));
    const dup = [...new Set(all.filter((v, i) => all.indexOf(v) !== i))];
    expect(dup).toEqual([]);
  });

  it('乘积读法：10 读「一十」、12 读「十二」、20 读「二十」、25 读「二十五」', () => {
    expect(productWord(10)).toBe('一十');
    expect(productWord(12)).toBe('十二');
    expect(productWord(20)).toBe('二十');
    expect(productWord(25)).toBe('二十五');
    expect(productWord(9)).toBe('九');
  });

  it('交换两个因数，口诀不变（小数在前）', () => {
    const bad: string[] = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        if (juci(a, b) !== juci(b, a)) bad.push(a + ',' + b);
      }
    }
    expect(bad).toEqual([]);
  });
});
