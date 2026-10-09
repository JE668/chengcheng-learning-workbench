// @vitest-environment node
/**
 * 教学材料里的算式必须自洽。
 *
 * 每个主题的 example.scenes[].flow 里写着一步步的算式（如「9 + 1 = 10」），
 * 还有 summary 幕的 answer。这些是孩子看到的**思维过程**，
 * 一旦算错，教的就是错的。本护栏把它们逐条解析验算。
 */
import { describe, expect, it } from 'vitest';
import { ALGORITHM_TOPICS } from './topics';

/** 匹配 "A + B = C" / "A − B = C"（含全角减号） */
const ARITH = /(\d+)\s*([+\-−])\s*(\d+)\s*=\s*(\d+)/;

describe('算法示例 · 算式自洽', () => {
  it('⚠️ flow 里每一条算式的得数都要算对', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      for (const sc of (t.example?.scenes ?? []) as unknown as Array<Record<string, unknown>>) {
        for (const f of (sc.flow as string[]) ?? []) {
          const m = ARITH.exec(f);
          if (!m) continue;
          const a = Number(m[1]);
          const op = m[2];
          const b = Number(m[3]);
          const c = Number(m[4]);
          const expected = op === '+' ? a + b : a - b;
          if (expected !== c) {
            bad.push(t.id + ' 「' + f + '」应为 ' + expected + '，却写成 ' + c);
          }
        }
      }
    }
    expect(bad, '示例算式有算错的：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ flow 的最后一步结果必须等于该幕的 answer', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      for (const sc of (t.example?.scenes ?? []) as unknown as Array<Record<string, unknown>>) {
        const flow = (sc.flow as string[]) ?? [];
        if (!flow.length || typeof sc.answer !== 'number') continue;
        const last = ARITH.exec(flow[flow.length - 1]);
        if (!last) continue;
        if (Number(last[4]) !== sc.answer) {
          bad.push(t.id + ' 末步 ' + flow[flow.length - 1] + ' 但 answer=' + sc.answer);
        }
      }
    }
    expect(bad, '示例结论与末步不一致：' + JSON.stringify(bad)).toEqual([]);
  });

  it('每个主题都要有 principle / keyPoints / 分幕示例', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      if (!t.principle?.trim()) bad.push(t.id + ' 缺 principle');
      if (!t.keyPoints?.length) bad.push(t.id + ' 缺 keyPoints');
      if (!t.example?.scenes?.length) bad.push(t.id + ' 缺分幕示例');
      if (!t.mantra?.trim()) bad.push(t.id + ' 缺口诀');
    }
    expect(bad).toEqual([]);
  });
});
