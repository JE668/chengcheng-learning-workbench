import { PINYIN_TONES, applyTone, CHARACTERS, PROVERBS, ANTONYMS, RIDDLES, POEMS } from '../study-data';
import type { PracticeQuestion } from './types';
import { randInt, shuffle } from './types';

/* —— 拼音：可完整发四声的音节（4 个代表字都不为空） —— */
const PINYIN_FULL = Object.keys(PINYIN_TONES).filter((b) => PINYIN_TONES[b].every((t) => t));

/* —— 拼音题 —— */
export function genPinyinQ(): PracticeQuestion {
  let base = Object.keys(PINYIN_TONES)[Math.floor(Math.random() * Object.keys(PINYIN_TONES).length)];
  const fullKeys = Object.keys(PINYIN_TONES).filter((b) => PINYIN_TONES[b].every((t) => t));
  let baseKey = fullKeys[Math.floor(Math.random() * fullKeys.length)];
  let marked = [1, 2, 3, 4].map((tn) => applyTone(baseKey, tn));
  let guard = 0;
  while (new Set(marked).size < 4 && guard++ < 20) {
    baseKey = fullKeys[Math.floor(Math.random() * fullKeys.length)];
    marked = [1, 2, 3, 4].map((tn) => applyTone(baseKey, tn));
  }
  const tones = PINYIN_TONES[baseKey];
  const t = Math.floor(Math.random() * 4) + 1;
  const han = tones[t - 1];
  const options = shuffle(Array.from(new Set(marked)));
  const answer = options.indexOf(marked[t - 1]);
  return {
    id: `py-${baseKey}-${t}`,
    kind: 'pinyin',
    subject: '语文',
    prompt: '这个字读什么拼音？点选带正确声调的音节',
    han,
    audioText: han,
    options,
    answer,
    explain: `「${han}」的拼音是 ${marked[t - 1]}`,
  };
}

/* —— 听写题 —— */
export function genDictationQ(): PracticeQuestion {
  const c = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  const han = c.char;
  const distractors = shuffle(CHARACTERS.filter((x) => x.char !== han)).slice(0, 3).map((x) => x.char);
  const options = shuffle([han, ...distractors]);
  const answer = options.indexOf(han);
  return {
    id: `dc-${han}-${answer}`,
    kind: 'dictation',
    subject: '语文',
    prompt: '听写：听一听，选出正确的字',
    han,
    options,
    answer,
    explain: `「${han}」${c.meaning}，${c.phrase}`,
  };
}

/* —— 识字题：看释义选字 —— */
export function genChineseQuizQ(): PracticeQuestion {
  const c = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  const distractors = shuffle(CHARACTERS.filter((x) => x.meaning !== c.meaning)).slice(0, 3).map((x) => x.char);
  const options = shuffle([c.char, ...distractors]);
  const answer = options.indexOf(c.char);
  return {
    id: `qz-${c.char}`,
    kind: 'dictation',
    subject: '语文',
    prompt: `哪个字的意思是「${c.meaning}」？`,
    han: c.char,
    options,
    answer,
    explain: `「${c.char}」意思是${c.meaning}`,
  };
}

/* 反义词题 */
export function genAntonymQ(): PracticeQuestion {
  const a = ANTONYMS[Math.floor(Math.random() * ANTONYMS.length)];
  const distractors = shuffle(ANTONYMS.filter((x) => x.b !== a.b).map((x) => x.b)).slice(0, 3);
  const options = shuffle([a.b, ...distractors]);
  const answer = options.indexOf(a.b);
  return {
    id: `ant-${a.a}`,
    kind: 'dictation',
    subject: '语文',
    prompt: `「${a.a}」的反义词是？`,
    han: a.a,
    options,
    answer,
    explain: `「${a.a}」的反义词是「${a.b}」`,
  };
}

/* 谚语配对题 */
export function genProverbQ(): PracticeQuestion {
  const p = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
  const distractors = shuffle(PROVERBS.filter((x) => x.second !== p.second).map((x) => x.second)).slice(0, 3);
  const options = shuffle([p.second, ...distractors]);
  const answer = options.indexOf(p.second);
  return {
    id: `pv-${p.first}`,
    kind: 'dictation',
    subject: '语文',
    prompt: `「${p.first}」后半句是？`,
    han: p.first,
    options,
    answer,
    explain: `${p.first}，${p.second}`,
  };
}

/* 谜语题 */
export function genRiddleQ(): PracticeQuestion {
  const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
  const options = shuffle([...r.options]);
  const answer = options.indexOf(r.answer);
  return {
    id: `rd-${r.riddle.slice(0, 4)}`,
    kind: 'dictation',
    subject: '语文',
    prompt: r.riddle,
    han: r.answer,
    options,
    answer,
    explain: `谜底是「${r.answer}」`,
  };
}

/* 古诗连线：给出一句诗，选出出自哪首诗 */
export function genPoemQ(): PracticeQuestion {
  const p = POEMS[Math.floor(Math.random() * POEMS.length)];
  const line = p.lines[Math.floor(Math.random() * p.lines.length)];
  const distractors = shuffle(POEMS.filter((x) => x.title !== p.title)).slice(0, 3).map((x) => x.title);
  const options = shuffle([p.title, ...distractors]);
  const answer = options.indexOf(p.title);
  return {
    id: `pm-${p.title.slice(0, 4)}-${Math.floor(Math.random() * 100)}`,
    kind: 'poem',
    subject: '语文',
    prompt: `「${line}」出自哪首诗？`,
    options,
    answer,
    explain: `「${line}」出自《${p.title}》，作者${p.author}`,
  };
}

/* 带去重的拼音题 */
export function genUniquePinyinQ(usedChars: Set<string>): PracticeQuestion {
  let q = genPinyinQ();
  let guard = 0;
  while (q.han && usedChars.has(q.han) && guard++ < 20) q = genPinyinQ();
  if (q.han) usedChars.add(q.han);
  return q;
}

/* 带去重的听写题 */
export function genUniqueDictationQ(usedChars: Set<string>): PracticeQuestion {
  let q = genDictationQ();
  let guard = 0;
  while (q.han && usedChars.has(q.han) && guard++ < 20) q = genDictationQ();
  if (q.han) usedChars.add(q.han);
  return q;
}

/* 带去重的识字题 */
export function genUniqueChineseQuizQ(usedChars: Set<string>): PracticeQuestion {
  let q = genChineseQuizQ();
  let guard = 0;
  while (q.han && usedChars.has(q.han) && guard++ < 20) q = genChineseQuizQ();
  if (q.han) usedChars.add(q.han);
  return q;
}

/* 反义词题（不涉及汉字去重，直接出题） */
export function genUniqueAntonymQ(): PracticeQuestion {
  return genAntonymQ();
}

/* 谚语配对题（不涉及汉字去重） */
export function genUniqueProverbQ(): PracticeQuestion {
  return genProverbQ();
}

/* 谜语题（不涉及汉字去重） */
export function genUniqueRiddleQ(): PracticeQuestion {
  return genRiddleQ();
}

/* 古诗题（不涉及汉字去重） */
export function genUniquePoemQ(): PracticeQuestion {
  return genPoemQ();
}