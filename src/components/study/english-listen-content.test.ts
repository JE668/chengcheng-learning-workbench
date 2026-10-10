// @vitest-environment node
/**
 * EnglishListen 与 EyeCareModule 的内嵌内容护栏。
 *
 * ## 为什么用「源码扫描」而不是导出数组
 * 这两个组件的题目数据直接内嵌在文件里（不是 study-data 的题库），
 * 但格式很规整，用正则解析即可 —— 比重构导出更省事，也不用改组件。
 *
 * ## 守什么
 * 首音辨析题（GROUPS）的形式是 [单词, emoji, 音]，
 * **音必须是这个单词的首音**（bat→b、frog→fr、three→th），
 * 否则孩子被问「哪个词以 /b/ 开头」时，答案会是错的。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (f: string) => readFileSync(join(process.cwd(), 'src/components/study', f), 'utf8');

describe('首音辨析题（EnglishListen GROUPS）', () => {
  it('⚠️ 每条的音必须真的是该单词的首音', () => {
    const text = src('EnglishListen.tsx');
    const start = text.indexOf('const GROUPS');
    const end = text.indexOf('function buildInitialSound');
    expect(start, '找不到 GROUPS').toBeGreaterThan(-1);
    const block = text.slice(start, end === -1 ? start + 6000 : end);
    const re = /\['([a-z ]+)',\s*'([^']*)',\s*'([a-z]+)'\]/g;
    const rows = [...block.matchAll(re)].map((m) => ({ word: m[1], sound: m[3] }));
    expect(rows.length, '没能解析出题目，正则可能失效').toBeGreaterThan(20);
    const bad = rows
      .filter((r) => !r.word.startsWith(r.sound))
      .map((r) => r.word + ' 的音写成了 /' + r.sound + '/');
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('每组的三个词首音各不相同（否则组内会撞车）', () => {
    const text = src('EnglishListen.tsx');
    const start = text.indexOf('const GROUPS');
    const end = text.indexOf('function buildInitialSound');
    const block = text.slice(start, end === -1 ? start + 6000 : end);
    // 以 ] 分组合并：粗粒度按连续三行分组
    const lines = block.split('\n').filter((l) => /\['[a-z ]+',\s*'[^']*',\s*'[a-z]+'\]/.test(l));
    const bad: string[] = [];
    for (let i = 0; i + 2 < lines.length + 1; i += 3) {
      const trio = lines
        .slice(i, i + 3)
        .map((l) => (/\['([a-z ]+)',\s*'[^']*',\s*'([a-z]+)'\]/.exec(l) ?? [])[2]);
      if (trio.length === 3 && new Set(trio).size !== 3) bad.push(JSON.stringify(trio));
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });
});

describe('听音选图（EnglishListen PICS）与 TPR 指令', () => {
  it('PICS：每条都要有 word 与 emoji，且单词不重复', () => {
    const text = src('EnglishListen.tsx');
    const start = text.indexOf('const PICS');
    const end = text.indexOf('function buildListenPic');
    const block = text.slice(start, end === -1 ? start + 3000 : end);
    const rows = [...block.matchAll(/\{ word: '([^']+)', emoji: '([^']+)' \}/g)].map((m) => m[1]);
    expect(rows.length).toBeGreaterThan(20);
    expect(
      new Set(rows).size,
      '有重复单词：' + JSON.stringify(rows.filter((v, i) => rows.indexOf(v) !== i))
    ).toBe(rows.length);
  });

  it('TPR：每条都要有 en / zh / emoji，且英文不重复', () => {
    const text = src('EnglishListen.tsx');
    const start = text.indexOf('const TPR');
    const block = text.slice(start, start + 3000);
    const rows = [...block.matchAll(/\{ en: '([^']+)', zh: '([^']+)', emoji: '([^']+)' \}/g)];
    expect(rows.length).toBeGreaterThan(15);
    const en = rows.map((m) => m[1]);
    expect(new Set(en).size).toBe(en.length);
  });
});

describe('眼保健操（EyeCareModule SECTIONS）', () => {
  it('四节都要有名称 / emoji / 位置 / 做法', () => {
    const text = src('EyeCareModule.tsx');
    const nameCount = (text.match(/name: '第[一二三四]节/g) ?? []).length;
    expect(nameCount, '不是四节').toBe(4);
    for (const key of ['where:', 'how:', 'emoji:']) {
      expect(text.includes(key), '缺少字段 ' + key).toBe(true);
    }
  });
});
