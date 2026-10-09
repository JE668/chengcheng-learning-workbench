// @vitest-environment node
/**
 * 拼音教学提示必须准确。
 *
 * ## 已修的真实错误
 *
 * **1. 书写占位写错了 3 个字母**
 * 原文：a o e 占中格；i u ü 占中上格；b p 占中下格；m n l 占中格
 * 错处：b 其实占**上中格**（不是中下格）；u 占**中格**；l 占**上中格**。
 * 「b 占中下格」这种错误会直接教错笔画位置 —— 一年级老师很在意的细节。
 *
 * **2. 整体认读音节「列了 7 个却说 8 个」，且漏了 9 个**
 * 原文：zhi chi shi ri、yi wu yu 这 8 个音节
 * 人教版一年级共 **16** 个整体认读音节，原文只列了 7 个。
 */
import { describe, expect, it } from 'vitest';
import { PINYIN_TIPS, PINYIN_BLEND, TONE_ITEMS } from '../study-data';

/** 四线格占位的标准答案（人教版） */
const TIANZI = {
  中格: ['a', 'o', 'e', 'u', 'm', 'n', 'x', 'z', 'c', 's', 'r', 'w'],
  上中格: ['i', 'ü', 'b', 'd', 't', 'f', 'k', 'h', 'l'],
  中下格: ['p', 'g', 'q', 'y'],
  上中下格: ['j'],
};

/** 人教版 16 个整体认读音节 */
const WHOLE_SYLLABLES = [
  'zhi', 'chi', 'shi', 'ri',
  'zi', 'ci', 'si',
  'yi', 'wu', 'yu',
  'ye', 'yue', 'yuan',
  'yin', 'yun', 'ying',
];

const tipOf = (kw: string) => PINYIN_TIPS.find((t) => t.title.includes(kw))?.tip ?? '';

describe('拼音教学提示', () => {
  it('⚠️ 书写规则里每个字母的占位必须与标准一致', () => {
    const tip = tipOf('书写');
    const segs = tip.split(/；|;/);
    const bad: string[] = [];
    for (const [group, letters] of Object.entries(TIANZI)) {
      for (const L of letters) {
        const seg = segs.find((s) => {
          const tokens = s.replace(/[^a-zA-Zü\s]/g, ' ').split(/\s+/);
          return tokens.includes(L);
        });
        if (!seg) {
          bad.push(L + ' 在书写规则里没提到');
        } else if (!seg.includes(group)) {
          bad.push(L + ' 被写成了「' + seg.slice(0, 22) + '…」，应为' + group);
        }
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 整体认读音节要列全 16 个，且说的个数要和列出的个数一致', () => {
    const tip = tipOf('整体认读');
    const missing = WHOLE_SYLLABLES.filter((s) => !tip.includes(s));
    expect(missing, '漏掉的整体认读音节：' + JSON.stringify(missing)).toEqual([]);
    const claimed = Number(/这\s*(\d+)\s*个/.exec(tip)?.[1] ?? NaN);
    expect(claimed, '提示里必须写明个数').toBe(WHOLE_SYLLABLES.length);
  });

  it('拼读表：声母+韵母必须拼成所写的音节', () => {
    const bad = PINYIN_BLEND.filter((x) => x.sheng + x.yun !== x.syllable).map(
      (x) => x.sheng + '+' + x.yun + '≠' + x.syllable
    );
    expect(bad).toEqual([]);
  });

  it('拼读表：每条都要有例字与 emoji', () => {
    const bad = PINYIN_BLEND.filter((x) => !x.word?.trim() || !x.emoji?.trim()).map((x) => x.syllable);
    expect(bad).toEqual([]);
  });

  it('声调表：四个声调齐全、各有三个例字、都有口诀', () => {
    const bad: string[] = [];
    for (const t of TONE_ITEMS) {
      if (!t.label?.trim() || !t.mnemonic?.trim()) bad.push('声调 ' + t.tone + ' 缺标签/口诀');
      if (t.example?.length !== 3) bad.push('声调 ' + t.tone + ' 例字不是 3 个');
      if (t.example?.some((e) => !e.trim())) bad.push('声调 ' + t.tone + ' 有空例字');
    }
    expect(bad).toEqual([]);
    expect(TONE_ITEMS.map((t) => t.tone).sort()).toEqual([1, 2, 3, 4]);
  });
});
