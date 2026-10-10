// @vitest-environment node
/**
 * 课本数据（GRADE1_CHAR_UNITS / TEXT_CHAR_LESSONS / TEXTS 等）的一致性护栏。
 *
 * 这一层是「单元 ↔ 课文 ↔ 识字课文」三份手写清单 + 一批派生数据的交汇处，
 * 最容易出的问题就是**清单之间悄悄对不上**。本文件把已知的设计决策钉住：
 *
 * ## 已钉住的设计决策（改动前必读）
 * 1. 课文字表里有 6 个字（比/清/飘/落/答/旁）**没有**登记进单元字表，
 *    因为它们在 CHARACTERS 里没有释义 —— units.ts 注释写明「没写释义的字先不出题」。
 *    它们只进识字课文模块（只需字+组词），不进单元闯关/听写字模式。
 *    想让它们进单元，必须同时补 CHARACTERS 释义 + 单元字表，缺一步都会被下面的测试抓到。
 * 2. 「雪花」登记在单元 9 的词语里，但 雪 是单元 5 的字 ——
 *    组词模块（buildUnitWordItems）会静默跳过它，听写不受影响。这是已知例外。
 * 3. TRACE_CHARS 曾把「牙」写了两次（描红一轮会重复出现同一个字）。
 */
import { describe, expect, it } from 'vitest';
import {
  GRADE1_CHAR_UNITS,
  CHARACTERS,
  TEXT_CHAR_LESSONS,
  TEXTS,
  TRACE_CHARS,
  READING_PASSAGES,
  TEXTBOOK_TEXTS,
  FINGER_READ,
} from '../study-data';

const META = new Map(CHARACTERS.map((c) => [c.char, c]));

/** 识字课文里教、但（按设计）不进单元字表的字 —— 全都没有释义 */
const LESSON_ONLY_CHARS = ['比', '清', '飘', '落', '答', '旁'];

/** 登记在单元词语里、但不含本单元字的词（组词模块会跳过，听写保留） */
const WORDS_WITHOUT_UNIT_CHAR = ['雪花'];

const UNIT_CHARS = new Set(GRADE1_CHAR_UNITS.flatMap((u) => u.chars));
const LESSON_CHARS = new Set(TEXT_CHAR_LESSONS.flatMap((l) => l.items.map((i) => i.char)));

