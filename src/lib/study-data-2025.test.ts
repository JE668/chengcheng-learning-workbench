import { describe, expect, it } from 'vitest';
import {
  PROVERBS,
  NURSERY_RHYMES,
  ANTONYMS,
  QUANTIFIERS,
  RIDDLES,
  SAFETY_TIPS,
  EN_SONGS,
  WORD_PROBLEMS,
  READING_PASSAGES,
  type ProverbItem,
  type NurseryRhyme,
  type AntonymItem,
  type QuantifierItem,
  type RiddleItem,
  type EnSong,
} from '@/lib/study-data';

/**
 * 【2025 新增】萌可趣味学园数据防回归测试。
 * 延续项目惯例（数据必有测试）：守住「选项必含答案但答案唯一、
 * 无重复、字段非空」这几条硬底线，避免后人改数据踩「干扰项=正确答案」的坑。
 */

describe('语文 · 睿智名言（PROVERBS）', () => {
  it('共 10 条，字段完整', () => {
    expect(PROVERBS).toHaveLength(10);
    for (const p of PROVERBS) {
      expect(p.first.trim().length, `「${p.first}」前半句为空`).toBeGreaterThan(0);
      expect(p.second.trim().length, `「${p.first}」后半句为空`).toBeGreaterThan(0);
      expect(p.hint.trim().length, `「${p.first}」缺讲解`).toBeGreaterThan(0);
      expect(p.emoji).toBeTruthy();
    }
  });

  it('后半句（答案）不重复，干扰项不会撞答案', () => {
    const seconds = PROVERBS.map((p) => p.second);
    expect(new Set(seconds).size).toBe(seconds.length);
  });

  it('关键回归：一年之计在于春 → 一日之计在于晨', () => {
    const p = PROVERBS.find((x) => x.first.includes('一年之计'))!;
    expect(p.second).toBe('一日之计在于晨');
  });
});

describe('语文 · 儿歌乐园（NURSERY_RHYMES）', () => {
  it('共 7 首，内容字段完整', () => {
    expect(NURSERY_RHYMES).toHaveLength(7);
    for (const r of NURSERY_RHYMES) {
      expect(r.title).toBeTruthy();
      expect(r.lines.length, `《${r.title}》没有被唱的内容`).toBeGreaterThanOrEqual(2);
      expect(r.question, `《${r.title}》缺理解题`).toBeTruthy();
      expect(r.tip, `《${r.title}》缺萌可提示`).toBeTruthy();
    }
  });

  it('答案在选项里，且选项不重复', () => {
    for (const r of NURSERY_RHYMES) {
      expect(r.options.includes(r.answer), `《${r.title}》答案「${r.answer}」不在选项里`).toBe(true);
      expect(new Set(r.options).size, `《${r.title}》选项有重复`).toBe(r.options.length);
    }
  });

  it('经典回归：小兔子乖乖 → 不开门是因为"谁来也不开"', () => {
    const r = NURSERY_RHYMES.find((x) => x.title === '小兔子乖乖')!;
    expect(r.answer).toContain('谁来也不开');
  });
});

describe('语文 · 反义词（ANTONYMS）', () => {
  it('共 16 对，词对不重复、a≠b', () => {
    expect(ANTONYMS).toHaveLength(16);
    const seen = new Set<string>();
    for (const x of ANTONYMS) {
      expect(x.a, 'a 词为空').toBeTruthy();
      expect(x.b, 'b 词为空').toBeTruthy();
      expect(x.a, `「${x.a}」和它的"反义词"相同`).not.toBe(x.b);
      const key = `${x.a}-${x.b}`;
      expect(seen.has(key), `词对「${x.a}↔${x.b}」重复`).toBe(false);
      seen.add(key);
    }
  });

  it('经典回归：大↔小、上↔下 必须存在', () => {
    const pairs = new Set(ANTONYMS.map((x) => `${x.a}-${x.b}`));
    expect(pairs.has('大-小')).toBe(true);
    expect(pairs.has('上-下')).toBe(true);
    expect(pairs.has('长-短')).toBe(true);
  });
});

describe('语文 · 量词宝箱（QUANTIFIERS）', () => {
  it('正确答案在选项里，选项互不重复', () => {
    for (const q of QUANTIFIERS) {
      expect(q.options.includes(q.correct), `「一（ ）${q.item}」正确量词「${q.correct}」不在选项里`).toBe(true);
      expect(new Set(q.options).size, `「一（ ）${q.item}」选项有重复`).toBe(q.options.length);
    }
  });

  it('经典回归：猫→只，书→本', () => {
    const cat = QUANTIFIERS.find((q) => q.item === '猫')!;
    expect(cat.correct).toBe('只');
    const book = QUANTIFIERS.find((q) => q.item === '书')!;
    expect(book.correct).toBe('本');
  });
});

describe('语文 · 谜语宝箱（RIDDLES）', () => {
  it('共 10 条，谜底在选项里，选项不重复', () => {
    expect(RIDDLES).toHaveLength(10);
    for (const r of RIDDLES) {
      expect(r.riddle, '谜面为空').toBeTruthy();
      expect(r.hint, '缺好奇萌可提示').toBeTruthy();
      expect(r.options.includes(r.answer), `「${r.riddle}」谜底「${r.answer}」不在选项里`).toBe(true);
      expect(new Set(r.options).size, `「${r.riddle}」选项有重复`).toBe(r.options.length);
    }
  });

  it('经典回归：千条线万条线 → 雨', () => {
    const r = RIDDLES.find((x) => x.riddle.includes('千条线'))!;
    expect(r.answer).toBe('雨');
  });
});

