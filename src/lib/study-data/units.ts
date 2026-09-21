/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */
import { CHARACTERS, type CharacterItem } from './characters';
import type { StrokeOrderItem } from './writing';

export interface CharUnit {
  unit: string;
  chapter: number; // 对应课本章节 idx
  emoji: string;
  text: string; // 单元导语 / 课文句子
  chars: string[]; // 本单元会认字
  words: string[]; // 本单元可听写词语
}

export const GRADE1_CHAR_UNITS: CharUnit[] = [
  {
    unit: '我上学了',
    chapter: 1,
    emoji: '🏫',
    text: '上学歌：太阳当空照，花儿对我笑。爱学习，爱祖国。',
    chars: ['我', '上', '学', '了', '爱', '国', '中', '你', '们'],
    words: ['我们', '上学', '中国', '爱你', '你们'],
  },
  {
    unit: '识字（一）· 天地人',
    chapter: 2,
    emoji: '🌍',
    text: '天 地 人 你 我 他；一二三四五，金木水火土。',
    chars: [
      '天', '地', '人', '你', '我', '他', '一', '二', '三', '四', '五', '上', '下',
      '口', '耳', '目', '手', '足', '站', '坐',
      '日', '月', '山', '川', '水', '火', '田', '禾',
      '对', '云', '雨', '风', '花', '鸟', '虫',
      '六', '七', '八', '九', '十',
    ],
    words: ['天上', '土地', '口水', '日子', '火山', '田地', '虫子', '雨水', '花鸟', '手足', '日月', '山水', '坐下'],
  },
  {
    unit: '汉语拼音（一）',
    chapter: 3,
    emoji: '🔤',
    text: '拼音单元：拼一拼、读一读，认识更多字。',
    chars: ['爸', '妈', '马', '土', '不', '画', '打', '棋', '鸡'],
    words: ['爸妈', '马车', '土地', '画画', '打球', '下棋', '小鸡'],
  },
  {
    unit: '汉语拼音（二）',
    chapter: 4,
    emoji: '🔡',
    text: '拼音单元：字、词、句、子，学语文。',
    chars: ['字', '词', '语', '句', '子', '桌', '纸', '文', '数', '学', '音', '乐'],
    words: ['字词', '句子', '桌子', '白纸', '语文', '数学', '音乐'],
  },
  {
    unit: '汉语拼音（三）',
    chapter: 5,
    emoji: '🔣',
    text: '拼音单元：读儿歌，认生字。',
    chars: ['妹', '奶', '白', '皮', '小', '桥', '台', '雪', '儿', '草', '家', '是', '车', '羊', '走', '也'],
    words: ['妹妹', '奶奶', '皮球', '小桥', '台上', '雪人', '儿子', '草地', '大家', '马车', '也是'],
  },
  {
    unit: '阅读（一）· 秋天·小小的船·江南·四季',
    chapter: 6,
    emoji: '🍂',
    text: '秋天来了，小小的船，江南可采莲，四季更替。',
    chars: [
      '秋', '气', '了', '树', '叶', '片', '大', '飞', '会', '个',
      '的', '船', '两', '头', '在', '里', '看', '见', '闪', '星',
      '江', '南', '可', '采', '莲', '鱼', '东', '西', '北',
      '尖', '说', '春', '青', '蛙', '夏', '弯', '皮', '地', '就', '冬',
    ],
    words: ['秋天', '天气', '树叶', '飞机', '开会', '小船', '两头', '看见', '星星', '江南', '莲叶', '东西', '东北', '尖尖的', '春天', '青蛙', '夏天', '冬天'],
  },
  {
    unit: '识字（二）· 画·大小多少·小书包·日月明·升国旗',
    chapter: 7,
    emoji: '✏️',
    text: '画里藏字，大小多少，小书包，日月明，升国旗。',
    chars: [
      '画', '远', '色', '近', '听', '无', '声', '去', '还', '来',
      '多', '少', '黄', '牛', '只', '猫', '边', '鸭', '苹', '果', '杏', '桃',
      '包', '尺', '作', '业', '笔', '刀', '课', '本', '早', '校',
      '明', '力', '男', '尘', '从', '众', '双', '木', '林', '森', '条',
      '升', '国', '旗', '中', '红', '歌', '起', '么', '美', '丽', '立',
    ],
    words: ['画画', '远近', '听到', '无声', '来去', '多少', '黄牛', '小猫', '苹果', '书包', '尺子', '作业', '本子', '早上', '学校', '明月', '力气', '尘土', '树林', '森林', '一条', '升旗', '中国', '红旗', '国歌', '美丽', '起立'],
  },
  {
    unit: '阅读（二）· 影子·比尾巴·青蛙写诗·雨点儿',
    chapter: 8,
    emoji: '👣',
    text: '影子跟着我，比尾巴，青蛙写诗，雨点儿沙沙。',
    chars: [
      '影', '前', '后', '黑', '狗', '左', '右', '它', '好', '朋', '友',
      '尾', '巴', '谁', '长', '短', '把', '伞', '兔', '最', '公',
      '写', '诗', '点', '要', '过', '给', '当', '串', '们', '以', '成',
      '数', '彩', '半', '空', '问', '到', '方', '没', '更', '绿', '出',
    ],
    words: ['影子', '前后', '黑狗', '左右', '朋友', '尾巴', '长短', '一把', '兔子', '公鸡', '写字', '诗歌', '过来', '当心', '我们', '以后', '成长'],
  },
  {
    unit: '阅读（三）· 远足·大还是小·项链·雪地·乌鸦·蜗牛',
    chapter: 9,
    emoji: '🐌',
    text: '明天要远足，大还是小，项链，雪地里的小画家，乌鸦喝水，小蜗牛。',
    chars: [
      '睡', '那', '海', '真', '老', '师', '吗', '同', '什', '才', '亮',
      '时', '候', '觉', '得', '自', '己', '很', '穿', '衣', '服', '快',
      '蓝', '又', '笑', '着', '向', '和', '贝', '娃', '挂', '活', '金',
      '群', '竹', '牙', '用', '几', '步', '为', '参', '加', '洞', '鸡',
      '乌', '鸦', '处', '找', '办', '许', '法', '放', '进', '高',
      '住', '孩', '玩', '吧', '发', '芽', '爬', '呀', '久', '回', '全', '变',
    ],
    words: ['睡觉', '大海', '老师', '同学', '什么', '天才', '明亮', '时候', '觉得', '自己', '穿衣', '衣服', '快乐', '蓝色', '笑着', '贝壳', '娃娃', '金鱼', '雪花', '参加', '乌鸦', '找到', '办法', '进出', '高处', '孩子', '发芽'],
  },
];

