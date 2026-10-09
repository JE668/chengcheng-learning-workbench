// @vitest-environment node
/**
 * 识字/释义题的出题正确性（机械验证）。
 *
 * ## 为什么要有穷尽检查（而不是抽样）
 * buildQuestion 随机取字、随机取干扰项。原实现只过滤了「与目标释义相同」的干扰项，
 * 但**没有过滤干扰项彼此相同**。池里存在「两个字写同一个释义」时
 * （站/立 都写「站立」、天/空 都写「天空」…），选项就会出现两个一模一样的内容 ——
 * 孩子选对了另一个却被判错。
 *
 * ⚠️ 我先用「跑 300 次」抽样验证，**全部通过**；换成穷尽检查后立刻暴露了 14 组撞车。
 * 概率低的问题，抽样是抓不住的。
 *
 * 本次修了两处：① 代码按释义整体去重；② 把那些「拿词组意思当单字意思」的释义改回本义
 * （如「乌」原写「乌鸦」——那是词的意思，不是这个字的意思）。
 */
import { describe, expect, it } from 'vitest';
import { buildQuestion, LEVEL_POOL } from './ChineseModules';

const LEVELS = ['easy', 'medium', 'hard'] as const;
const RUNS = 300;

describe('识字 / 释义题出题', () => {
  for (const level of LEVELS) {
    it('[' + level + '] ⚠️ 选项必须 4 个且互不相同', () => {
      const bad: string[] = [];
      for (let i = 0; i < RUNS; i++) {
        const q = buildQuestion(level);
        if (q.options.length !== 4) bad.push(q.mode + ' 只有 ' + q.options.length + ' 个选项');
        if (new Set(q.options).size !== q.options.length)
          bad.push(q.mode + ' 选项重复：' + JSON.stringify(q.options));
      }
      expect([...new Set(bad)].slice(0, 3), JSON.stringify([...new Set(bad)].slice(0, 3))).toEqual(
        []
      );
    });

    it('[' + level + '] ⚠️ 答案必须在选项里', () => {
      const bad: string[] = [];
      for (let i = 0; i < RUNS; i++) {
        const q = buildQuestion(level);
        if (!q.options.includes(q.answer))
          bad.push(q.answer + ' 不在 ' + JSON.stringify(q.options));
      }
      expect(bad.slice(0, 3)).toEqual([]);
    });

    it('[' + level + '] ⚠️ 释义题不得在题干里写出答案那个字', () => {
      const bad: string[] = [];
      for (let i = 0; i < RUNS; i++) {
        const q = buildQuestion(level);
        if (q.mode === 'mean2char' && q.target.meaning.includes(q.answer)) {
          bad.push('题干「' + q.target.meaning + '」里含答案「' + q.answer + '」');
        }
      }
      expect(bad.slice(0, 3)).toEqual([]);
    });
  }

  it('首帧确定性路径（shuffle: false）两次结果必须一致', () => {
    expect(JSON.stringify(buildQuestion('easy', { shuffle: false }))).toBe(
      JSON.stringify(buildQuestion('easy', { shuffle: false }))
    );
  });

  it('⚠️ 穷尽检查：池内不得有重复释义（选项重复的根因）', () => {
    const bad: string[] = [];
    for (const level of LEVELS) {
      const byMeaning = new Map<string, string[]>();
      for (const c of LEVEL_POOL[level]) {
        const list = byMeaning.get(c.meaning) ?? [];
        list.push(c.char);
        byMeaning.set(c.meaning, list);
      }
      for (const [meaning, chars] of byMeaning) {
        if (chars.length > 1)
          bad.push(level + '「' + meaning + '」被 ' + chars.join('/') + ' 共用');
      }
    }
    expect(bad, '这些字共用同一释义：' + JSON.stringify(bad.slice(0, 8))).toEqual([]);
  });

  it('穷尽检查：每个池字数足够选出 3 个干扰项', () => {
    for (const level of LEVELS) {
      expect(LEVEL_POOL[level].length, level + ' 池太小').toBeGreaterThanOrEqual(4);
    }
  });
});
