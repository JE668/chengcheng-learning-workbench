// @vitest-environment node
/**
 * 算法主题与生成器必须严格一一对应，且每个主题都要能出满一关。
 *
 * ## 为什么要有这条护栏
 * 真实缺陷：ALGORITHM_TOPICS 里有 'adding-parens'（添括号），
 * 但 ALGORITHM_GENERATORS 里没有它 —— genPracticeSet 返回空数组，
 * **孩子在「添括号」主题里一道题都拿不到**（10 个主题坏 1 个），
 * 而且没有任何测试发现过它。
 *
 * 同时反向：ALGORITHM_GENERATORS 里曾有 misc 没有对应主题，属孤立项；
 * 由于 algorithm-progress 路由用 ALGORITHM_GENERATORS[topicId] 做白名单，
 * 它还会让客户端**越权为一个不存在的主题写进度**。
 */
import { describe, expect, it } from 'vitest';
import { ALGORITHM_TOPICS } from './topics';
import { ALGORITHM_GENERATORS, genPracticeSet } from './generators';

describe('算法主题 ↔ 生成器', () => {
  it('⚠️ 每个主题都必须有生成器（否则该主题无法练习）', () => {
    const missing = ALGORITHM_TOPICS.filter((t) => !ALGORITHM_GENERATORS[t.id]).map((t) => t.id);
    expect(missing, '这些主题没有生成器，孩子进去拿不到题：' + JSON.stringify(missing)).toEqual([]);
  });

  it('⚠️ 不允许孤立生成器（无对应主题）', () => {
    const orphan = Object.keys(ALGORITHM_GENERATORS).filter(
      (k) => !ALGORITHM_TOPICS.some((t) => t.id === k)
    );
    expect(orphan, '这些生成器没有对应主题：' + JSON.stringify(orphan)).toEqual([]);
  });

  it('⚠️ 每个主题都要能出满 10 道互不重复的题', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      const qs = genPracticeSet(t.id, 1);
      if (qs.length !== 10) bad.push(t.id + ' 只有 ' + qs.length + ' 题');
      const ids = new Set(qs.map((q) => q.id));
      if (ids.size !== qs.length) bad.push(t.id + ' 有重复题');
    }
    expect(bad, '关卡题量不足：' + JSON.stringify(bad)).toEqual([]);
  });

  it('每道题的必备字段都齐全，且 topicId 与主题一致', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      for (const q of genPracticeSet(t.id, 1)) {
        if (q.topicId !== t.id) bad.push(q.id + ' topicId 不符');
        if (!q.prompt || typeof q.prompt !== 'string') bad.push(q.id + ' prompt 缺失');
        if (!Number.isFinite(q.answer)) bad.push(q.id + ' answer 非数字');
        if (!q.stepFields?.length) bad.push(q.id + ' 没有分步');
        if (!q.explain) bad.push(q.id + ' 没有讲解');
      }
    }
    expect(bad.slice(0, 8)).toEqual([]);
  });

  it('纯加法主题的答案必须等于各数字之和（防算错）', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      for (const q of genPracticeSet(t.id, 1)) {
        if (q.operator !== '+') continue;
        const sum = q.digits.reduce((x, y) => x + y, 0);
        if (q.answer !== sum) bad.push(t.id + ' ' + q.prompt + ' 答=' + q.answer + ' 应为 ' + sum);
      }
    }
    expect(bad.slice(0, 6)).toEqual([]);
  });
});
