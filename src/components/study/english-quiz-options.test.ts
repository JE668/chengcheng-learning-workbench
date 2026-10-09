// @vitest-environment node
/**
 * 英语选词题：选项里不得出现两个相同的单词。
 *
 * ## 真实问题（罕见但真实）
 * EN_WORD_TOPICS 里 **orange 合法地出现两次**（橙子 / 橙色，分属两个主题），
 * 于是 ALL_EN_WORDS 里有两条 orange。而干扰项只按 word 过滤「目标」：
 *
 *   shuffle(pool.filter((w) => w.word !== target.word)).slice(0, k - 1)
 *
 * 目标若不是 orange，两条 orange 可能同时被选为干扰项 → 选项出现两个一样的单词，
 * 孩子一眼看出「重复的那个肯定不是答案」。命中概率约 **万分之 1.8**
 * （池里 187 词、只有 1 对重复）。
 *
 * ## 为什么不写「跑 N 次」的随机测试（我第一版就写错了）
 * 第一版用 mock 固定 Math.random 做穷尽，结果**把 shuffle 也一并退化了**
 * （后续 random 恒为 0 → 洗牌退化成一个固定排列），恰好绕开了重复场景，
 * 于是「反向验证」显示通过 —— 那是**测试本身失效**，不是代码没问题。
 * 现在改成对去重逻辑喂**对抗性输入**：确定、必现、不依赖运气。
 */
import { describe, expect, it } from 'vitest';
import { pickDistinctWords } from './EnglishModules';
import type { WordItem } from '@/lib/study-data-en';

const W = (word: string, cn = '') => ({ word, cn, emoji: '', sentence: '' }) as unknown as WordItem;

describe('英语选词题 · 干扰项去重', () => {
  it('⚠️ 对抗性输入：候选里有同词不同义的两条时，取出的必须互不相同', () => {
    const got = pickDistinctWords(
      [W('orange', '橙子'), W('orange', '橙色'), W('dog'), W('cat')],
      3
    );
    const words = got.map((w) => w.word);
    expect(words, '取出了重复词：' + JSON.stringify(words)).toEqual(['orange', 'dog', 'cat']);
    expect(new Set(words).size).toBe(words.length);
  });

  it('⚠️ 重复项聚在一起时也要正确跳过', () => {
    const got = pickDistinctWords([W('a'), W('a'), W('a'), W('b'), W('c')], 2);
    expect(got.map((w) => w.word)).toEqual(['a', 'b']);
  });

  it('候选充足时正好取 k 个', () => {
    expect(pickDistinctWords([W('a'), W('b'), W('c'), W('d')], 3)).toHaveLength(3);
  });

  it('不同词不足 k 个时，能取多少取多少（不死循环、不返回重复）', () => {
    const got = pickDistinctWords([W('a'), W('a'), W('b')], 3);
    expect(got.map((w) => w.word)).toEqual(['a', 'b']);
  });

  it('空候选返回空', () => {
    expect(pickDistinctWords([], 3)).toEqual([]);
  });
});
