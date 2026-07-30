/* ============================================================
   程程学习工作台 — 自主学习内容数据
   结合人教版一年级上册 + RAZ AA + 幼小衔接
   ============================================================ */

export type Subject = '语文' | '数学' | '英语';

/* -------------------- 语文 -------------------- */
export interface PinyinItem {
  pinyin: string;
  tone: number; // 1-4, 0 为轻声
  examples: string[];
}

export const PINYIN_AOE: PinyinItem[] = [
  { pinyin: 'a', tone: 1, examples: ['阿姨 āyí', '啊 ā'] },
  { pinyin: 'o', tone: 1, examples: ['喔 ō', '哦 ó'] },
  { pinyin: 'e', tone: 1, examples: ['鹅 é', '饿 è'] },
  { pinyin: 'i', tone: 1, examples: ['衣服 yīfu', '一 yī'] },
  { pinyin: 'u', tone: 1, examples: ['乌龟 wūguī', '五 wǔ'] },
  { pinyin: 'ü', tone: 2, examples: ['鱼 yú', '雨 yǔ'] },
  { pinyin: 'b', tone: 0, examples: ['爸爸 bàba', '笔 bǐ'] },
  { pinyin: 'p', tone: 0, examples: ['苹果 píngguǒ', '跑 pǎo'] },
  { pinyin: 'm', tone: 0, examples: ['妈妈 māma', '猫 māo'] },
  { pinyin: 'f', tone: 0, examples: ['飞机 fēijī', '风 fēng'] },
];

export const PINYIN_SIMPLE: PinyinItem[] = [
  { pinyin: 'ba', tone: 1, examples: ['巴 bā', '八 bā'] },
  { pinyin: 'ma', tone: 1, examples: ['妈 mā', '麻 má'] },
  { pinyin: 'pa', tone: 4, examples: ['怕 pà', '爬 pá'] },
  { pinyin: 'di', tone: 4, examples: ['地 dì', '第 dì'] },
  { pinyin: 'ti', tone: 1, examples: ['踢 tī', '梯 tī'] },
  { pinyin: 'ni', tone: 3, examples: ['你 nǐ', '里 lǐ'] },
];

export interface CharacterItem {
  char: string;
  strokeCount: number;
  meaning: string;
  phrase: string;
}

export const CHARACTERS_L1: CharacterItem[] = [
  { char: '天', strokeCount: 4, meaning: '天空', phrase: '今天天气好' },
  { char: '地', strokeCount: 6, meaning: '大地', phrase: '大地是绿色的' },
  { char: '人', strokeCount: 2, meaning: '人们', phrase: '大人小孩' },
  { char: '你', strokeCount: 7, meaning: '对方', phrase: '你好呀' },
  { char: '我', strokeCount: 7, meaning: '自己', phrase: '我是程程' },
  { char: '他', strokeCount: 5, meaning: '第三方', phrase: '他是萌可' },
  { char: '一', strokeCount: 1, meaning: '数字 1', phrase: '一个苹果' },
  { char: '二', strokeCount: 2, meaning: '数字 2', phrase: '二只小鸟' },
  { char: '三', strokeCount: 3, meaning: '数字 3', phrase: '三只兔子' },
  { char: '口', strokeCount: 3, meaning: '嘴巴', phrase: '一口水' },
  { char: '耳', strokeCount: 6, meaning: '耳朵', phrase: '竖起耳朵' },
  { char: '目', strokeCount: 5, meaning: '眼睛', phrase: '目不转睛' },
  { char: '日', strokeCount: 4, meaning: '太阳/日子', phrase: '红日东升' },
  { char: '月', strokeCount: 4, meaning: '月亮', phrase: '弯弯的月儿' },
  { char: '水', strokeCount: 4, meaning: '水流', phrase: '清水哗哗流' },
  { char: '火', strokeCount: 4, meaning: '火焰', phrase: '红红火火' },
];

export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

export const POEMS: PoemItem[] = [
  {
    title: '咏鹅',
    author: '骆宾王',
    lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'],
  },
  {
    title: '悯农（其二）',
    author: '李绅',
    lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'],
  },
  {
    title: '静夜思',
    author: '李白',
    lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'],
  },
  {
    title: '江南',
    author: '汉乐府',
    lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，', '鱼戏莲叶西。'],
  },
];

/* -------------------- 数学 -------------------- */
export const NUMBER_SENSE = Array.from({ length: 10 }, (_, i) => ({
  num: i + 1,
  finger: '👆'.repeat(i + 1),
  dots: i + 1,
}));

export interface CompareItem {
  left: number;
  right: number;
  type: 'size' | 'quantity';
  leftIcon: string;
  rightIcon: string;
}

