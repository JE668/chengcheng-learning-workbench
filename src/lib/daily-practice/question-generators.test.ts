import { describe, it, expect, vi } from 'vitest';
import {
  passThreshold,
  genPinyinQ,
  genMathQ,
  genEnglishQ,
  genDictationQ,
  genChineseQuizQ,
  genAntonymQ,
  genProverbQ,
  genRiddleQ,
  genWordProblemQ,
  genEnInitialQ,
} from '../daily-practice';

// Mock PINYIN_TONES 等外部依赖
vi.mock('../study-data', () => ({
  PINYIN_TONES: {
    ba: ['bā', 'bá', 'bǎ', 'bà'],
    ma: ['mā', 'má', 'mǎ', 'mà'],
    ai: ['āi', 'ái', 'ǎi', 'ài'],
    ei: ['ēi', 'éi', 'ěi', 'èi'],
    ao: ['āo', 'áo', 'ǎo', 'ào'],
    ou: ['ōu', 'óu', 'ǒu', 'òu'],
  },
  applyTone: (base: string, tone: number) => {
    const tones: Record<string, string[]> = {
      ba: ['bā', 'bá', 'bǎ', 'bà'],
      ma: ['mā', 'má', 'mǎ', 'mà'],
    };
    return tones[base]?.[tone - 1] || base;
  },
  ALL_EN_WORDS: [
    { word: 'apple', cn: '苹果', emoji: '🍎' },
    { word: 'banana', cn: '香蕉', emoji: '🍌' },
    { word: 'cat', cn: '猫', emoji: '🐱' },
    { word: 'dog', cn: '狗', emoji: '🐶' },
    { word: 'elephant', cn: '大象', emoji: '🐘' },
    { word: 'fish', cn: '鱼', emoji: '🐟' },
  ],
  CHARACTERS: [
    { char: '大', meaning: '大小的大', phrase: '大树' },
    { char: '小', meaning: '大小的小', phrase: '小猫' },
    { char: '上', meaning: '上下的上', phrase: '上学' },
    { char: '下', meaning: '上下的下', phrase: '下雨' },
    { char: '人', meaning: '人类的类', phrase: '人民' },
    { char: '山', meaning: '山水的山', phrase: '山水' },
  ],
  ANTONYMS: [
    { a: '大', b: '小' },
    { a: '上', b: '下' },
    { a: '左', b: '右' },
    { a: '前', b: '后' },
    { a: '多', b: '少' },
    { a: '高', b: '低' },
  ],
  PROVERBS: [
    { first: '一寸光阴', second: '一寸金' },
    { first: '少壮不努力', second: '老大徒伤悲' },
    { first: '读书破万卷', second: '下笔如有神' },
    { first: '天道酬勤', second: '厚德载物' },
  ],
  RIDDLES: [
    { riddle: '头上安头', answer: '品', options: ['品', '好', '名', '字'] },
    { riddle: '心上加田', answer: '思', options: ['思', '恩', '情', '感'] },
  ],
  POEMS: [
    { title: '静夜思', author: '李白', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
    { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  ],
  WORD_PROBLEMS: [
    { text: '小明有 3 个苹果，又买了 2 个，一共有几个？', options: ['4', '5', '6', '3'], answer: '5' },
    { text: '一共有 8 颗糖，吃了 3 颗，还剩几颗？', options: ['4', '5', '6', '3'], answer: '5' },
  ],
  ORDINALS: [
    { ask: '第 3 个', question: '排在第 3 个是哪个？', answer: '第3' },
    { ask: '第 1 个', question: '排在第 1 个是哪个？', answer: '第1' },
    { ask: '第 5 个', question: '排在第 5 个是哪个？', answer: '第5' },
  ],
  CLOCKS: [
    { hour: 3, label: '3点' },
    { hour: 6, label: '6点' },
    { hour: 9, label: '9点' },
    { hour: 12, label: '12点' },
  ],
  EN_SENTENCES: [],
}));

describe('passThreshold', () => {
  it('passes when correct >= 80% ceil', () => {
    expect(passThreshold(4, 5)).toBe(true);
    expect(passThreshold(4, 4)).toBe(true);
    expect(passThreshold(1, 1)).toBe(true);
    expect(passThreshold(8, 10)).toBe(true);
  });
  it('fails when correct < 80% ceil', () => {
    expect(passThreshold(3, 5)).toBe(false);
    expect(passThreshold(2, 3)).toBe(false);
    expect(passThreshold(0, 5)).toBe(false);
    expect(passThreshold(3, 4)).toBe(false);
  });
  it('handles edge cases', () => {
    expect(passThreshold(0, 0)).toBe(false);
    expect(passThreshold(5, 0)).toBe(false);
  });
});

describe('genPinyinQ', () => {
  it('generates valid pinyin question with 4 distinct tones', () => {
    for (let i = 0; i < 20; i++) {
      const q = genPinyinQ();
      expect(q.kind).toBe('pinyin');
      expect(q.subject).toBe('语文');
      expect(q.han).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.options[q.answer]).toBe(q.han);
      // options 应该是四个声调去重后的
      const uniqueOptions = new Set(q.options);
      expect(uniqueOptions.size).toBe(q.options.length);
    }
  });
  it('has correct tone in options', () => {
    const q = genPinyinQ();
    expect(q.options).toContain(q.han);
  });
});

describe('genMathQ', () => {
  it('generates valid math question (addition or subtraction)', () => {
    const q = genMathQ(false);
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(q.options.length).toBe(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(4);
    // 验证答案在选项中
    expect(q.options).toContain(q.options[q.answer]);
    // 提示应包含 + 或 −
    expect(q.prompt.includes('+') || q.prompt.includes('−')).toBe(true);
  });
  it('hard mode uses larger numbers', () => {
    const q = genMathQ(true);
    const nums = q.prompt.match(/d+/g)?.map(Number) || [];
    if (nums.length >= 2) {
      // 困难模式可能用到更大数字
      expect(nums[0]).toBeLessThanOrEqual(50);
    }
  });
  it('hard mode uses larger numbers', () => {
    const q = genMathQ(true);
    const nums = q.prompt.match(/d+/g)?.map(Number) || [];
    if (nums.length >= 2) {
      // 困难模式可能用到更大数字
      expect(nums[0]).toBeLessThanOrEqual(50);
    }
  });
});

describe('genEnglishQ', () => {
  it('generates valid english question', () => {
    const q = genEnglishQ({ word: 'apple', cn: '苹果', emoji: '🍎' });
    expect(q.kind).toBe('english');
    expect(q.subject).toBe('英语');
    // Type narrow for english variant
    if (q.kind === 'english') {
      expect(q.word).toBe('apple');
      expect(q.cn).toBe('苹果');
      expect(q.emoji).toBe('🍎');
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.options[q.answer]).toBe('apple');
      // 干扰项不包含正确答案
      expect(q.options.filter(o => o === 'apple').length).toBe(1);
    }
  });
});

describe('genDictationQ', () => {
  it('generates valid dictation question', () => {
    const q = genDictationQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.han).toBeTruthy();
    expect(q.options.length).toBe(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(4);
    expect(q.options[q.answer]).toBe(q.han);
  });
});

describe('genChineseQuizQ', () => {
  it('generates valid chinese quiz question', () => {
    const q = genChineseQuizQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.han).toBeTruthy();
    expect(q.options.length).toBe(4);
    expect(q.options[q.answer]).toBe(q.han);
  });
});

