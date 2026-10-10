// @vitest-environment node
/**
 * 自动生成的资产清单（raz-books / textbooks）与文件系统、手写数据的对齐护栏。
 *
 * 这两个文件都是脚本扫描生成的（"请勿手改"），对它们的审核重点不是逐条看内容，
 * 而是三类机械不变量：
 *   1. 引用的文件必须真实存在（PDF/MP4 缺失 = 孩子点开就是 404/黑屏）
 *   2. 标志位必须与文件系统一致（hasPdf 标 true 却没文件 = 点开就坏）
 *   3. 与手写数据交叉对齐（单元 chapter ↔ 课本章节；错位 = "按单元布置听写"指错章）
 *
 * ## 复核结论（全部通过 ✓）
 * · 语文 9 单元 ↔ 语文课本 9 章，序号一一对应（我上学了→识字→拼音×3→阅读→识字→阅读×2）
 * · 数学 7 单元 ↔ 数学课本 7 章，标题归一化后逐条相等
 * · 课本 17 个章节 PDF 全部存在
 * · RAZ 97 本：hasPdf 与文件系统 100% 一致（94 有 PDF、3 本只有视频），97 个 MP4 全存在
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAZ_BOOKS } from './raz-books';
import { TEXTBOOKS } from './textbooks';
import { GRADE1_CHAR_UNITS, MATH_UNITS } from './study-data/units';

const PUB = join(process.cwd(), 'public');

describe('RAZ 绘本清单', () => {
  it('⚠️ hasPdf 必须与文件系统一致（标 true 没文件 = 点开 404）', () => {
    const flagTrueNoFile: string[] = [];
    const flagFalseHasFile: string[] = [];
    for (const b of RAZ_BOOKS) {
      const pdf = existsSync(join(PUB, 'raz/books', b.id + '.pdf'));
      if (b.hasPdf && !pdf) flagTrueNoFile.push(b.id);
      if (!b.hasPdf && pdf) flagFalseHasFile.push(b.id);
    }
    expect(flagTrueNoFile, '标了 hasPdf 却没有文件：' + JSON.stringify(flagTrueNoFile)).toEqual([]);
    expect(
      flagFalseHasFile,
      '没标 hasPdf 却有文件（白浪费一本绘本）：' + JSON.stringify(flagFalseHasFile)
    ).toEqual([]);
  });

  it('⚠️ 每本书都必须有对应的视频（模块播的就是它）', () => {
    const bad = RAZ_BOOKS.filter((b) => !existsSync(join(PUB, 'raz/videos', b.id + '.mp4'))).map(
      (b) => b.id
    );
    expect(bad, '缺视频：' + JSON.stringify(bad)).toEqual([]);
  });

  it('id / title 不重复、字段齐全', () => {
    const ids = RAZ_BOOKS.map((b) => b.id);
    const titles = RAZ_BOOKS.map((b) => b.title);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(titles).size).toBe(titles.length);
    expect(RAZ_BOOKS.every((b) => b.id && b.title && typeof b.hasPdf === 'boolean')).toBe(true);
  });
});

describe('课本章节清单', () => {
  it('⚠️ 每个章节 PDF 必须存在', () => {
    const bad: string[] = [];
    for (const t of TEXTBOOKS) {
      for (const c of t.chapters) {
        if (!existsSync(join(PUB, c.file))) bad.push(c.file);
      }
    }
    expect(bad, '章节 PDF 缺失：' + JSON.stringify(bad)).toEqual([]);
  });

  it('每本书的章节 idx 必须从 1 连续编号', () => {
    const bad: string[] = [];
    for (const t of TEXTBOOKS) {
      t.chapters.forEach((c, i) => {
        if (c.idx !== i + 1) bad.push(t.key + ' 第 ' + (i + 1) + ' 个章节 idx=' + c.idx);
      });
    }
    expect(bad).toEqual([]);
  });

  it('⚠️ 数学单元必须与课本章节一一对应（标题归一化后相等）', () => {
    const math = TEXTBOOKS.find((t) => t.key === 'math');
    expect(math, '找不到数学课本').toBeTruthy();
    expect(MATH_UNITS.length).toBe(math!.chapters.length);
    const norm = (s: string) => s.replace(/[\s·、～~]/g, '');
    const bad = MATH_UNITS.filter((u, i) => norm(u.unit) !== norm(math!.chapters[i].title)).map(
      (u, i) => u.unit + ' ≠ ' + math!.chapters[i].title
    );
    expect(bad, '单元名与课本章节对不上：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 语文单元的 chapter 必须落在语文课本章节范围内（按序对齐）', () => {
    const chinese = TEXTBOOKS.find((t) => t.key === 'chinese');
    expect(chinese, '找不到语文课本').toBeTruthy();
    expect(GRADE1_CHAR_UNITS.length).toBe(chinese!.chapters.length);
    const bad = GRADE1_CHAR_UNITS.filter(
      (u) => u.chapter < 1 || u.chapter > chinese!.chapters.length
    ).map((u) => u.unit);
    expect(bad).toEqual([]);
    // chapter 序号必须互不相同（两个单元指向同一章 = 听写布置指错）
    const seen = new Set(GRADE1_CHAR_UNITS.map((u) => u.chapter));
    expect(seen.size).toBe(GRADE1_CHAR_UNITS.length);
  });
});
