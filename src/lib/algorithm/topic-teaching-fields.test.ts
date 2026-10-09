// @vitest-environment node
/**
 * 「原理呈现」的四个层次必须齐全，且不得是复制粘贴式填充。
 *
 * 每层解决不同的问题：
 *   principle  —— 为什么（建立直觉）
 *   signals    —— 什么时候想到用它（**可迁移**的关键，比步骤更重要）
 *   keyPoints  —— 怎么做（步骤）
 *   pitfalls   —— 哪里容易错（反例）
 *
 * 缺了 signals，孩子学会了步骤却不知道该在什么场合用 —— 这正是「会算不会用」的成因。
 */
import { describe, expect, it } from 'vitest';
import { ALGORITHM_TOPICS } from './topics';

describe('算法原理呈现 · 四层齐全', () => {
  it('⚠️ 每个主题都要有识别信号与常见错误', () => {
    const bad: string[] = [];
    for (const t of ALGORITHM_TOPICS) {
      if (!t.signals?.length) bad.push(t.id + ' 缺 signals');
      if (!t.pitfalls?.length) bad.push(t.id + ' 缺 pitfalls');
      if ((t.signals?.length ?? 0) < 2) bad.push(t.id + ' 识别信号少于 2 条');
      if ((t.pitfalls?.length ?? 0) < 2) bad.push(t.id + ' 常见错误少于 2 条');
    }
    expect(bad).toEqual([]);
  });

  it('信号的文案不得为空、不得复制粘贴', () => {
    const bad: string[] = [];
    const seen = new Map<string, string>();
    for (const t of ALGORITHM_TOPICS) {
      for (const s of t.signals ?? []) {
        if (!s.trim()) bad.push(t.id + ' 有空信号');
        const prev = seen.get(s);
        if (prev) bad.push('信号「' + s + '」被 ' + prev + ' 和 ' + t.id + ' 共用');
        seen.set(s, t.id);
      }
    }
    expect(bad).toEqual([]);
  });

  it('常见错误的文案不得为空、不得复制粘贴', () => {
    const bad: string[] = [];
    const seen = new Map<string, string>();
    for (const t of ALGORITHM_TOPICS) {
      for (const p of t.pitfalls ?? []) {
        if (!p.trim()) bad.push(t.id + ' 有空错误项');
        const prev = seen.get(p);
        if (prev) bad.push('坑「' + p + '」被 ' + prev + ' 和 ' + t.id + ' 共用');
        seen.set(p, t.id);
      }
    }
    expect(bad).toEqual([]);
  });
});