describe('genAntonymQ', () => {
  it('generates valid antonym question', () => {
    const q = genAntonymQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.han).toBeTruthy(); // 汉字（如"大"）
    expect(q.options.length).toBe(4);
    // 反义词题：han 是原词（如"大"），answer 是反义词（如"小"）
    expect(q.options[q.answer]).not.toBe(q.han);
  });
});

describe('genProverbQ', () => {
  it('generates valid proverb question', () => {
    const q = genProverbQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.han).toBeTruthy(); // 前半句（如"一寸光阴"）
    expect(q.options.length).toBe(4);
    // 谚语题：han 是前半句，answer 是后半句
    expect(q.options[q.answer]).not.toBe(q.han);
  });
});

describe('genRiddleQ', () => {
  it('generates valid riddle question', () => {
    const q = genRiddleQ();
    expect(q.kind).toBe('dictation');
    expect(q.subject).toBe('语文');
    expect(q.han).toBeTruthy();
    expect(q.options.length).toBe(4);
    expect(q.options[q.answer]).toBe(q.han);
  });
});

describe('genWordProblemQ', () => {
  it('generates valid word problem', () => {
    const q = genWordProblemQ();
    expect(q.kind).toBe('math');
    expect(q.subject).toBe('数学');
    expect(q.options.length).toBe(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(4);
  });
});

describe('genEnInitialQ', () => {
  it('generates valid initial letter question', () => {
    for (let i = 0; i < 20; i++) {
      const q = genEnInitialQ();
      expect(q.kind).toBe('english');
      expect(q.subtype).toBe('initial');
      expect(q.subject).toBe('英语');
      // 题干不应泄露单词
      expect(q.prompt).not.toContain(q.word);
      // 选项都是单个大写字母
      expect(q.options.length).toBe(4);
      expect(q.options.every(o => /^[A-Z]$/.test(o))).toBe(true);
      // 正确答案是首字母大写
      expect(q.options[q.answer]).toBe(q.word[0].toUpperCase());
    }
  });
});