// @vitest-environment node
/**
 * 写字题库的引用完整性与结构护栏。
 *
 * ## 已修的不一致
 * WRITING_TIPS 里「田」引用的规则名写成「先外后**里**再封口」，
 * 而 STROKE_RULES 里定义的是「先外后**内**再封口」—— 同一条规则两个名字。
 * 下面的护栏会让这类不一致直接失败。
 */
import { describe, expect, it } from 'vitest';
import { STROKES, RADICALS, STROKE_RULES, WRITING_TIPS } from '../study-data';

/**
 * 允许出现在 WRITING_TIPS 但不在 STROKE_RULES 里的规则名。
 * 这些是「具体笔顺」而非「通用规则」，需要显式登记，不能悄悄加。
 */
const EXTRA_RULES = ['先点后横', '先撇后横折弯钩'];

describe('笔画与偏旁', () => {
  it('每条笔画都要有符号、名称、例字、方向提示', () => {
    const bad = STROKES.filter((s) => !s.stroke || !s.name?.trim() || !s.example?.trim() || !s.dir?.trim()).map(
      (s) => s.name || '(无名)'
    );
    expect(bad).toEqual([]);
  });

  it('笔画名称不得重复', () => {
    const seen = new Map<string, number>();
    for (const s of STROKES) seen.set(s.name, (seen.get(s.name) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dup).toEqual([]);
  });

  it('每条偏旁都要有名称与至少 3 个例字', () => {
    const bad: string[] = [];
    for (const r of RADICALS) {
      if (!r.name?.trim()) bad.push(r.radical + ' 缺名称');
      if ((r.examples?.length ?? 0) < 3) bad.push(r.name + ' 例字少于 3 个');
      if (r.examples?.some((e) => !e.trim())) bad.push(r.name + ' 有空例字');
    }
    expect(bad).toEqual([]);
  });

  it('偏旁不得重复登记', () => {
    const seen = new Map<string, number>();
    for (const r of RADICALS) seen.set(r.radical, (seen.get(r.radical) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dup).toEqual([]);
  });
});

describe('笔顺规则', () => {
  it('每条规则都要有名称、顺口溜、例字、emoji', () => {
    const bad = STROKE_RULES.filter(
      (r) => !r.name?.trim() || !r.rhyme?.trim() || !r.examples?.length || !r.emoji?.trim()
    ).map((r) => r.name || '(无名)');
    expect(bad).toEqual([]);
  });

  it('规则名称不得重复', () => {
    const seen = new Map<string, number>();
    for (const r of STROKE_RULES) seen.set(r.name, (seen.get(r.name) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dup).toEqual([]);
  });

  it('⚠️ 田字格提示引用的规则名必须真的存在（防「先外后里/先外后内」这类不一致）', () => {
    const names = new Set(STROKE_RULES.map((r) => r.name));
    const bad = WRITING_TIPS.filter((w) => !names.has(w.rule) && !EXTRA_RULES.includes(w.rule)).map(
      (w) => w.char + ' 引用了不存在的规则「' + w.rule + '」'
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('田字格提示：每条都要有字、规则、提示、emoji；字不得重复', () => {
    const bad: string[] = [];
    const seen = new Map<string, number>();
    for (const w of WRITING_TIPS) {
      if (!w.char?.trim() || !w.rule?.trim() || !w.tip?.trim() || !w.emoji?.trim()) bad.push(w.char + ' 字段缺失');
      seen.set(w.char, (seen.get(w.char) ?? 0) + 1);
    }
    bad.push(...[...seen.entries()].filter(([, n]) => n > 1).map(([k]) => '字重复：' + k));
    expect(bad).toEqual([]);
  });
});
