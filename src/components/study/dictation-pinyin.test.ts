// @vitest-environment node
/**
 * 听写（拼音模式）答案正确性。
 *
 * ## 已修的真实缺陷
 * wordPinyin 逐字查 CHARACTERS 的拼音表，于是**词里的多音字读错**：
 *
 *   音乐  → yīn lè      （应为 yīn yuè）
 *   成长  → chéng cháng （应为 chéng zhǎng）
 *   睡觉  → shuì jué    （应为 shuì jiào）
 *
 * normPinyin 会去掉声调但保留字母，所以 'yinle' ≠ 'yinyue' ——
 * **孩子输入正确拼音会被判错**。已加词级校正表 WORD_PINYIN_FIX。
 *
 * ## 这条护栏怎么防止以后再犯
 * 遍历听写池里**所有含多音字的词**，每一个都必须二选一：
 *   · 已在 WORD_PINYIN_FIX 里（明确校正过），或
 *   · 已在 OK_WORDS 里（主读音恰好就是词里的读音，人工确认过）
 * 新增词若两边都没有 → 测试失败，逼人做一次判断。
 */
import { describe, expect, it } from 'vitest';
import { GRADE1_CHAR_UNITS, MULTI_READINGS } from '@/lib/study-data';
import { WORD_PINYIN_FIX, wordPinyin } from './DictationPractice';

/** 含多音字、但主读音恰好就是词里读音的词（人工逐条确认） */
const OK_WORDS = ['中国', '土地', '田地', '数学', '草地', '多少', '长短', '快乐', '笑着', '发芽'];

const WORDS = Array.from(new Set(GRADE1_CHAR_UNITS.flatMap((u) => u.words)));
const MULTI = new Set(Object.keys(MULTI_READINGS));

describe('听写 · 拼音答案', () => {
  it('⚠️ 拼音答案里不得出现汉字（说明某个字查不到拼音）', () => {
    const bad = WORDS.map((w) => [w, wordPinyin(w)] as const)
      .filter(([, py]) => /[\u4e00-\u9fff]/.test(py))
      .map(([w, py]) => w + ' → ' + py);
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 三处已修的多音字词，答案必须正确', () => {
    expect(wordPinyin('音乐')).toBe('yīn yuè');
    expect(wordPinyin('成长')).toBe('chéng zhǎng');
    expect(wordPinyin('睡觉')).toBe('shuì jiào');
    expect(wordPinyin('觉得')).toBe('jué de');
  });

  it('⚠️ 每个含多音字的词都必须被处理过（校正表 或 已确认名单）', () => {
    const handled = new Set([...Object.keys(WORD_PINYIN_FIX), ...OK_WORDS]);
    const bad = WORDS.filter((w) => w.split('').some((c) => MULTI.has(c)) && !handled.has(w));
    expect(
      bad,
      '新出现含多音字的词，请确认读音后加入 WORD_PINYIN_FIX 或 OK_WORDS：' + JSON.stringify(bad)
    ).toEqual([]);
  });

  it('校正表里的词必须真的在听写池里（防写错字/写多余）', () => {
    const bad = Object.keys(WORD_PINYIN_FIX).filter((w) => !WORDS.includes(w));
    expect(bad, '校正表里有池子里不存在的词：' + JSON.stringify(bad)).toEqual([]);
  });

  it('OK_WORDS 里的词必须真的在听写池里', () => {
    const bad = OK_WORDS.filter((w) => !WORDS.includes(w));
    expect(bad).toEqual([]);
  });
});
