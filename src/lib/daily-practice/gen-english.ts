import { ALL_EN_WORDS, EN_WORD_TOPICS, EN_UNITS } from '../study-data';
import type { PracticeQuestion, WordItem } from './types';
import { shuffle } from './types';

/* —— 难度分层词表 —— */
/**
 * 拓展单元（Extra*）的词汇集合：EN_UNITS 里标了 extra 的单元，其 topics
 * 对应 EN_WORD_TOPICS 的 key。教材单元词（Unit 1~7）是「跟着课本走」的基础，
 * Extra 词是课外拓展——天然的分界，不新增数据。
 */
const EXTRA_TOPICS = new Set(EN_UNITS.filter((u) => u.extra).flatMap((u) => u.topics));
const TEXTBOOK_WORDS = ALL_EN_WORDS.filter((w) => !w.topic || !EXTRA_TOPICS.has(w.topic));
const EXTRA_WORDS = ALL_EN_WORDS.filter((w) => w.topic && EXTRA_TOPICS.has(w.topic));

/**
 * 按难度级别取词：级别 0 只出教材词；级别 ≥1 时按级别混入拓展词
 *（1→1/5、2→2/5、3→3/5、4→全部）。词本身没有「难」——对一年级孩子，
 * 难在「课本还没教到」：低级别贴课本，高级别把课外词汇量补进来。
 */
function pickWordByLevel(level: number, usedEn?: Set<string>): WordItem {
  const wantExtra = level >= 4 || Math.random() < Math.min(1, level / 5);
  const pool = wantExtra && EXTRA_WORDS.length ? EXTRA_WORDS : TEXTBOOK_WORDS;
  if (!usedEn) return pool[Math.floor(Math.random() * pool.length)];
  let w = pool[Math.floor(Math.random() * pool.length)];
  let g = 0;
  while (usedEn.has(w.word) && g++ < 20) {
    const p = EXTRA_WORDS.length ? ALL_EN_WORDS : pool;
    w = p[Math.floor(Math.random() * p.length)];
  }
  usedEn.add(w.word);
  return w;
}

/* —— 听音选词题 —— */
export function genEnglishQ(
  w: WordItem = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)]
): PracticeQuestion {
  const distractors = shuffle(ALL_EN_WORDS.filter((x) => x.word !== w.word)).slice(0, 3);
  const options = shuffle([w, ...distractors]);
  const answer = options.indexOf(w);
  return {
    id: `en-${w.word}`,
    kind: 'english',
    subject: '英语',
    prompt: '听一听，选出你听到的单词：',
    word: w.word,
    cn: w.cn,
    emoji: w.emoji,
    options: options.map((o) => o.word),
    answer: options.indexOf(w),
    explain: `${w.emoji} ${w.word} = ${w.cn}`,
  };
}

/* 英语看图选词题（看 emoji 选对应单词） */
export function genEnPicQ(
  w: WordItem = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)]
): PracticeQuestion {
  const distractors = shuffle(ALL_EN_WORDS.filter((x) => x.word !== w.word)).slice(0, 3);
  const options = shuffle([w, ...distractors]);
  const answer = options.indexOf(w);
  return {
    id: `en-pic-${w.word}`,
    kind: 'english',
    subject: '英语',
    prompt: `${w.emoji} 这个图片是哪个单词？`,
    word: w.word,
    cn: w.cn,
    emoji: w.emoji,
    options: options.map((o) => o.word),
    answer: options.indexOf(w),
    explain: `${w.emoji} ${w.word} = ${w.cn}`,
  };
}

/* 英语首字母题：听音辨字母 */
export function genEnInitialQ(
  w: WordItem = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)]
): Extract<PracticeQuestion, { kind: 'english' }> {
  const first = w.word[0].toUpperCase();
  const distractors = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(first, '').split('')).slice(
    0,
    3
  );
  const options = shuffle([first, ...distractors]);
  // 返回字母本身作为答案，而不是索引
  const answer = options.indexOf(first);
  return {
    id: `en-init-${w.word}`,
    kind: 'english',
    subtype: 'initial',
    subject: '英语',
    prompt: '听一听，这个单词以哪个字母开头？',
    word: w.word,
    cn: w.cn,
    emoji: w.emoji,
    options,
    answer: options.indexOf(first),
    explain: `${w.word} 以 ${first} 开头`,
  };
}

/* 带去重的英语题（难度感知：level 0~4） */
export function genUniqueEnglishQ(usedEn: Set<string>, level = 0): PracticeQuestion {
  const w = pickWordByLevel(level, usedEn);
  return genEnglishQ(w);
}

export function genUniqueEnPicQ(usedEn: Set<string>, level = 0): PracticeQuestion {
  const w = pickWordByLevel(level, usedEn);
  return genEnPicQ(w);
}

/** 难度感知版首字母题：高级别才从拓展词里出。 */
export function genUniqueEnInitialQ(level = 0): PracticeQuestion {
  const w = pickWordByLevel(level);
  return genEnInitialQ(w);
}
