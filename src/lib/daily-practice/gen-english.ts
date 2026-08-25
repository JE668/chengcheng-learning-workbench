import { ALL_EN_WORDS } from '../study-data';
import type { PracticeQuestion } from './types';
import { randInt, shuffle } from './types';

/* —— 听音选词题 —— */
export function genEnglishQ(w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)]): PracticeQuestion {
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
    answer,
    explain: `${w.emoji} ${w.word} = ${w.cn}`,
  };
}

/* 英语看图选词题（看 emoji 选对应单词） */
export function genEnPicQ(w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)]): PracticeQuestion {
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
    answer,
    explain: `${w.emoji} ${w.word} = ${w.cn}`,
  };
}

/* 英语首字母题：听音辨字母 */
export function genEnInitialQ(): PracticeQuestion {
  const w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)];
  const first = w.word[0].toUpperCase();
  const distractors = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(first, '').split('')).slice(0, 3);
  const options = shuffle([first, ...distractors]);
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
    answer,
    explain: `${w.word} 以 ${first} 开头`,
  };
}

/* 带去重的英语题 */
export function genUniqueEnglishQ(usedEn: Set<string>): PracticeQuestion {
  let w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)];
  let g = 0;
  while (usedEn.has(w.word) && g++ < 20) w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)];
  usedEn.add(w.word);
  return genEnglishQ(w);
}

export function genUniqueEnPicQ(usedEn: Set<string>): PracticeQuestion {
  let w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)];
  let g = 0;
  while (usedEn.has(w.word) && g++ < 20) w = ALL_EN_WORDS[Math.floor(Math.random() * ALL_EN_WORDS.length)];
  usedEn.add(w.word);
  return genEnPicQ(w);
}

export function genUniqueEnInitialQ(): PracticeQuestion {
  return genEnInitialQ();
}