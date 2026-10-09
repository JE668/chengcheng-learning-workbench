// @vitest-environment node
/**
 * 连词成句的结构护栏。
 *
 * 组件判断正解的方式是：把选中的词按顺序拼起来 === answer。
 * 所以 **words 里所有词拼起来必须正好等于 answer** —— 少一个字、多一个字、
 * 某个字写错，孩子就永远拼不出答案。
 *
 * ## 已修的真实问题
 * 「早上好老师」：words 是 ['早上','好','老师']，唯一正解被定成「早上好老师」。
 * 但中文更自然的语序是「老师早上好」，孩子按自然语序排反而被判错。
 * 已改为 words: ['老师','早上','好'] / answer: '老师早上好'。
 */
import { describe, expect, it } from 'vitest';
import { SENTENCE_BUILD } from './ChineseNew';

describe('连词成句', () => {
  it('⚠️ 所有词按顺序拼起来必须正好等于答案', () => {
    const bad = SENTENCE_BUILD.filter((s) => s.words.join('') !== s.answer).map(
      (s) => s.words.join('+') + ' ≠ ' + s.answer
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('每组至少 3 个词、答案非空、词不得为空', () => {
    const bad: string[] = [];
    for (const s of SENTENCE_BUILD) {
      if (s.words.length < 3) bad.push(s.answer + ' 词太少');
      if (!s.answer?.trim()) bad.push('有空的答案');
      if (s.words.some((w) => !w.trim())) bad.push(s.answer + ' 有空词');
    }
    expect(bad).toEqual([]);
  });

  it('答案不得重复', () => {
    const seen = new Map<string, number>();
    for (const s of SENTENCE_BUILD) seen.set(s.answer, (seen.get(s.answer) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dup).toEqual([]);
  });

  it('⚠️ 不得出现「唯一正解语序明显不自然」的高危句式', () => {
    // 「早上好老师」这类：问候语在前、称呼在后，中文习惯称呼在前
    const bad = SENTENCE_BUILD.filter((s) =>
      /^(早上好|晚上好|你好)(老师|妈妈|爸爸|同学们)$/.test(s.answer)
    ).map((s) => s.answer);
    expect(bad, '这些句子的语序不自然（称呼应在问候语之前）：' + JSON.stringify(bad)).toEqual([]);
  });
});