/* ============================================================
 * 生字表派生数据
 * ------------------------------------------------------------
 * 识字课文 / 家长听写 / 识字闯关 / 组词造句 共用 GRADE1_CHAR_UNITS 一份表，
 * 下面这些派生结构负责把「单元 → 字 / 词」翻成各练习模块要的形状：
 *  · TEXTBOOK_CHARACTERS   给识字闯关按课本顺序出题（只收已有释义的字）
 *  · buildUnitWordItems()  给组词造句按单元词语出「组词」题
 *  · STROKE_ORDER_CHARS    给笔顺动画按课本顺序排字
 * ============================================================ */

const CHAR_META = new Map<string, CharacterItem>(CHARACTERS.map((c) => [c.char, c]));

export interface TextbookChar extends CharacterItem {
  chapter: number;
  unit: string;
}

/**
 * 课本生字表 ∩ 已有释义的字，按单元先后排列。
 * 识字闯关需要 meaning 做选项，所以生字表里还没写释义的字先不出题
 * （想扩题量就往 CHARACTERS 里补该字的 meaning / phrase 即可，无需改模块）。
 */
export const TEXTBOOK_CHARACTERS: TextbookChar[] = (() => {
  const out: TextbookChar[] = [];
  const seen = new Set<string>();
  for (const u of GRADE1_CHAR_UNITS) {
    for (const c of u.chars) {
      const meta = CHAR_META.get(c);
      if (!meta || seen.has(c)) continue; // 课本里复现的字（如「了」「们」）只按首次出现的单元收一次
      seen.add(c);
      out.push({ ...meta, chapter: u.chapter, unit: u.unit });
    }
  }
  return out;
})();

/**
 * 笔顺动画字表：全册生字按课本顺序排，替代原先手写的 16 字小表。
 * hanzi-writer 按字取笔画数据，所以这里只要给出字 + 标音 + 释义。
 */
export const STROKE_ORDER_CHARS: StrokeOrderItem[] = TEXTBOOK_CHARACTERS.map((c) => ({
  char: c.char,
  py: c.pinyin,
  mean: c.meaning,
}));

/** 按课本单元取笔顺字表，chapter 传 0 表示全册 */
export function strokeOrderByChapter(chapter: number): StrokeOrderItem[] {
  const src = chapter > 0 ? TEXTBOOK_CHARACTERS.filter((c) => c.chapter === chapter) : TEXTBOOK_CHARACTERS;
  return src.map((c) => ({ char: c.char, py: c.pinyin, mean: c.meaning }));
}

/** 生字表覆盖到的课本单元（供 UI 做单元切换） */
export const CHAR_UNIT_OPTIONS: { chapter: number; unit: string; emoji: string; count: number }[] =
  GRADE1_CHAR_UNITS.map((u) => ({
    chapter: u.chapter,
    unit: u.unit,
    emoji: u.emoji,
    count: TEXTBOOK_CHARACTERS.filter((c) => c.chapter === u.chapter).length,
  }));

