/* ============================================================
   程程学习工作台 — 自主学习内容数据
   结合人教版一年级上册 + RAZ AA + 幼小衔接
   拼音已按「单韵母 / 声母 / 复韵母 / 前后鼻韵母 / 整体认读」系统补全，
   声调与例词均经校对。

   ┌─ 内容索引（按学科找数据👇 行号随版本浮动，用 grep 定位更准）──┐
   │ 语文：拼音(10) / PINYIN_HAN·TONES(125) / 识字 CHARACTERS(246,557) │
   │       古诗 POEMS(568) / 课文 TEXTS(971) / 笔画 STROKES(1094)     │
   │       偏旁 RADICALS(1125) / 课文生字 TEXT_CHAR_LESSONS(1165)     │
   │       描红 TRACE_CHARS(1246) / 拼读 PINYIN_BLEND(1282)           │
   │       阅读 READING_PASSAGES(1385) / 组词 WORD_FORM(1534)         │
   │       指读 FINGER_READ(1565) / 诗图 POEM_PICTURE_Q(1590)         │
   │       MY_DAY(1628) / 生字单元 GRADE1_CHAR_UNITS(1656) 及派生      │
   │       【2025】谚语 PROVERBS / 儿歌 NURSERY_RHYMES / 反义词       │
   │       ANTONYMS / 量词 QUANTIFIERS / 谜语 RIDDLES / 安全 SAFETY_TIPS │
   │ 数学：NUMBER_SENSE(590) / SHAPES(632) / ANGLES(649)             │
   │       计算 makeMathQuestions(661) / 分合 SPLITS(1258)            │
   │       应用题 WORD_PROBLEMS(1316) / 序数 ORDINALS(1397)           │
   │       钟表 CLOCKS·HALF(1037,1417) / 比轻重 COMPARE_MORE(1434)    │
   │       日历 WEEK_CALENDAR(1454) / 单元 MATH_UNITS(1886)           │
   │ 英语：单词 EN_WORD_TOPICS(734) / ALL_EN_WORDS(958)              │
   │       单元 EN_UNITS(1065) / CVC(1333) / 句型 EN_SENTENCES(1496)  │
   │       单元词 UNIT_WORD(1825) / 【2025】儿歌 EN_SONGS             │
   │ 通用：Subject 类型(8) / applyTone(197) / 学校 SCHOOL_ITEMS(1473) │
   └──────────────────────────────────────────────────────────────┘
   ┌─ 加新年级约定 ────────────────────────────────────────────────┐
   │ 加一年级下/二年级数据时，请新建 src/lib/study-data-gradeN.ts，  │
   │ 在本文件末尾加 export * from './study-data-gradeN' 即可聚合。  │
   │ 不拆现有存量——git blame 历史不破，30 个 import 点零改动。    │
   └───────────────────────────────────────────────────────────────┘
   ============================================================ */

export type Subject = '语文' | '数学' | '英语';

/* 本文件已拆分为按领域的小文件（src/lib/study-data/*.ts），
 * 此处统一聚合 re-export，对外仍以 @/lib/study-data 导入，调用侧无需改动。
 *
 * 加一年级下/二年级数据时，请新建 src/lib/study-data-gradeN.ts，
 * 在本文件末尾加 export * from './study-data-gradeN' 即可聚合。
 */
export * from './study-data/pinyin';
export * from './study-data/characters';
export * from './study-data/poems';
export * from './study-data/texts';
export * from './study-data/writing';
export * from './study-data/yiketie';
export * from './study-data/math';
export * from './study-data/life';
export * from './study-data/chinese-fun';
export * from './study-data/english';
export * from './study-data/units';

/* 英语基础数据（LetterItem / LETTERS / WordItem / EN_WORD_TOPICS / ALL_EN_WORDS） */
export * from './study-data-en';
