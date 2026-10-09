// @vitest-environment node
/**
 * 全题库的「国际化字符」护栏 + 阅读题结构校验。
 *
 * ## 已修的真实错误
 * TEXT_COMPREHENSION_QS 里《画》的选项写成了「假**の**鸟」——
 * 混进了一个**日语平假名の**。孩子会把の当成汉字。
 *
 * ## 已修的「无依据的题」
 * 「这首诗描写的是什么季节？（《咏鹅》）」答案是「夏天」，
 * 但《咏鹅》全诗没有写季节 —— 这种题没有文本依据，孩子答错也不知道为什么。
 * 已改为「『白毛浮绿水』里的水是什么颜色？」，答案可直接从诗句读出。
 *
 * 本护栏扫描 study-data 下**所有**源文件，出现
 * 日文假名 / 韩文 / 西里尔字母 就失败 —— 覆盖面比逐个字段检查更广。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEXT_COMPREHENSION_QS, TEXTS, POEMS } from '../study-data';

const DIR = join(process.cwd(), 'src/lib/study-data');
/** 平假名 / 片假名 / 韩文 / 西里尔 */
const FOREIGN = /[\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/;

describe('题库字符体检', () => {
  it('⚠️ 任何数据文件都不得混入日文假名 / 韩文 / 西里尔字母', () => {
    const bad: string[] = [];
    for (const f of readdirSync(DIR)) {
      if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue;
      const src = readFileSync(join(DIR, f), 'utf8');
      const hits = src.match(new RegExp(FOREIGN, 'g'));
      if (hits) bad.push(f + ' 含：' + [...new Set(hits)].join(''));
    }
    expect(bad, '这些文件混入了非中文/非拉丁字符：' + JSON.stringify(bad)).toEqual([]);
  });
});

describe('阅读理解题', () => {
  it('answer 必须在 options 范围内', () => {
    const bad = TEXT_COMPREHENSION_QS.filter(
      (q) => !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length
    ).map((q) => q.question);
    expect(bad).toEqual([]);
  });

  it('选项不得重复、不得为空', () => {
    const bad: string[] = [];
    for (const q of TEXT_COMPREHENSION_QS) {
      if (q.options.some((o) => !o.trim())) bad.push(q.question + ' 有空选项');
      if (new Set(q.options).size !== q.options.length) bad.push(q.question + ' 选项重复');
    }
    expect(bad).toEqual([]);
  });

  it('每题都要有题干与讲解', () => {
    const bad = TEXT_COMPREHENSION_QS.filter(
      (q) => !q.question?.trim() || !q.explain?.trim()
    ).map((q) => q.question || '(无题干)');
    expect(bad).toEqual([]);
  });

  it('textRef 必须能在课文或古诗里找到', () => {
    // textRef 可能指向课文（TEXTS）或古诗（POEMS）
    const known = new Set([
      ...TEXTS.map((t) => String((t as unknown as Record<string, unknown>).title ?? '')),
      ...POEMS.map((p) => p.title),
    ]);
    // 古诗词以简称引用（『鹅』指《咏鹅》），故做前缀匹配
    const bad = TEXT_COMPREHENSION_QS.filter(
      (q) => ![...known].some((k) => k && (k.includes(q.textRef) || q.textRef.includes(k)))
    ).map((q) => q.textRef);
    expect([...new Set(bad)], '这些 textRef 找不到对应课文：' + JSON.stringify([...new Set(bad)])).toEqual([]);
  });
});
