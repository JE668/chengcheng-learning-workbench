// @vitest-environment node
/**
 * 英语题库的机械校验。
 *
 * 英语数据有两处「本该完全一致」的冗余字段，最适合机械验算：
 *   · CVC 词的 sound（如 c-a-t）必须等于 word 的字母拆分
 *   · 句型的 speak（完整句）必须等于 sentence 把 ___ 换成 answer 之后的结果
 * 一旦有人改了 word / sentence 却忘了同步另一个字段，下面就会失败。
 */
import { describe, expect, it } from 'vitest';
import { CVC_WORDS, EN_SENTENCES, EN_UNITS, EN_SONGS } from '../study-data';

describe('自然拼读 CVC 词', () => {
  it('⚠️ sound 必须等于 word 的字母拆分（c-a-t ↔ cat）', () => {
    const bad = CVC_WORDS.filter((w) => w.word.split('').join('-') !== w.sound).map(
      (w) => w.word + ' 的 sound 写成 ' + w.sound
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('单词不得重复、字段齐全、必须是三个字母', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const w of CVC_WORDS) {
      if (!w.word?.trim() || !w.cn?.trim() || !w.emoji?.trim()) bad.push(w.word + ' 字段缺失');
      if (w.word.length !== 3) bad.push(w.word + ' 不是三个字母');
      if (seen.has(w.word)) bad.push('重复：' + w.word);
      seen.add(w.word);
    }
    expect(bad).toEqual([]);
  });
});

describe('句型选词填空', () => {
  it('⚠️ speak 必须等于 sentence 把空格替换成 answer 的结果', () => {
    const bad = EN_SENTENCES.filter((s) => s.sentence.replace('___', s.answer) !== s.speak).map(
      (s) => s.sentence + ' → ' + s.speak
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('answer 必须在 options 里、选项不重复、句子必须含空格', () => {
    const bad: string[] = [];
    for (const s of EN_SENTENCES) {
      if (!s.sentence.includes('___')) bad.push(s.sentence + ' 没有空格标记');
      if (!s.options.includes(s.answer)) bad.push(s.sentence + ' 答案不在选项里');
      if (new Set(s.options).size !== s.options.length) bad.push(s.sentence + ' 选项重复');
      if (!s.emoji?.trim()) bad.push(s.sentence + ' 缺 emoji');
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('每句必须恰好一个空格（多个会替换不干净）', () => {
    const bad = EN_SENTENCES.filter((s) => s.sentence.split('___').length !== 2).map((s) => s.sentence);
    expect(bad).toEqual([]);
  });
});

describe('英语单元', () => {
  it('单元号不重复、字段齐全、每个单元至少有一个主题', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const u of EN_UNITS) {
      if (!u.unit?.trim() || !u.title?.trim() || !u.emoji?.trim()) bad.push(u.unit + ' 字段缺失');
      if (!u.topics?.length) bad.push(u.unit + ' 没有主题');
      if (seen.has(u.unit)) bad.push('重复：' + u.unit);
      seen.add(u.unit);
    }
    expect(bad).toEqual([]);
  });

  it('题材不得被两个单元同时认领（否则单元通关会重复出题）', () => {
    const bad: string[] = [];
    const seen = new Map<string, string>();
    for (const u of EN_UNITS) {
      for (const t of u.topics) {
        const prev = seen.get(t);
        if (prev) bad.push('题材「' + t + '」同时属于 ' + prev + ' 和 ' + u.unit);
        seen.set(t, u.unit);
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});

describe('英语儿歌', () => {
  it('字段齐全、标题不重复、关键词带中英对照', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const s of EN_SONGS) {
      if (!s.title?.trim() || !s.cn?.trim() || !s.emoji?.trim()) bad.push(s.title + ' 字段缺失');
      if (!s.lyrics?.length || s.lyrics.some((l) => !l.trim())) bad.push(s.title + ' 歌词为空');
      if (!s.keywords?.length || s.keywords.some((k) => !k.en?.trim() || !k.cn?.trim())) {
        bad.push(s.title + ' 关键词不完整');
      }
      if (seen.has(s.title)) bad.push('重复：' + s.title);
      seen.add(s.title);
    }
    expect(bad).toEqual([]);
  });
});