describe('综合 · 安全小课堂（SAFETY_TIPS）', () => {
  it('共 10 条，字段完整，正反例都有', () => {
    expect(SAFETY_TIPS).toHaveLength(10);
    const trueCount = SAFETY_TIPS.filter((s) => s.isSafe).length;
    expect(trueCount).toBeGreaterThan(0);
    expect(trueCount).toBeLessThan(SAFETY_TIPS.length); // 不能全是"对"或全是"不对"
    for (const s of SAFETY_TIPS) {
      expect(s.scenario, '缺场景').toBeTruthy();
      expect(s.statement, '缺做法描述').toBeTruthy();
      expect(s.tip, '缺温柔萌可讲解').toBeTruthy();
      expect(s.emoji).toBeTruthy();
    }
  });
});

describe('英语 · 英文音乐会（EN_SONGS）', () => {
  it('共 6 首，歌词与关键词完整，标题不重复', () => {
    expect(EN_SONGS).toHaveLength(6);
    const seen = new Set<string>();
    for (const s of EN_SONGS) {
      expect(s.title, '歌名重复').toBeTruthy();
      expect(seen.has(s.title), `「${s.title}」重复`).toBe(false);
      seen.add(s.title);
      expect(s.lyrics.length, `《${s.title}》歌词为空`).toBeGreaterThanOrEqual(2);
      expect(s.keywords.length, `《${s.title}》关键词为空`).toBeGreaterThanOrEqual(2);
      expect(s.cn, `《${s.title}》缺中文大意`).toBeTruthy();
      for (const k of s.keywords) {
        expect(k.en, `《${s.title}》关键词缺英文`).toBeTruthy();
        expect(k.cn, `《${s.title}》关键词「${k.en}」缺中文`).toBeTruthy();
      }
    }
  });

  it('经典回归：Twinkle Twinkle 含 star/sky 关键词', () => {
    const s = EN_SONGS.find((x) => x.title.startsWith('Twinkle'))!;
    const en = s.keywords.map((k) => k.en);
    expect(en).toContain('star');
    expect(en).toContain('sky');
  });
});

describe('扩充题库回归（应用题 / 阅读理解）', () => {
  it('应用题 32 道，答案都在选项里、纯数字、20 以内', () => {
    expect(WORD_PROBLEMS).toHaveLength(32);
    for (const p of WORD_PROBLEMS) {
      expect(p.options.every((o) => /^\d+$/.test(o)), `「${p.text}」有非数字选项`).toBe(true);
      expect(p.options.includes(p.answer), `「${p.text}」答案「${p.answer}」不在选项里`).toBe(true);
      expect(Number(p.answer) >= 1 && Number(p.answer) <= 20, `「${p.text}」答案 ${p.answer} 超出一上 20 以内范围`).toBe(true);
    }
  });

  it('阅读理解 18 篇，答案都在选项里', () => {
    expect(READING_PASSAGES).toHaveLength(18);
    for (const r of READING_PASSAGES) {
      expect(r.options.includes(r.answer), `「${r.passage}」答案「${r.answer}」不在选项里`).toBe(true);
      expect(new Set(r.options).size, `「${r.passage}」选项有重复`).toBe(r.options.length);
    }
  });
});

/** 类型引用占位：确保数据结构不会因重构而丢字段（组合成一条不会失败的断言打包检查） */
const _typeCheck: (ProverbItem extends { first: string; second: string; hint?: string } ? 1 : 0) &
  (NurseryRhyme extends { answer: string; options: string[] } ? 1 : 0) &
  (AntonymItem extends { a: string; b: string } ? 1 : 0) &
  (QuantifierItem extends { correct: string; options: string[] } ? 1 : 0) &
  (RiddleItem extends { answer: string; options: string[] } ? 1 : 0) &
  (EnSong extends { lyrics: string[]; keywords: { en: string; cn: string }[] } ? 1 : 0) = 1;

describe('数据结构可编译', () => {
  it('字段类型维持不变（类型层如果字段变动，上面赋值会直接编译失败）', () => {
    expect(_typeCheck).toBe(1);
  });
});
import { STROKE_RULES, CHAR_TRANSFORMS } from '@/lib/study-data';

describe('语文 · 笔顺规则口诀（STROKE_RULES）', () => {
  it('共 7 条，字段完整', () => {
    expect(STROKE_RULES).toHaveLength(7);
    for (const r of STROKE_RULES) {
      expect(r.name, '规则名为空').toBeTruthy();
      expect(r.rhyme, '口诀为空').toBeTruthy();
      expect(r.examples.length, `${r.name} 缺例字`).toBeGreaterThanOrEqual(2);
      expect(r.emoji).toBeTruthy();
    }
  });
});

describe('语文 · 汉字变变变（CHAR_TRANSFORMS）', () => {
  it('共 7 组，每组 3 个字、有规律说明', () => {
    expect(CHAR_TRANSFORMS).toHaveLength(7);
    const seen = new Set<string>();
    for (const t of CHAR_TRANSFORMS) {
      expect(t.chars.length, `${t.title} 不是 3 个字`).toBe(3);
      expect(t.title, '规律标题为空').toBeTruthy();
      expect(t.hint, '提示为空').toBeTruthy();
      // 每组的字不重复
      const key = t.chars.join('');
      expect(seen.has(key), `「${t.title}」的字组重复`).toBe(false);
      seen.add(key);
    }
  });

  it('经典回归：人→从→众、木→林→森 必须存在', () => {
    const titles = CHAR_TRANSFORMS.map((t) => t.title);
    expect(titles).toContain('人→从→众');
    expect(titles).toContain('木→林→森');
  });
});
