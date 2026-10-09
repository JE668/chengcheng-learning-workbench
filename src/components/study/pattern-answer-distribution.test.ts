// @vitest-environment node
/**
 * 找规律题：正确答案不得永远落在同一个位置。
 *
 * ## 已修的真实缺陷
 * PROBS 里 12 道题的 answer **全是 0**，而组件按原顺序渲染选项
 * （options.map，不打乱）—— 也就是**正确答案永远是第一个按钮**。
 * 孩子发现「永远点第一个」就能全对，这道练习就失去了意义。
 *
 * 已把答案打散到 0/1/2。这里用源码级扫描守住，避免以后新增题目又全写 0。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(process.cwd(), 'src/components/study/PatternModule.tsx'), 'utf8');

describe('找规律题 · 答案分布', () => {
  it('⚠️ 正确答案不得集中在同一个下标上', () => {
    const answers = [...SRC.matchAll(/options:\s*\[[^\]]*\],\s*answer:\s*(\d+)/g)].map((m) =>
      Number(m[1])
    );
    expect(answers.length, '没解析到题目，正则可能失效').toBeGreaterThan(6);
    const counts = new Map<number, number>();
    for (const a of answers) counts.set(a, (counts.get(a) ?? 0) + 1);
    const worst = Math.max(...counts.values());
    // 任何单个位置都不应占一半以上
    expect(
      worst / answers.length,
      '答案分布过于集中：' +
        JSON.stringify([...counts.entries()]) +
        '（共 ' +
        answers.length +
        ' 题）'
    ).toBeLessThanOrEqual(0.5);
  });

  it('每道题的 answer 必须指向 options 里的合法下标', () => {
    const bad: string[] = [];
    for (const m of SRC.matchAll(/options:\s*\[([^\]]*)\],\s*answer:\s*(\d+)/g)) {
      const opts = m[1].split(',').filter((x) => x.trim());
      const a = Number(m[2]);
      if (a < 0 || a >= opts.length)
        bad.push('answer=' + a + ' 越界（选项 ' + opts.length + ' 个）');
    }
    expect(bad).toEqual([]);
  });

  it('每道题的选项都不得重复', () => {
    const bad: string[] = [];
    for (const m of SRC.matchAll(/options:\s*\[([^\]]*)\],\s*answer:/g)) {
      const opts = m[1].split(',').map((x) => x.trim());
      if (new Set(opts).size !== opts.length) bad.push(m[1]);
    }
    expect(bad).toEqual([]);
  });
});
