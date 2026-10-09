// @vitest-environment node
/**
 * 谚语题库的结构性护栏。
 *
 * ## 已修的真实错误（本次）
 * 1. 「失败是成功之母」的「后半句」被写成「成功是失败之父」——
 *    **这不是谚语，是为凑配对编出来的**，孩子会学一句假话。
 * 2. 「勤能补拙」与「天道酬勤」是两个各自独立的成语，不是前后句，
 *    却被当成一对（问「勤能补拙的后半句？」答案给「天道酬勤」）。
 *
 * 谚语配对游戏的前提是「真的有前后句」。下面这些检查能挡住结构性问题，
 * 至于「配对是否在语义上成立」需要人工判断（已逐条复核过）。
 */
import { describe, expect, it } from 'vitest';
import { PROVERBS, ANTONYMS, QUANTIFIERS } from '../study-data';

describe('谚语题库', () => {
  it('前半句与后半句都不得为空', () => {
    const bad = PROVERBS.filter((p) => !p.first?.trim() || !p.second?.trim()).map((p) => p.first);
    expect(bad).toEqual([]);
  });

  it('⚠️ 前半句不得重复（重复会让选项出现两个正确答案）', () => {
    const seen = new Map<string, number>();
    for (const p of PROVERBS) seen.set(p.first, (seen.get(p.first) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dup, '重复的前半句：' + JSON.stringify(dup)).toEqual([]);
  });

  it('⚠️ 某个谚语的后半句不得是另一个谚语的前半句（说明句子被切错）', () => {
    const firsts = new Set(PROVERBS.map((p) => p.first));
    const bad = PROVERBS.filter((p) => firsts.has(p.second)).map((p) => p.first + ' / ' + p.second);
    expect(bad, '句界切错了：' + JSON.stringify(bad)).toEqual([]);
  });

  it('每题都要有提示语', () => {
    const bad = PROVERBS.filter((p) => !p.hint?.trim()).map((p) => p.first);
    expect(bad).toEqual([]);
  });
});

describe('反义词与量词题库', () => {
  it('反义词：两个词都不能为空，且不能自己和自己成对', () => {
    const bad = ANTONYMS.filter((x) => !x.a?.trim() || !x.b?.trim() || x.a === x.b).map((x) => x.a);
    expect(bad).toEqual([]);
  });

  it('反义词不得成对重复', () => {
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const x of ANTONYMS) {
      const k = [x.a, x.b].sort().join('/');
      if (seen.has(k)) dup.push(k);
      seen.add(k);
    }
    expect(dup).toEqual([]);
  });

  it('量词：correct 必须在该题的 options 里，且 options 不得重复', () => {
    const bad: string[] = [];
    for (const q of QUANTIFIERS) {
      if (!q.options.includes(q.correct)) bad.push(q.item + ' 的正确答案不在选项中');
      if (new Set(q.options).size !== q.options.length) bad.push(q.item + ' 选项有重复');
    }
    expect(bad).toEqual([]);
  });
});
