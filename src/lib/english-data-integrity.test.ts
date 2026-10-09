// @vitest-environment node
/**
 * 英语词库的完整性护栏（EN_WORD_TOPICS + RAZ_VOCAB）。
 *
 * ## 已修的真实问题
 * EN_WORD_TOPICS 里「冰淇淋」的词条存成了 **icecream（无空格）**，
 * 而例句写的是 "I like ice cream." —— 词条本身是**拼写错误**（ice cream 是两个词）。
 * 已改正。（其余 watermelon / classroom / afternoon 等都是真正的单词，不在此列。）
 *
 * ## 关键不变量
 * word / cn / emoji 必须齐全；**例句若存在，必须真的含有该单词**
 * （例句写的是别的词，孩子会学到错配）。
 * 没有例句是允许的（数字词 one~ten、zero 就没有，模块会 filter 掉）。
 */
import { describe, expect, it } from 'vitest';
import { EN_WORD_TOPICS, LETTERS } from './study-data-en';
import { RAZ_ALL_WORDS, RAZ_VOCAB } from './raz-vocab';

const EN_ALL = Object.values(EN_WORD_TOPICS).flat();

describe('EN_WORD_TOPICS', () => {
  it('每题都要有 word / cn / emoji', () => {
    const bad = EN_ALL.filter((w) => !w.word?.trim() || !w.cn?.trim() || !w.emoji?.trim()).map(
      (w) => w.word || '(空词)'
    );
    expect(bad).toEqual([]);
  });

  it('⚠️ 例句若存在，必须含有该单词（大小写不敏感）', () => {
    const bad = EN_ALL.filter(
      (w) => w.sentence && !w.sentence.toLowerCase().includes(w.word.toLowerCase())
    ).map((w) => w.word + ' | ' + w.sentence);
    expect(bad, '例句与单词对不上：' + JSON.stringify(bad)).toEqual([]);
  });

  it('单词一律小写（允许多词短语）', () => {
    const bad = EN_ALL.filter((w) => w.word !== w.word.toLowerCase().trim()).map((w) => w.word);
    expect(bad).toEqual([]);
  });

  it('带例句的词要足够多（防止有人把例句整批删掉）', () => {
    const withSentence = EN_ALL.filter((w) => w.sentence?.trim()).length;
    expect(withSentence).toBeGreaterThan(150);
  });

  it('用于拼写题的词必须是小写纯字母 3~6 位（EnSpell 的过滤条件）', () => {
    const spellable = EN_ALL.filter(
      (w) => w.word.length >= 3 && w.word.length <= 6 && /^[a-z]+$/.test(w.word)
    );
    expect(spellable.length, '可拼写词太少，拼写题会缺题').toBeGreaterThan(30);
  });

  it('LETTERS 覆盖 26 个字母且都有例词', () => {
    expect(LETTERS.length).toBe(26);
    const bad = LETTERS.filter((l) => !l.letter?.trim() || !l.word?.trim() || !l.emoji?.trim());
    expect(bad).toEqual([]);
  });
});

describe('RAZ_VOCAB', () => {
  it('每题都要有 word / cn / emoji / book', () => {
    const bad = RAZ_ALL_WORDS.filter(
      (w) => !w.word?.trim() || !w.cn?.trim() || !w.emoji?.trim() || !w.book?.trim()
    ).map((w) => w.word || '(空词)');
    expect(bad).toEqual([]);
  });

  it('⚠️ 例句必须含有该单词', () => {
    const bad = RAZ_ALL_WORDS.filter(
      (w) => !w.sentence?.toLowerCase().includes(w.word.toLowerCase())
    ).map((w) => w.word + ' | ' + w.sentence);
    expect(bad, JSON.stringify(bad.slice(0, 6))).toEqual([]);
  });

  it('分类不得为空，且每类至少 3 个词', () => {
    const bad = Object.entries(RAZ_VOCAB)
      .filter(([, arr]) => arr.length < 3)
      .map(([k]) => k);
    expect(bad).toEqual([]);
  });
});
