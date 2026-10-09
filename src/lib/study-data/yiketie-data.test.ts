// @vitest-environment node
/**
 * 一课一贴题库的机械校验。
 *
 * ## 已修的真实错误（本轮查出 14 处）
 *
 * **1. IDIOMS 的 position 6 条用了 1-based（最严重）**
 * Idiom.tsx 的渲染是「i === item.position ? 下划线 : 原字」——**0-based**。
 * 而「耳目一新」「目中无人」「口是心非」「苦口婆心」「心直口快」「手忙脚乱」
 * 六条的 position 比真实下标大 1，于是界面挖空的是**另一个字**：
 *
 *   耳目一新 → 显示「耳目_新」，但答案却是「目」
 *
 * 孩子永远答不对。已全部改为正确的 0-based 下标。
 *
 * **2. 字形描述错了 3 处**
 *   · 「日中间一点」→ 日是中间**一横**（出现 2 处：形近字提示、形近字谜语）
 *   · 「用里面三横」→ 用里面是**两横一竖**
 *   · 「水：四个小点」→ 水是竖钩加两边，不是四个点
 *
 * **3. 拟声词重复登记了 5 条**（喵喵/呱呱/汪汪/嘎嘎/嗡嗡 各有两条）
 */
import { describe, expect, it } from 'vitest';
import {
  IDIOMS,
  WORD_FORM,
  ONOMATOPOEIA,
  SIMILAR_CHARS,
  POLYPHONIC_CHARS,
  PICTOGRAPHS,
} from '../study-data';

describe('成语填空', () => {
  it('⚠️ blank 必须正好在 position 这个下标上（Idiom.tsx 是 0-based）', () => {
    const bad = IDIOMS.filter((it) => it.idiom[it.position] !== it.blank).map(
      (it) =>
        it.idiom + ' 的 blank=' + it.blank + ' 却在 position=' + it.position + '（那里是 ' + it.idiom[it.position] + '）'
    );
    expect(bad, '挖空位置与答案不符：' + JSON.stringify(bad)).toEqual([]);
  });

  it('position 必须在成语长度范围内', () => {
    const bad = IDIOMS.filter((it) => it.position < 0 || it.position >= it.idiom.length).map((it) => it.idiom);
    expect(bad).toEqual([]);
  });

  it('成语不得重复、必须是四字、有释义与例句', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const it of IDIOMS) {
      if (seen.has(it.idiom)) bad.push('重复：' + it.idiom);
      seen.add(it.idiom);
      if (it.idiom.length !== 4) bad.push(it.idiom + ' 不是四字');
      if (!it.meaning?.trim() || !it.example?.trim()) bad.push(it.idiom + ' 缺释义或例句');
    }
    expect(bad).toEqual([]);
  });
});

describe('组词题', () => {
  it('⚠️ 正确词必须含该字，干扰词一个都不能含该字', () => {
    const bad: string[] = [];
    for (const w of WORD_FORM) {
      if (!w.word.includes(w.char)) bad.push(w.char + ' 的正确词「' + w.word + '」不含该字');
      for (const wrong of w.wrongWords) {
        if (wrong.includes(w.char)) bad.push(w.char + ' 的干扰词「' + wrong + '」也含该字，它同样是正确答案');
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('每题要有 3 个干扰词、1 个正确句、至少 1 个错句', () => {
    const bad = WORD_FORM.filter(
      (w) => w.wrongWords.length !== 3 || !w.sentenceOk?.trim() || (w.sentenceWrong?.length ?? 0) < 1
    ).map((w) => w.char);
    expect(bad).toEqual([]);
  });
});

describe('拟声词', () => {
  it('⚠️ 不得重复登记（同一声音 + 同一事物）', () => {
    const bad: string[] = [];
    for (let i = 0; i < ONOMATOPOEIA.length; i++) {
      for (let j = i + 1; j < ONOMATOPOEIA.length; j++) {
        const a = ONOMATOPOEIA[i];
        const b = ONOMATOPOEIA[j];
        if (a.sound !== b.sound) continue;
        if (a.subject === b.subject || a.subject.includes(b.subject) || b.subject.includes(a.subject)) {
          bad.push('「' + a.sound + '」重复：' + a.subject + ' 与 ' + b.subject);
        }
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});

describe('形近字 / 多音字 / 象形字', () => {
  it('形近字：两字不同、字段齐全、不得重复成对', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const g of SIMILAR_CHARS) {
      if (!g.a?.trim() || !g.b?.trim() || g.a === g.b) bad.push('字形对非法');
      if (!g.aMean?.trim() || !g.bMean?.trim() || !g.tip?.trim()) bad.push(g.a + '/' + g.b + ' 字段缺失');
      const k = [g.a, g.b].sort().join('/');
      if (seen.has(k)) bad.push('重复成对：' + k);
      seen.add(k);
    }
    expect(bad).toEqual([]);
  });

  it('形近字提示不得再出现「日中间一点」「用里面三横」这类错描述', () => {
    const bad = SIMILAR_CHARS.filter((g) => g.tip.includes('日中间一点') || g.tip.includes('用里面三横')).map(
      (g) => g.a + '/' + g.b + '：' + g.tip
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('多音字：至少两个读音、每条读音字段齐全、字不重复', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const c of POLYPHONIC_CHARS) {
      if ((c.readings?.length ?? 0) < 2) bad.push(c.char + ' 读音少于 2 个');
      for (const r of c.readings ?? []) {
        if (!r.pinyin?.trim() || !r.meaning?.trim() || !r.example?.trim()) bad.push(c.char + ' 有缺字段的读音');
      }
      if (seen.has(c.char)) bad.push('重复：' + c.char);
      seen.add(c.char);
    }
    expect(bad).toEqual([]);
  });

  it('象形字：字段齐全、字不重复', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const g of PICTOGRAPHS) {
      if (!g.char?.trim() || !g.py?.trim() || !g.meaning?.trim() || !g.hint?.trim()) bad.push('字段缺失');
      if (seen.has(g.char)) bad.push('重复：' + g.char);
      seen.add(g.char);
    }
    expect(bad).toEqual([]);
  });
});
