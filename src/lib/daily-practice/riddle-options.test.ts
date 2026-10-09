// @vitest-environment node
/**
 * 谜语题的干扰项必须是**真实**选项。
 *
 * ## 缺陷
 * RIDDLES 每条只定义了 3 个选项，生成器为了凑齐 4 个，硬编码补了一个「都不对」。
 * 但谜底**一定**在前 3 个里，所以「都不对」按构造永远不可能是答案 ——
 * 等于白送孩子一个排除项，还教会他「这个词只是凑数用」。
 *
 * 修法：从**其它谜语的谜底**里取干扰项（同样是「能被猜的东西」），
 * 既保持迷惑性，也免去为 29 条谜语各手写一个干扰项。
 */
import { describe, expect, it } from 'vitest';
import { genRiddleQ } from './gen-chinese';

describe('谜语题 · 干扰项质量', () => {
  it('⚠️ 不得再用「都不对」这类凑数项，且始终 4 个不重复选项', () => {
    const FILLERS = ['都不对', '不知道', '以上都不是', '其他'];
    const problems: string[] = [];
    for (let i = 0; i < 300; i++) {
      const q = genRiddleQ();
      if (q.options.length !== 4) problems.push('选项数=' + q.options.length);
      if (new Set(q.options).size !== 4) problems.push('有重复项 ' + JSON.stringify(q.options));
      for (const f of FILLERS) {
        if (q.options.includes(f)) problems.push('用了凑数项「' + f + '」');
      }
      if (q.options[q.answer] !== q.han) problems.push('答案位置不对 ' + JSON.stringify(q.options));
      if (!q.options.includes(String(q.han)))
        problems.push('正确谜底不在选项中 ' + JSON.stringify(q.options));
    }
    expect(problems, '谜语干扰项存在问题：' + JSON.stringify(problems.slice(0, 5))).toEqual([]);
  });

  it('干扰项有足够变化（不是固定几个）', () => {
    const combos = new Set<string>();
    for (let i = 0; i < 200; i++) combos.add(JSON.stringify(genRiddleQ().options));
    expect(combos.size).toBeGreaterThan(50);
  });
});
