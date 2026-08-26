/* ============================================================
   程程学习工作台 — 学习内容数据统一入口
   ============================================================ */

// ===== Types =====
export type Subject = '语文' | '数学' | '英语';

// ===== 拼音体系 =====
export interface PinyinItem {
  pinyin: string;
  tone: number;
  examples: string[];
}
export interface PinyinBlendItem {
  sheng: string;
  yun: string;
  syllable: string;
  word: string;
  emoji: string;
}
export {
  PINYIN_GROUPS,
  PINYIN_HAN,
  PINYIN_TONES,
  applyTone,
  PINYIN_BLEND,
} from './pinyin';

// ===== 识字字库 =====
export interface CharacterItem {
  char: string;
  pinyin: string;
  strokeCount: number;
  meaning: string;
  phrase: string;
  category: string;
  altPinyin?: string;
}
export {
  CHARACTERS,
  CHARACTER_CATEGORIES,
  MULTI_READINGS,
} from './chinese-characters';

// ===== 古诗词、课文、趣味化 =====
export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}
export interface TextItem {
  title: string;
  emoji: string;
  lines: string[];
}
export interface TextCharItem {
  char: string;
  phrase: string;
}
export interface TextCharLesson {
  title: string;
  emoji: string;
  items: TextCharItem[];
}
export interface MyDayItem {
  time: string;
  emoji: string;
  text: string;
}
export interface PoemPictureQ {
  poem: string;
  hint: string;
  options: string[];
  answer: string;
}
export interface StrokeItem {
  stroke: string;
  name: string;
  example: string;
  dir: string;
}
export interface StrokeRule {
  name: string;
  rhyme: string;
  examples: string[];
  emoji: string;
}
export interface CharTransform {
  chars: string[];
  title: string;
  hint: string;
  emoji: string;
}
export {
  POEMS,
  TEXTS,
  POEM_PICTURE_Q,
  MY_DAY,
  FINGER_READ,
  STROKES,
  STROKE_RULES,
  CHAR_TRANSFORMS,
  TEXT_CHAR_LESSONS,
  TRACE_CHARS,
} from './chinese-poems';

// ===== 阅读理解、儿歌、谚语、反义词、量词、谜语、安全、组词 =====
export interface ReadingItem {
  passage: string;
  question: string;
  options: string[];
  answer: string;
  emoji: string;
  chapter?: string;
}
export interface NurseryRhyme {
  title: string;
  emoji: string;
  lines: string[];
  question: string;
  options: string[];
  answer: string;
  tip: string;
}
export interface ProverbItem {
  first: string;
  second: string;
  hint: string;
  emoji: string;
}
export interface AntonymItem {
  a: string;
  b: string;
  emojiA: string;
  emojiB: string;
}
export interface QuantifierItem {
  item: string;
  correct: string;
  options: string[];
  emoji: string;
}
export interface RiddleItem {
  riddle: string;
  answer: string;
  options: string[];
  hint: string;
  emoji: string;
}
export interface SafetyItem {
  scenario: string;
  statement: string;
  isSafe: boolean;
  tip: string;
  emoji: string;
}
export interface WordFormItem {
  char: string;
  word: string;
  wrongWords: string[];
  sentenceOk: string;
  sentenceWrong: string[];
}
export {
  READING_PASSAGES,
  NURSERY_RHYMES,
  PROVERBS,
  ANTONYMS,
  QUANTIFIERS,
  RIDDLES,
  SAFETY_TIPS,
  WORD_FORM,
} from './chinese-other';

// ===== 生字表派生 =====
export interface TextbookChar {
  char: string;
  pinyin: string;
  strokeCount: number;
  meaning: string;
  phrase: string;
  category: string;
  chapter: number;
  unit: string;
}
export interface UnitWordItem {
  char: string;
  word: string;
  wrongWords: string[];
  unit: string;
  chapter: number;
}
export interface CharUnit {
  unit: string;
  chapter: number;
  emoji: string;
  text: string;
  chars: string[];
  words: string[];
}
export {
  TEXTBOOK_CHARACTERS,
  STROKE_ORDER_CHARS,
  strokeOrderByChapter,
  CHAR_UNIT_OPTIONS,
  textbookCharsUpTo,
  buildUnitWordItems,
  GRADE1_CHAR_UNITS,
  CHINESE_UNITS,
  chineseUnitsOfModule,
} from './chinese-poems';
export type { ChineseUnit } from './chinese-poems';

