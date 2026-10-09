// @vitest-environment node
/**
 * 古诗与拼音题库的机械校对。
 *
 * ## 已修的两个真实错误
 *
 * **1. 诗配画里蜻蜓配成了蟋蟀**
 * POEM_PICTURE_Q 中《小池》「早有蜻蜓立上头」的答案是 🦗。
 * 🦗 是蟋蟀，不是蜻蜓。（emoji 里没有蜻蜓，故该题改为其它诗句。）
 *
 * **2. 拼音题教了不存在的拼音**
 * PINYIN_TONES 里同时存在 i / u / ü / ie / ing 与 yi / wu / yu / ye / ying 两组，
 * 例字几乎相同。而 applyTone('i', 1) 得到的是『ī』—— 单独成音节时
 * 必须写作 yi，于是孩子看到的讲解是「『衣』的拼音是 ī」「『物』的拼音是 ù」
 * 「『迎』的拼音是 íng」，全是错的。已删掉那 5 个非法音节。
 *
 * 另外 a / o 的四声例字重复（啊×3、哦×2），会让
 * 「这个字读什么拼音？」**同时有多个正确答案** —— 已在 PINYIN_FULL 里排除。
 */
import { describe, expect, it } from 'vitest';
import { POEMS, POEM_PICTURE_Q, PINYIN_TONES, applyTone } from '../study-data';
import { genPinyinQ } from '../daily-practice/gen-chinese';

/** 只去掉声调符号（保留 ü 的两点） */
const stripTone = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0304\u030c]/g, '')
    .normalize('NFC');

describe('古诗题库', () => {
  it('每首诗都要有标题、作者、非空诗句；诗题不重复', () => {
    const bad: string[] = [];
    const seen = new Map<string, number>();
    for (const p of POEMS) {
      if (!p.title?.trim() || !p.author?.trim()) bad.push('缺标题/作者');
      if (!p.lines?.length || p.lines.some((l) => !l.trim())) bad.push(p.title + ' 诗句为空');
      seen.set(p.title, (seen.get(p.title) ?? 0) + 1);
    }
    bad.push(...[...seen.entries()].filter(([, n]) => n > 1).map(([k]) => '诗题重复：' + k));
    expect(bad).toEqual([]);
  });

  it('⚠️ 诗配画：answer 在 options 里、poem 真的存在、选项不重复', () => {
    const titles = new Set(POEMS.map((p) => p.title));
    const bad: string[] = [];
    for (const q of POEM_PICTURE_Q) {
      if (!titles.has(q.poem)) bad.push('诗题不在 POEMS：' + q.poem);
      if (!q.options.includes(q.answer)) bad.push(q.poem + ' 答案不在选项里');
      if (new Set(q.options).size !== q.options.length) bad.push(q.poem + ' 选项重复');
    }
    expect(bad).toEqual([]);
  });

  it('诗配画的提示必须真的出自该诗', () => {
    const byTitle = new Map(POEMS.map((p) => [p.title, p.lines.join('').replace(/[，。！？、；：]/g, '')]));
    const bad: string[] = [];
    for (const q of POEM_PICTURE_Q) {
      const text = byTitle.get(q.poem);
      if (!text) continue;
      const probe = q.hint.replace(/[，。！？、；：]/g, '').slice(0, 6);
      if (probe.length >= 4 && !text.includes(probe)) bad.push(q.poem + ' 的提示疑似不属于该诗：' + q.hint);
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});

describe('拼音声调表', () => {
  it('⚠️ 音节键不得以 i / u / ü 开头（单独成音节必须写作 yi / wu / yu）', () => {
    const bad = Object.keys(PINYIN_TONES).filter((k) => /^[iuü]/.test(k));
    expect(bad, '这些键会产生不存在的拼音：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 去调号后必须还原成音节本身（防拼写/调号错位）', () => {
    const bad: string[] = [];
    for (const [base, forms] of Object.entries(PINYIN_TONES)) {
      for (const f of forms) {
        if (!f) continue;
        const marked = applyTone(base, forms.indexOf(f) + 1);
        if (stripTone(marked) !== base) bad.push(base + ' → ' + marked);
      }
    }
    expect(bad.slice(0, 8), '调号错位：' + JSON.stringify(bad.slice(0, 8))).toEqual([]);
  });

  it('⚠️ 实际出题的每题，答案必须是真拼音（不得以裸 i/u/ü 开头）', () => {
    const bad: string[] = [];
    for (let i = 0; i < 400; i++) {
      const q = genPinyinQ();
      const m = /的拼音是\s*(\S+)/.exec(String(q.explain));
      const py = m?.[1] ?? '';
      if (!py || /^[iǐíìuūúùǖǘǚǜ]/.test(py)) bad.push(q.explain);
    }
    expect(bad.slice(0, 5), '出现了不存在的拼音：' + JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });

  it('⚠️ 出题的音节，四个声调的例字必须互不相同（否则多个正确答案）', () => {
    for (let i = 0; i < 200; i++) {
      const q = genPinyinQ();
      const seq = String(q.explain);
      const py = /的拼音是\s*(\S+)/.exec(seq)?.[1] ?? '';
      // 该音节的四个例字里，与本题例字相同的不应超过 1 个
      const base = stripTone(py);
      const chars = PINYIN_TONES[base];
      if (!chars) continue;
      const same = chars.filter((c) => c === q.han).length;
      expect(same, '「' + q.han + '」在 ' + base + ' 的四声里出现 ' + same + ' 次 → 多个正确答案').toBeLessThanOrEqual(1);
    }
  });
});