/** 取到第 chapter 单元（含）为止的生字，用于难度分层 */
export function textbookCharsUpTo(chapter: number): TextbookChar[] {
  return TEXTBOOK_CHARACTERS.filter((c) => c.chapter <= chapter);
}

/** 由生字表词语派生的「组词」题 */
export interface UnitWordItem {
  char: string; // 要组词的字
  word: string; // 本单元里含该字的词
  wrongWords: string[]; // 干扰词：来自别的单元，且一定不含该字
  unit: string;
  chapter: number;
}

const ALL_UNIT_WORDS = Array.from(new Set(GRADE1_CHAR_UNITS.flatMap((u) => u.words)));

function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/**
 * 把生字表的词语变成组词题。
 * 沿用 WORD_FORM 的铁律：干扰词绝不能含 char 本身，否则也是正确答案。
 */
export function buildUnitWordItems(): UnitWordItem[] {
  const seen = new Set<string>();
  const items: UnitWordItem[] = [];
  for (const u of GRADE1_CHAR_UNITS) {
    const unitChars = new Set(u.chars);
    for (const word of u.words) {
      const char = word.split('').find((c) => unitChars.has(c));
      if (!char) continue;
      const key = `${char}|${word}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const wrongWords = pickN(
        ALL_UNIT_WORDS.filter((w) => w !== word && !w.includes(char)),
        3,
      );
      if (wrongWords.length < 3) continue;
      items.push({ char, word, wrongWords, unit: u.unit, chapter: u.chapter });
    }
  }
  return items;
}

/* ============================================================
 * 数学 · 按课本单元对齐
 * ------------------------------------------------------------
 * chapter 对应 textbooks.ts 里 math 的章节 idx（PDF 也是按这个切的），
 * moduleKeys 指向 study-modules.ts 里 math 学科的模块 key，
 * 这样「翻到课本第几单元 → 点开对应练习」就能一一对上。
 * 有测试校验：每个 key 都真实存在，且所有数学模块都至少归到一个单元。
 * ============================================================ */
export interface MathUnit {
  chapter: number;
  unit: string; // 课本单元名（与 textbooks.ts 标题对应，去掉多余空格）
  emoji: string;
  goal: string; // 这一单元要掌握什么
  moduleKeys: string[];
}

export const MATH_UNITS: MathUnit[] = [
  {
    chapter: 1,
    unit: '数学游戏',
    emoji: '🎲',
    goal: '数一数、比一比、找规律，先玩起来',
    moduleKeys: ['count', 'compare', 'position', 'pattern'],
  },
  {
    chapter: 2,
    unit: '一 · 5 以内数的认识和加减法',
    emoji: '✋',
    goal: '认识 1~5，会 5 以内的加减和分与合',
    moduleKeys: ['count', 'split', 'calc', 'ordinal'],
  },
  {
    chapter: 3,
    unit: '二 · 6~10 的认识和加减法',
    emoji: '🔟',
    goal: '认识 6~10，会 10 以内加减与看图列式',
    moduleKeys: ['split', 'calc', 'pic-eq', 'word-problem'],
  },
  {
    chapter: 4,
    unit: '三 · 认识立体图形',
    emoji: '📦',
    goal: '认识长方体、正方体、圆柱和球',
    moduleKeys: ['solid', 'shape', 'angle'],
  },
  {
    chapter: 5,
    unit: '四 · 11~20 的认识',
    emoji: '🔢',
    goal: '1 个十和几个一，认识 11~20',
    moduleKeys: ['1120', 'ordinal', 'compare-more'],
  },
  {
    chapter: 6,
    unit: '五 · 20 以内的进位加法',
    emoji: '➕',
    goal: '凑十法算进位加，反过来会退位减',
    moduleKeys: ['carry', 'borrow', 'word-problem', 'pic-eq'],
  },
  {
    chapter: 7,
    unit: '六 · 复习与关联',
    emoji: '🎯',
    goal: '把学过的连起来：钟表、日历和综合练习',
    moduleKeys: ['clock', 'clock-half', 'calendar', 'calc', 'mult-table'],
  },
];

/** 某个数学模块归属的课本单元（模块页上标「课本第几单元」用） */
export function mathUnitsOfModule(moduleKey: string): MathUnit[] {
  return MATH_UNITS.filter((u) => u.moduleKeys.includes(moduleKey));
}

/* ============================================================
 * 语文 · 按课本单元对齐（与 MATH_UNITS 对称）
 * ------------------------------------------------------------
 * 语文模块不像数学那样天然「一单元 = 几个练习」，而是按主题组织
 * （识字 / 拼音 / 阅读 各自一组模块）。这里按每个单元的「性质」把
 * 相关模块归到该单元下，让「翻到课本第几单元 → 点开对应练习」也能
 * 在语文侧一一对上。
 * 有测试校验：每个 key 都真实存在，且所有语文模块都至少归到一个单元。
 * ============================================================ */
export interface ChineseUnit {
  chapter: number;
  unit: string; // 课本单元名（与 GRADE1_CHAR_UNITS 对应）
  emoji: string;
  goal: string; // 这一单元要掌握什么（取单元导语）
  moduleKeys: string[];
}

const CHAR_LESSON: string[] = [
  'lessons', 'characters', 'quiz', 'word-form', 'strokes-order', 'trace',
  'strokes', 'sentence', 'school-prep', 'my-day',
  // 2025 新增：萌可趣味学园（识字/生活类）
  'proverbs', 'antonyms', 'quantifiers', 'riddles', 'safety', 'char-transform',
];
const PINYIN_LESSON: string[] = ['pinyin', 'pinyin-blend', 'characters'];
const READ_LESSON: string[] = ['texts', 'textchars', 'reading', 'finger-read', 'quiz', 'poems', 'poem-fun', 'nursery-rhymes'];

/** 由 GRADE1_CHAR_UNITS 派生：按单元性质精挑相关模块 key */
function deriveChineseUnits(): ChineseUnit[] {
  return GRADE1_CHAR_UNITS.map((u) => {
    let keys: string[];
    const isPinyin = u.unit.startsWith('汉语拼音');
    const isReading = u.unit.startsWith('阅读');
    // 精细化：每个单元只挂与当前学习内容最相关的模块
    if (u.chapter === 1) {
      // 我上学了：入学准备 + 基础识字 + 安全
      keys = ['school-prep', 'characters', 'lessons', 'safety'];
    } else if (isPinyin) {
      // 拼音单元：拼读 + 识字巩固 + 拼音口诀 + 轻声 + 声调
      keys = ['pinyin', 'pinyin-blend', 'characters', 'pinyin-tips', 'neutral-tone', 'tone-quiz'];
    } else if (isReading && u.chapter === 6) {
      // 阅读（一）：课文 + 古诗 + 量词 + 成语 + 课文理解
      keys = ['texts', 'textchars', 'reading', 'poems', 'poem-fun', 'quantifiers', 'idiom', 'text-comprehension'];
    } else if (isReading && u.chapter === 8) {
      // 阅读（二）：课文 + 指读 + 古诗 + 谜语 + 成语 + 课文理解
      keys = ['texts', 'textchars', 'reading', 'finger-read', 'poems', 'riddles', 'idiom', 'text-comprehension'];
    } else if (isReading && u.chapter === 9) {
      // 阅读（三）：课文 + 儿歌 + 生活 + 谚语
      keys = ['texts', 'textchars', 'reading', 'finger-read', 'nursery-rhymes', 'my-day', 'proverbs'];
    } else if (u.chapter === 2) {
      // 识字（一）：核心识字 + 笔顺 + 汉字规律 + 形近字 + 象形字 + 书写描红
      keys = ['characters', 'quiz', 'word-form', 'strokes', 'strokes-order', 'char-transform', 'similar-char', 'pictograph', 'writing-trace'];
    } else if (u.chapter === 7) {
      // 识字（二）：核心识字 + 笔顺 + 描红 + 组词 + 反义词 + 连词成句 + 形近字 + 拟声词 + 多音字 + 象形字 + 书写描红 + 形近字母
      keys = ['characters', 'quiz', 'word-form', 'strokes', 'strokes-order', 'trace', 'char-transform', 'antonyms', 'sentence', 'similar-char', 'onomatopoeia', 'polyphonic', 'pictograph', 'writing-trace', 'letter-discriminate'];
    } else {
      // 兜底：通用识字模块
      keys = CHAR_LESSON;
    }
    return { chapter: u.chapter, unit: u.unit, emoji: u.emoji, goal: u.text, moduleKeys: keys };
  });
}

export const CHINESE_UNITS: ChineseUnit[] = deriveChineseUnits();

/** 某个语文模块归属的课本单元（模块页上标「课本第几单元」用） */
export function chineseUnitsOfModule(moduleKey: string): ChineseUnit[] {
  return CHINESE_UNITS.filter((u) => u.moduleKeys.includes(moduleKey));
}

/* ============================================================
 * 【2025 新版】萌可趣味学园（一年级上册扩充内容）
 * 由萌可角色出题引导：睿智名言（睿智萌可）/ 儿歌乐园（唱唱萌可）/
 * 反义词量词（淘气萌可）/ 谜语宝箱（好奇萌可）/ 安全课堂（温柔萌可）/
 * 英文儿歌（唱唱萌可+甜心萌可）/ 笔顺规则口诀 / 汉字变变变
 * ============================================================ */