// ===== 数学 =====
export interface CompareItem {
  left: number;
  right: number;
  type: 'quantity';
  leftIcon: string;
  rightIcon: string;
}
export interface ShapeItem {
  name: string;
  emoji: string;
  sides: number;
  desc: string;
}
export interface AngleItem {
  name: '锐角' | '直角' | '钝角';
  desc: string;
  emoji: string;
  deg: number;
}
export interface MathQuestion {
  a: number;
  b: number;
  op: '+' | '-';
}
export interface WordProblemItem {
  text: string;
  options: string[];
  answer: string;
  emoji: string;
}
export interface CvcItem {
  word: string;
  sound: string;
  emoji: string;
  cn: string;
}
export interface SplitItem {
  num: number;
  pairs: [number, number][];
}
export interface OrdinalItem {
  row: string[];
  ask: number;
  question: string;
  answer: string;
}
export interface ClockItem {
  hour: number;
  label: string;
}
export interface ClockHalfItem {
  hour: number;
  label: string;
}
export interface CompareMoreItem {
  a: string;
  b: string;
  question: string;
  options: string[];
  answer: string;
}
export interface CalendarItem {
  question: string;
  options: string[];
  answer: string;
  emoji: string;
}
export interface SchoolItem {
  name: string;
  emoji: string;
  bring: boolean;
}
export interface PositionItem {
  word: string;
  emoji: string;
  desc: string;
  example: string;
}
export interface SolidShapeItem {
  name: string;
  emoji: string;
  desc: string;
  roll: string;
}
export interface Number1120Item {
  num: number;
  tens: number;
  ones: number;
  compose: string;
}
export interface MathUnit {
  chapter: number;
  unit: string;
  emoji: string;
  goal: string;
  moduleKeys: string[];
}
export {
  makeCompareQuestion,
  SHAPES,
  ANGLES,
  makeMathQuestions,
  WORD_PROBLEMS,
  CVC_WORDS,
  SPLITS,
  ORDINALS,
  CLOCKS,
  CLOCK_HALF,
  COMPARE_MORE,
  WEEK_CALENDAR,
  SCHOOL_ITEMS,
  POSITIONS,
  SOLID_SHAPES,
  NUMBERS_1120,
  MATH_UNITS,
  mathUnitsOfModule,
} from './math';

// NUMBER_SENSE
export const NUMBER_SENSE = Array.from({ length: 10 }, (_, i) => ({
  num: i + 1,
  finger: '👆'.repeat(i + 1),
  dots: i + 1,
}));

// ===== 英语 =====
export interface LetterItem {
  letter: string;
  word: string;
  emoji: string;
}
export interface WordItem {
  word: string;
  sound: string;
  emoji: string;
  cn: string;
  topic: string;
}
export interface EnSentenceItem {
  sentence: string;
  options: string[];
  answer: string;
  speak: string;
  emoji: string;
}
export interface EnSong {
  title: string;
  emoji: string;
  lyrics: string[];
  cn: string;
  keywords: { en: string; cn: string }[];
}
export interface EnUnit {
  unit: string;
  title: string;
  emoji: string;
  topics: string[];
  extra?: boolean;
}
export interface EnWordTopic {
  topic: string;
  emoji: string;
  words: { word: string; sound: string; emoji: string; cn: string; topic: string }[];
}
export type {
  LETTERS,
  EN_WORD_TOPICS,
  ALL_EN_WORDS,
  EN_SENTENCES,
  EN_UNITS,
  EN_SONGS,
  enUnitsOfModule,
} from './english';