export const COMPARE_QUESTIONS: CompareItem[] = [
  { left: 3, right: 7, type: 'quantity', leftIcon: '🍎', rightIcon: '🍊' },
  { left: 5, right: 2, type: 'quantity', leftIcon: '🐰', rightIcon: '🥕' },
  { left: 6, right: 6, type: 'quantity', leftIcon: '⭐', rightIcon: '🌟' },
  { left: 4, right: 9, type: 'quantity', leftIcon: '🍰', rightIcon: '🍭' },
  { left: 8, right: 3, type: 'quantity', leftIcon: '🚗', rightIcon: '🚕' },
];

export interface AngleItem {
  name: '锐角' | '直角' | '钝角';
  desc: string;
  emoji: string;
  deg: number;
}

export const ANGLES: AngleItem[] = [
  { name: '锐角', desc: '比直角小，尖尖的', emoji: '🔺', deg: 45 },
  { name: '直角', desc: '方方正正，像书本的角', emoji: '📐', deg: 90 },
  { name: '钝角', desc: '比直角大，张得开开的', emoji: '😮', deg: 120 },
];

export interface MathQuestion {
  a: number;
  b: number;
  op: '+' | '-';
}

export function makeMathQuestions(level: 'easy' | 'medium' | 'hard' = 'easy'): MathQuestion[] {
  const qs: MathQuestion[] = [];
  for (let i = 0; i < 10; i++) {
    const op = Math.random() > 0.5 ? '+' : '-';
    let a = Math.floor(Math.random() * 8) + 1;
    let b = Math.floor(Math.random() * 8) + 1;
    if (op === '-') {
      if (a < b) [a, b] = [b, a];
    } else {
      if (a + b > 10) a = 10 - b;
    }
    qs.push({ a, b, op });
  }
  return qs;
}

/* -------------------- 英语 -------------------- */
export interface LetterItem {
  letter: string;
  word: string;
  emoji: string;
}

export const LETTERS: LetterItem[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Ball', emoji: '⚽' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Egg', emoji: '🥚' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Grape', emoji: '🍇' },
  { letter: 'H', word: 'Hat', emoji: '🧢' },
];

export interface WordItem {
  word: string;
  cn: string;
  emoji: string;
  sentence?: string;
}

// RAZ AA 级核心词 + 常见幼小词汇
export const RAZ_AA_WORDS: WordItem[] = [
  { word: 'apple', cn: '苹果', emoji: '🍎', sentence: 'I see an apple.' },
  { word: 'dog', cn: '狗', emoji: '🐶', sentence: 'I see a dog.' },
  { word: 'cat', cn: '猫', emoji: '🐱', sentence: 'I see a cat.' },
  { word: 'sun', cn: '太阳', emoji: '☀️', sentence: 'I see the sun.' },
  { word: 'red', cn: '红色', emoji: '🔴', sentence: 'The apple is red.' },
  { word: 'blue', cn: '蓝色', emoji: '🔵', sentence: 'The sky is blue.' },
  { word: 'big', cn: '大的', emoji: '🐘', sentence: 'The elephant is big.' },
  { word: 'little', cn: '小的', emoji: '🐜', sentence: 'The ant is little.' },
  { word: 'jump', cn: '跳', emoji: '🦘', sentence: 'I can jump.' },
  { word: 'run', cn: '跑', emoji: '🏃', sentence: 'I can run.' },
  { word: 'sleep', cn: '睡觉', emoji: '😴', sentence: 'I go to sleep.' },
  { word: 'eat', cn: '吃', emoji: '🍽️', sentence: 'I like to eat.' },
  { word: 'book', cn: '书', emoji: '📖', sentence: 'I read a book.' },
  { word: 'school', cn: '学校', emoji: '🏫', sentence: 'I go to school.' },
  { word: 'friend', cn: '朋友', emoji: '🧑‍🤝‍🧑', sentence: 'You are my friend.' },
  { word: 'happy', cn: '开心', emoji: '😊', sentence: 'I am happy.' },
];

export const COLORS_WORDS: WordItem[] = [
  { word: 'red', cn: '红色', emoji: '🔴' },
  { word: 'yellow', cn: '黄色', emoji: '🟡' },
  { word: 'green', cn: '绿色', emoji: '🟢' },
  { word: 'blue', cn: '蓝色', emoji: '🔵' },
];

export const BODY_WORDS: WordItem[] = [
  { word: 'eye', cn: '眼睛', emoji: '👁️' },
  { word: 'ear', cn: '耳朵', emoji: '👂' },
  { word: 'nose', cn: '鼻子', emoji: '👃' },
  { word: 'mouth', cn: '嘴巴', emoji: '👄' },
  { word: 'hand', cn: '手', emoji: '✋' },
  { word: 'foot', cn: '脚', emoji: '🦶' },
];