describe('单元字表', () => {
  it('每个单元字都必须有释义（否则识字闯关会静默丢字）', () => {
    const bad = [...UNIT_CHARS].filter((c) => !META.has(c));
    expect(bad, '这些字没有释义：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 每个词语都必须含有本单元的字（否则组词模块静默跳过）—— 已知例外除外', () => {
    const bad: string[] = [];
    for (const u of GRADE1_CHAR_UNITS) {
      const cs = new Set(u.chars);
      for (const w of u.words) {
        if (w.split('').some((c) => cs.has(c))) continue;
        if (WORDS_WITHOUT_UNIT_CHAR.includes(w)) continue;
        bad.push(u.unit + ' / ' + w);
      }
    }
    expect(bad, '这些词不含本单元的字：' + JSON.stringify(bad)).toEqual([]);
  });

  it('词语的每个字都必须有拼音释义（听写拼音模式才答得上来）', () => {
    const bad: string[] = [];
    for (const u of GRADE1_CHAR_UNITS) {
      for (const w of u.words) {
        const miss = w.split('').filter((c) => !META.has(c));
        if (miss.length) bad.push(w + ' 缺: ' + miss.join(''));
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('同一个单元内字不得重复登记（跨单元复现是正常的教学安排）', () => {
    // ⚠️ 判据曾经写错过一次：断言了"所有单元加起来不重复"，但课本里同一个字
    // 会在多个单元复现（如「地」在单元 2 和单元 6 都教），派生层用 seen 去重。
    // 正确的判据是**单个单元内部**不重复。
    const bad: string[] = [];
    for (const u of GRADE1_CHAR_UNITS) {
      const cs = new Set(u.chars);
      if (cs.size !== u.chars.length) bad.push(u.unit);
    }
    expect(bad, '这些单元内有重复登记的字：' + JSON.stringify(bad)).toEqual([]);
  });

  it('单元名不得重复', () => {
    const names = GRADE1_CHAR_UNITS.map((u) => u.unit);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('识字课文（TEXT_CHAR_LESSONS）', () => {
  it('⚠️ 每个字的组词必须真的含该字', () => {
    const bad: string[] = [];
    for (const l of TEXT_CHAR_LESSONS) {
      for (const it of l.items) {
        if (!it.phrase.includes(it.char)) bad.push(l.title + ' ' + it.char + '→' + it.phrase);
      }
    }
    expect(bad, JSON.stringify(bad.slice(0, 6))).toEqual([]);
  });

  it('⚠️ 课文有而单元没有的字，必须就是这份"按设计无释义"名单', () => {
    const diff = [...LESSON_CHARS].filter((c) => !UNIT_CHARS.has(c)).sort();
    expect(diff, '新出现的差异需要人工判断：要么补进单元+释义，要么登记进 LESSON_ONLY_CHARS').toEqual(
      [...LESSON_ONLY_CHARS].sort()
    );
    // 名单里的字必须真的没有释义（否则就该进单元字表了）
    const hasMeta = LESSON_ONLY_CHARS.filter((c) => META.has(c));
    expect(hasMeta, '这些字已有释义，应考虑登记进单元字表：' + JSON.stringify(hasMeta)).toEqual([]);
  });

  it('每课都要有标题与至少 3 个字', () => {
    const bad = TEXT_CHAR_LESSONS.filter((l) => !l.title?.trim() || l.items.length < 3).map((l) => l.title);
    expect(bad).toEqual([]);
  });
});

describe('课文与描红/指读', () => {
  it('TEXTS：14 篇课文，标题不重复、每篇都有句子', () => {
    expect(TEXTS.length).toBe(14);
    const titles = TEXTS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(TEXTS.every((t) => t.lines?.length && t.lines.every((l) => l.trim()))).toBe(true);
  });

  it('⚠️ TRACE_CHARS 不得重复（描红一轮不该出现同一个字两次）', () => {
    const dup = TRACE_CHARS.filter((c, i) => TRACE_CHARS.indexOf(c) !== i);
    expect([...new Set(dup)], '重复的描红字：' + JSON.stringify([...new Set(dup)])).toEqual([]);
    expect(TRACE_CHARS.length).toBeGreaterThan(40);
  });

  it('FINGER_READ：句子非空且不重复', () => {
    expect(FINGER_READ.length).toBeGreaterThan(5);
    expect(new Set(FINGER_READ).size).toBe(FINGER_READ.length);
    expect(FINGER_READ.every((s) => s.trim().length > 4)).toBe(true);
  });
});

describe('阅读理解与课文精讲', () => {
  it('READING_PASSAGES：答案在选项里、选项不重复、题干非空', () => {
    const bad: string[] = [];
    for (const p of READING_PASSAGES) {
      if (!p.options.includes(p.answer)) bad.push('答案不在选项里：' + p.question);
      if (new Set(p.options).size !== p.options.length) bad.push('选项重复：' + p.question);
      if (!p.passage?.trim() || !p.question?.trim()) bad.push('题干/短文为空');
    }
    expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });

  it('TEXTBOOK_TEXTS：标题/作者/诗句/赏析齐全，关键词含释义', () => {
    const bad: string[] = [];
    for (const t of TEXTBOOK_TEXTS) {
      if (!t.title?.trim() || !t.author?.trim() || !t.lines?.length) bad.push(t.title + ' 缺字段');
      if (!t.analysis?.trim()) bad.push(t.title + ' 缺赏析');
      if (t.keywords?.some((k) => !k.word?.trim() || !k.meaning?.trim())) bad.push(t.title + ' 关键词不完整');
    }
    expect(bad).toEqual([]);
    const titles = TEXTBOOK_TEXTS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
