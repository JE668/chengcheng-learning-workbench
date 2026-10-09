// @vitest-environment node
/**
 * 全题库 + 内嵌题库组件的「国际化字符」护栏。
 *
 * ## 已修的真实错误
 * study-data 的阅读理解选项里写成了「假**の**鸟」—— 混进一个日语平假名。
 *
 * 本护栏扫描 **study-data 下所有源文件** 与 **components/study 下的组件**
 * （组件里也有大量内嵌题库），出现 日文假名 / 韩文 / 西里尔字母 就失败。
 * 用 Unicode 正则（JS 按码点匹配），不依赖 shell 的字节范围 —— 后者会把汉字误判。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEXT_COMPREHENSION_QS, TEXTS, POEMS } from '../study-data';

const DATA_DIR = join(process.cwd(), 'src/lib/study-data');
const COMP_DIR = join(process.cwd(), 'src/components/study');
/** 平假名 / 片假名 / 韩文音节 / 西里尔 */
const FOREIGN = /[\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/;

function scan(dir: string, exts: string[]): string[] {
  const bad: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!exts.some((e) => f.endsWith(e)) || f.includes('.test.')) continue;
    const src = readFileSync(join(dir, f), 'utf8');
    const hits = src.match(new RegExp(FOREIGN, 'g'));
    if (hits) bad.push(f + ' 含：' + [...new Set(hits)].join(''));
  }
  return bad;
}

describe('题库字符体检', () => {
  it('⚠️ study-data 所有数据文件不得混入日文假名 / 韩文 / 西里尔', () => {
    expect(scan(DATA_DIR, ['.ts']), '见下方报告').toEqual([]);
  });

  it('⚠️ components/study 下的内嵌题库同样不得混入（组件里有大量内嵌题目）', () => {
    expect(scan(COMP_DIR, ['.tsx', '.ts']), '见下方报告').toEqual([]);
  });
});

describe('阅读理解题', () => {
  it('answer 必须在 options 范围内', () => {
    const bad = TEXT_COMPREHENSION_QS.filter(
      (q) => !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length
    ).map((q) => q.question);
    expect(bad).toEqual([]);
  });

  it('选项不得重复、不得为空；题干与讲解非空', () => {
    const bad: string[] = [];
    for (const q of TEXT_COMPREHENSION_QS) {
      if (q.options.some((o) => !o.trim())) bad.push(q.question + ' 有空选项');
      if (new Set(q.options).size !== q.options.length) bad.push(q.question + ' 选项重复');
      if (!q.question?.trim() || !q.explain?.trim()) bad.push('题干或讲解为空');
    }
    expect(bad).toEqual([]);
  });

  it('textRef 必须能在课文（TEXTS）或古诗（POEMS）里找到', () => {
    const known = new Set([
      ...TEXTS.map((t) => String((t as unknown as Record<string, unknown>).title ?? '')),
      ...POEMS.map((p) => p.title),
    ]);
    const bad = TEXT_COMPREHENSION_QS.filter(
      (q) => ![...known].some((k) => k && (k.includes(q.textRef) || q.textRef.includes(k)))
    ).map((q) => q.textRef);
    expect([...new Set(bad)], '这些 textRef 找不到对应课文：' + JSON.stringify([...new Set(bad)])).toEqual([]);
  });
});
