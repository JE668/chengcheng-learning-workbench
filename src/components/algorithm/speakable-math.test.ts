// @vitest-environment node
/**
 * 算法读题转换（speakableMath / numToZh）的回归测试。
 *
 * 背景（2026-11-11 用户反馈）：萌可算法练习页「语音读题基本没读出来」——
 * 此前练习页根本没有接 TTS；接上后如果直接把「9 + 5 = ?」交给 Web Speech，
 * 「=」经常吞字或被读成英文。转换函数把符号说成汉字、数字读成中文，
 * 让任意 TTS 引擎都能稳定读题。
 */
import { describe, expect, it } from 'vitest';
import { speakableMath } from '@/components/algorithm/AlgorithmQuiz';

describe('speakableMath · 算式转读题文本', () => {
  it('凑十法题目：9 + 5 = ?', () => {
    expect(speakableMath('9 + 5 = ?')).toBe('九 加 五 等于 几');
  });

  it('两位数减法：15 - 9 = ?', () => {
    expect(speakableMath('15 - 9 = ?')).toBe('十五 减 九 等于 几');
  });

  it('带括号：15 - (6 - 3) = ?', () => {
    expect(speakableMath('15 - (6 - 3) = ?')).toBe('十五 减 ，六 减 三， 等于 几');
  });

  it('乘除：6 × 7 = ?', () => {
    expect(speakableMath('6 × 7 = ?')).toBe('六 乘 七 等于 几');
  });

  it('步骤展示：10 + 4 = 14（无问号）', () => {
    expect(speakableMath('10 + 4 = 14')).toBe('十 加 四 等于 十四');
  });

  it('三位数：100 - 35 = 65', () => {
    expect(speakableMath('100 - 35 = 65')).toBe('一百 减 三十五 等于 六十五');
  });

  it('一百零几：105', () => {
    expect(speakableMath('105')).toBe('一百零五');
  });
});
