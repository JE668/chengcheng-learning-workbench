import { getDb } from './db';
import { confirm, logGrowthEvent } from './castle';
import { PINYIN_TONES, applyTone, ALL_EN_WORDS, CHARACTERS, PROVERBS, ANTONYMS, RIDDLES, POEMS, WORD_PROBLEMS, ORDINALS, CLOCKS, EN_SENTENCES } from './study-data';
import { mokoChars, subjectMokoKey, SUN_PER_SUBJECT } from './moko';
import { mokoCollection } from './moko-collection';
import { getDueMistakes, reviewMistake, type MistakeRow } from './mistakes';
import { upsertModuleProgress } from './progress-store';
import { dateStr, addDays } from './date';
import { MILESTONE_DAYS } from './economy';
import { safeJsonParse } from './safe-json';
import type { Subject } from './types';

/**
 * 每日一练单科通过门槛：正确题数 ≥ 总题数 × 80%（ceil 向上取整，即允许错 1 题）。
 * 例：5 题需对 4 题（ceil(5×0.8)=4），1 题需对 1 题，0 题直接不通过。
 * 抽成纯函数便于单测覆盖边界，避免「改了判定却没测到」的回归。
 */
export function passThreshold(correct: number, total: number): boolean {
  if (total <= 0) return false;
  return correct >= Math.ceil(total * 0.8);
}

/**
 * 每日一练「某科全对 → 点亮该科核心学习模块 1 星」的映射。
 * 目的：让「萌可闯关」（每日一练）与「萌可剧情」闭环——三科全对打卡后，
 * 对应学科的镇守萌可剧情（主线第 1~3 集：爱心/正正/唱唱）即可解锁。
 * 星数取历史最佳，不会覆盖孩子在模块内做题拿到的更高星。
 */
export const DAILY_CORE_MODULE: Record<Subject, { subjectKey: string; moduleKey: string }> = {
  语文: { subjectKey: 'chinese', moduleKey: 'characters' }, // 识字小能手（爱心萌可剧情）
  数学: { subjectKey: 'math', moduleKey: 'count' }, // 数感启蒙（正正萌可剧情）
  英语: { subjectKey: 'english', moduleKey: 'letters' }, // 字母乐园（唱唱萌可剧情）
};

/**
 * 连续一练「额外萌可」里程碑（天数）。
 * 设计意图：前期密集奖赏帮孩子建立习惯——第 2~7 天几乎每天解锁一只新萌可，
 * 之后间隔逐步拉开（10/14/21…90），形成「衰减奖励曲线」，既容易上手又不至于一次发完。
 * 注意：三科全对当天本就会各召唤一只学科萌可（爱心/正正/唱唱），这里的里程碑是「额外惊喜」。
 * 常量值集中在 src/lib/economy.ts（MILESTONE_DAYS）。
 */

/* ----------------------------- 题型定义 ----------------------------- */
export type PracticeQuestion =
  | {
      id: string;
      kind: 'pinyin';
      subject: Subject;
      prompt: string;
      han: string;
      audioText: string;
      options: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: 'math';
      subject: Subject;
      prompt: string;
      han?: string;
      options: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: 'english';
      subject: Subject;
      prompt: string;
      han?: string;
      word: string;
      cn: string;
      emoji: string;
      options: string[];
      answer: number;
      explain: string;
      /** 首字母题：靠听音 + emoji 猜首字母，题干与页面都不显示英文单词，避免「直接看词选首字母」变傻题 */
      subtype?: 'initial';
    }
  | {
      id: string;
      kind: 'dictation';
      subject: Subject;
      prompt: string;
      han: string; // 听到的字（TTS 朗读）
      options: string[]; // 汉字选项
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: 'mistake';
      subject: Subject;
      prompt: string; // 原题目
      han?: string;
      options: string[];
      answer: number;
      explain: string;
      mistakeId: number; // 对应 mistakes.id，提交时推进间隔重复
      origin: string; // 「来自 xx 模块」之类的来源说明
      speakText?: string; // 需要朗读时的中文文本
    }
  | {
      id: string;
      kind: 'poem';
      subject: Subject;
      prompt: string;
      han?: string;
      options: string[];
      answer: number;
      explain: string;
    };

export interface PracticeDayRecord {
  completed: boolean;
  correct: number;
  total: number;
  questions: PracticeQuestion[];
  practiceStreak: number;
  nextMilestone: number;
}

export type SubjectStatus = 'passed' | 'already' | 'failed';
export interface SubjectResult {
  subject: Subject;
  correct: number;
  total: number;
  status: SubjectStatus;
}

export interface PracticeSubmitResult {
  ok: boolean;
  correct: number;
  total: number;
  completed: boolean;
  subjects: SubjectResult[];
  practiceStreak?: number;
  rewards?: { mokos: string[]; sunlight: number; prosperity: boolean };
  milestone?: { mokoKey: string; mokoName: string; img: string };
  /** 本次提交发放的捕捉券数量（每确认一科 1 张，来自 confirm 的今日分支） */
  tickets?: number;
}

/* ----------------------------- 抽题工具 ----------------------------- */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* —— 拼音：可完整发四声的音节（4 个代表字都不为空） —— */
const PINYIN_FULL = Object.keys(PINYIN_TONES).filter((b) => PINYIN_TONES[b].every((t) => t));

function genPinyinQ(): PracticeQuestion {
  // 个别音节不同声调可能返回相同字符串（如轻声/某些音节），
  // 必须先选出「四个声调互异」的音节，再据此出题，避免正确答案判定错位。
  let base = PINYIN_FULL[randInt(0, PINYIN_FULL.length - 1)];
  let marked = [1, 2, 3, 4].map((tn) => applyTone(base, tn));
  let guard = 0;
  while (new Set(marked).size < 4 && guard++ < 20) {
    base = PINYIN_FULL[randInt(0, PINYIN_FULL.length - 1)];
    marked = [1, 2, 3, 4].map((tn) => applyTone(base, tn));
  }
  const tones = PINYIN_TONES[base];
  const t = randInt(1, 4);
  const han = tones[t - 1];
  // 选项去重（保留互异字符串），answer 下标基于去重后的 options，确保唯一正确项
  const options = shuffle(Array.from(new Set(marked)));
  const answer = options.indexOf(marked[t - 1]);
  return {
    id: `py-${base}-${t}`,
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

function genMathQ(hard = false): PracticeQuestion {
  const isAdd = Math.random() < 0.6;
  let a: number, b: number, ans: number, prompt: string;
  if (isAdd) {
    // 基础：10 以内；加难：100 以内
    a = randInt(0, hard ? 50 : 10);
    b = randInt(0, hard ? 50 : 10);
    ans = a + b;
    prompt = `${a} + ${b} = ?`;
  } else {
    // 基础：10 以内减法；加难：100 以内不退位减法
    a = randInt(1, hard ? 99 : 10);
    b = randInt(0, hard ? Math.min(a, 50) : a);
    ans = a - b;
    prompt = `${a} − ${b} = ?`;
  }
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const d = ans + randInt(-3, 3);
    if (d >= 0) set.add(d);
  }
  const options = shuffle(Array.from(set));
  const answer = options.indexOf(ans);
  return {
    id: `ma-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt,
    options: options.map(String),
    answer,
    explain: `${prompt.replace('?', '')} = ${ans}`,
  };
}

function genEnglishQ(w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)]): PracticeQuestion {
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

function genDictationQ(): PracticeQuestion {
  // 听写：听一个字的读音，从几个汉字里选出正确的字（TTS 直接朗读汉字，无需拼音字段）
  const c = CHARACTERS[randInt(0, CHARACTERS.length - 1)];
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

/* ===== 新增题型：每天随机出不同类型，保持新鲜感 ===== */

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 识字题：看释义选字 */
function genChineseQuizQ(): PracticeQuestion {
  const c = CHARACTERS[randInt(0, CHARACTERS.length - 1)];
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

/** 反义词题 */
function genAntonymQ(): PracticeQuestion {
  const a = ANTONYMS[randInt(0, ANTONYMS.length - 1)];
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

/** 谚语配对题 */
function genProverbQ(): PracticeQuestion {
  const p = PROVERBS[randInt(0, PROVERBS.length - 1)];
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

/** 谜语题 */
function genRiddleQ(): PracticeQuestion {
  const r = RIDDLES[randInt(0, RIDDLES.length - 1)];
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

/** 应用题 */
function genWordProblemQ(): PracticeQuestion {
  const p = WORD_PROBLEMS[randInt(0, WORD_PROBLEMS.length - 1)];
  const options = shuffle([...p.options]);
  const answer = options.indexOf(p.answer);
  return {
    id: `wp-${p.text.slice(0, 4)}`,
    kind: 'math',
    subject: '数学',
    prompt: p.text,
    options,
    answer,
    explain: `答案是 ${p.answer}`,
  };
}

/** 序数题 */
function genOrdinalQ(): PracticeQuestion {
  const o = ORDINALS[randInt(0, ORDINALS.length - 1)];
  // 确保答案一定在选项里：先放答案，再补 3 个干扰项
  const allOpts = ['第1', '第2', '第3', '第4', '第5'].filter((x) => x !== o.answer);
  const shuffled = shuffle([o.answer, ...shuffle(allOpts).slice(0, 3)]);
  const answer = shuffled.indexOf(o.answer);
  return {
    id: `od-${o.ask}`,
    kind: 'math',
    subject: '数学',
    prompt: o.question,
    options: shuffled,
    answer,
    explain: o.answer,
  };
}

/** 比大小题 */
function genCompareQ(): PracticeQuestion {
  const a = randInt(0, 10);
  const b = randInt(0, 10);
  const correct = a > b ? '>' : a < b ? '<' : '=';
  const options = shuffle(['>', '<', '=']);
  const answer = options.indexOf(correct);
  return {
    id: `cmp-${a}-${b}`,
    kind: 'math',
    subject: '数学',
    prompt: `${a} __ ${b}（填 > < 或 =）`,
    options,
    answer,
    explain: `${a} ${correct} ${b}`,
  };
}

/** 钟表题 */
function genClockQ(): PracticeQuestion {
  const c = CLOCKS[randInt(0, CLOCKS.length - 1)];
  const distractors = shuffle(CLOCKS.filter((x) => x.hour !== c.hour)).slice(0, 3).map((x) => x.label);
  const options = shuffle([c.label, ...distractors]);
  const answer = options.indexOf(c.label);
  return {
    id: `ck-${c.hour}`,
    kind: 'math',
    subject: '数学',
    prompt: `这是几点？`,
    options,
    answer,
    explain: c.label,
  };
}

/** 英语看图选词题（看 emoji 选对应单词，和听音选词不同：有视觉提示） */
function genEnPicQ(): PracticeQuestion {
  const w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
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

/** 英语首字母题：听音辨字母。题干/页面都不显示英文单词，只给 emoji + 听音按钮，
 *  让孩子凭读音想首字母——而不是把 color 写在眼前直接看首字母。 */
export function genEnInitialQ(): Extract<PracticeQuestion, { kind: 'english' }> {
  const w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
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

/* —— 错题复习题：从到期错题生成，放在一练最前面 —— */

/** 粗略判断答案「形状」，只有同形状的选项混在一起才不别扭（数字 / 英文 / N 个汉字 / emoji…） */
function shapeOf(s: string): string {
  if (/^-?\d+$/.test(s)) return 'num';
  // eslint-disable-next-line no-control-regex
  if (/^[\u0000-\u007F]+$/.test(s)) return 'ascii';
  if (/^[\u4e00-\u9fa5]+$/.test(s)) return `han${Array.from(s).length}`;
  return 'other';
}

function buildMistakeOptions(m: MistakeRow, pool: MistakeRow[]): string[] {
  const answer = m.answer;
  const shape = shapeOf(answer);
  const opts: string[] = [answer];
  const push = (v: string | null | undefined) => {
    const t = (v ?? '').trim();
    if (t && !opts.includes(t) && shapeOf(t) === shape && opts.length < 4) opts.push(t);
  };
  push(m.wrong);
  // 同学科的其他错题答案/错答，形状一致才拿来当干扰项
  for (const o of shuffle(pool)) {
    if (o.id === m.id) continue;
    if (o.subject !== m.subject) continue;
    push(o.answer);
    push(o.wrong);
  }
  // 数字类可以直接造相邻数
  if (shape === 'num') {
    const n = Number(answer);
    for (const d of shuffle([1, 2, 3, -1, -2, -3])) {
      if (opts.length >= 4) break;
      const v = n + d;
      if (v >= 0) push(String(v));
    }
  }
  return shuffle(opts);
}

function genMistakeQ(m: MistakeRow, pool: MistakeRow[]): PracticeQuestion | null {
  const options = buildMistakeOptions(m, pool);
  if (options.length < 2) return null; // 连一个干扰项都凑不出来就跳过
  const subject: Subject = (['语文', '数学', '英语'] as string[]).includes(m.subject)
    ? (m.subject as Subject)
    : '语文';
  return {
    id: `mk-${m.id}`,
    kind: 'mistake',
    subject,
    prompt: m.prompt,
    options,
    answer: options.indexOf(m.answer),
    explain: `正确答案是「${m.answer}」${m.wrong ? `，上次选成了「${m.wrong}」` : ''}`,
    mistakeId: m.id,
    origin: m.kind ? `错题本 · ${m.kind}` : '错题本',
    speakText: shapeOf(m.answer).startsWith('han') ? m.prompt : undefined,
  };
}

export async function generateQuestions(childId: number): Promise<PracticeQuestion[]> {
  const qs: PracticeQuestion[] = [];
  // 0) 错题优先：今天到期的错题最多抽 2 题排在最前面
  try {
    const due = await getDueMistakes(childId, 6);
    for (const m of due) {
      if (qs.length >= 2) break;
      const q = genMistakeQ(m, due);
      if (q) qs.push(q);
    }
  } catch {
    /* 错题本还没建表/查询失败时，不影响正常出题 */
  }

  // 全局去重：当天已出现的汉字/单词不再重复出题，避免同一知识点反复出现
  const usedChars = new Set<string>();

  // 语文 10 题：每天随机出不同题型组合（听写/拼音/识字/反义词/谚语/谜语），保持新鲜感
/** 古诗连线：给出一句诗，选出出自哪首诗 */
function genPoemQ(): PracticeQuestion {
  const p = POEMS[randInt(0, POEMS.length - 1)];
  const line = p.lines[randInt(0, p.lines.length - 1)];
  const distractors = shuffle(POEMS.filter((x) => x.title !== p.title)).slice(0, 3).map((x) => x.title);
  const options = shuffle([p.title, ...distractors]);
  const answer = options.indexOf(p.title);
  return {
    id: `pm-${p.title.slice(0, 4)}-${randInt(0, 99)}`,
    kind: 'poem',
    subject: '语文',
    prompt: `「${line}」出自哪首诗？`,
    options,
    answer,
    explain: `「${line}」出自《${p.title}》，作者${p.author}`,
  };
}

  const zhPool: (() => PracticeQuestion)[] = [
    () => genPoemQ(),   // 古诗（不涉及汉字去重，直接出题）
    // 带去重的拼音题
    () => {
      let q = genPinyinQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genPinyinQ();
      usedChars.add(q.han!);
      return q;
    },
    () => {
      let q = genPinyinQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genPinyinQ();
      usedChars.add(q.han!);
      return q;
    },
    // 带去重的听写题
    () => {
      let q = genDictationQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genDictationQ();
      usedChars.add(q.han!);
      return q;
    },
    () => {
      let q = genDictationQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genDictationQ();
      usedChars.add(q.han!);
      return q;
    },
    () => {
      let q = genDictationQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genDictationQ();
      usedChars.add(q.han!);
      return q;
    },
    // 识字（看释义选字）
    () => {
      let q = genChineseQuizQ();
      let guard = 0;
      while (usedChars.has(q.han!) && guard++ < 20) q = genChineseQuizQ();
      usedChars.add(q.han!);
      return q;
    },
    () => genAntonymQ(),   // 反义词（不涉及汉字去重，是不同的词对）
    () => genProverbQ(),   // 谚语配对（不涉及汉字去重）
    () => genRiddleQ(),    // 谜语（不涉及汉字去重）
  ];
  const zhPick = shuffleArr(zhPool).slice(0, 10);
  for (const fn of zhPick) qs.push(fn());

  // 根据连续天数决定难度：天数越多，难题比例越高
  const streak = await computePracticeStreak(childId, dateStr());
  const diffLevel = Math.min(4, Math.floor(streak / 7)); // 0~4：每7天升一级
  const useHard = (idx: number) => idx < diffLevel; // 前 diffLevel 道用难题

  // 数学 10 题：基础口算+应用题混合，每天随机（数字题天然不重复，无需去重）
  const mathPool: (() => PracticeQuestion)[] = [
    () => genMathQ(useHard(0)), () => genMathQ(useHard(1)), () => genMathQ(useHard(2)), () => genMathQ(useHard(3)),
    () => genMathQ(useHard(4)), () => genMathQ(useHard(5)),  // 6 道口算（难度递增）
    () => genWordProblemQ(),                                  // 应用题
    () => genWordProblemQ(),                                  // 应用题（替代序数题）
    () => genCompareQ(),                                      // 比大小
    () => genClockQ(),                                        // 钟表
  ];
  const mathPick = shuffleArr(mathPool).slice(0, 10);
  for (const fn of mathPick) qs.push(fn());

  // 英语 5 题：听音选词 + 看图选词 + 首字母，每天随机组合（单词去重）
  const usedEn = new Set<string>();
  const enPool: (() => PracticeQuestion)[] = [
    () => {
      let w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
      let g = 0;
      while (usedEn.has(w.word) && g++ < 20) w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
      usedEn.add(w.word);
      return genEnglishQ(w);
    },
    () => {
      let w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
      let g = 0;
      while (usedEn.has(w.word) && g++ < 20) w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
      usedEn.add(w.word);
      return genEnglishQ(w);
    },
    () => genEnPicQ(),
    () => genEnInitialQ(),
    () => genEnPicQ(),
  ];
  for (const fn of enPool) qs.push(fn());
  return qs;
}

/* ----------------------------- 连续练习天数 ----------------------------- */
async function computePracticeStreak(childId: number, today: string): Promise<number> {
  const db = getDb();
  // 一次性查询最近 400 天的记录，避免循环 N 次 DB 查询
  const start = addDays(today, -400);
  const res = await db.execute({
    sql: 'SELECT day FROM daily_practice WHERE child_id = ? AND completed = 1 AND day >= ? AND day <= ? ORDER BY day DESC',
    args: [childId, start, today],
  });
  const completedDays = new Set(res.rows.map(r => String(r.day)));
  let streak = 0;
  let d = today;
  while (completedDays.has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

/* ----------------------------- 对外接口 ----------------------------- */
/**
 * 取今天的一练数据。generate=true 且无记录时，自动生成并落库（保证刷新一致）。
 */
export async function getTodayPractice(childId: number, generate = false): Promise<PracticeDayRecord> {
  const db = getDb();
  const today = dateStr();
  let row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  if (!row && generate) {
    const qs = await generateQuestions(childId);
    await db.execute({
      sql: 'INSERT OR IGNORE INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 0, 0, ?, ?)',
      args: [childId, today, qs.length, JSON.stringify(qs)],
    });
    row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  } else if (row && row.questions) {
    // 缓存命中：当天已有题目，即使刷新页面也不重新生成
    // 确保孩子看到的是同一套题，不会做到一半刷新就全变了
  }
  const streak = await computePracticeStreak(childId, today);
  const nextMilestoneDay = MILESTONE_DAYS.find((d) => d > streak);
  const nextMilestone = nextMilestoneDay != null ? nextMilestoneDay - streak : 0;
  if (!row) {
    return { completed: false, correct: 0, total: 0, questions: [], practiceStreak: streak, nextMilestone };
  }
  const questions: PracticeQuestion[] = row.questions
    ? safeJsonParse<PracticeQuestion[]>(String(row.questions), [])
    : [];
  return {
    completed: Number(row.completed) === 1,
    correct: Number(row.correct),
    total: Number(row.total),
    questions,
    practiceStreak: streak,
    nextMilestone,
  };
}

/**
 * 提交答案：按「学科」逐科判定。
 * - 某科 3 题全对 → 该科打卡完成（confirm 发阳光 + 对应萌可），已确认的科不会因重做答错被取消；
 * - 三科全部确认 → 今日一练完成（completed=1），并参与连续天数 / 7 天大奖。
 */
export async function submitPractice(childId: number, answers: number[]): Promise<PracticeSubmitResult> {
  const db = getDb();
  const today = dateStr();
  let row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  if (!row) {
    const qs = await generateQuestions(childId);
    await db.execute({
      sql: 'INSERT OR IGNORE INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 0, 0, ?, ?)',
      args: [childId, today, qs.length, JSON.stringify(qs)],
    });
    row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  }
  const questions: PracticeQuestion[] = safeJsonParse<PracticeQuestion[]>(String(row.questions), []);
  const total = questions.length;

  // 按学科归类题目
  const SUBJECTS: Subject[] = ['语文', '数学', '英语'];
  const bySubject: Record<Subject, PracticeQuestion[]> = { 语文: [], 数学: [], 英语: [] };
  for (const q of questions) (bySubject[q.subject] ?? bySubject['语文']).push(q);

  // 错题复习结果回写间隔重复（reviewMistake 内部按「今天是否到期」做幂等，重复提交只按第一次算）
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.kind !== 'mistake') continue;
    try {
      await reviewMistake(childId, q.mistakeId, answers[i] === q.answer);
    } catch {
      /* 单条复习失败不影响整体交卷 */
    }
  }

  // 今天已确认过的学科（防止重复发奖 / 重做答错取消）
  const doneRows = await db.execute({
    sql: 'SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = ?',
    args: [childId, today, 'confirmed'],
  });
  const doneSet = new Set<string>(doneRows.rows.map((r) => String(r.subject)));

  const subjects: SubjectResult[] = [];
  const newlyMokos: string[] = [];
  let sunlightGain = 0;
  let ticketGain = 0;
  let correctTotal = 0;

  for (const s of SUBJECTS) {
    // 只取非错题的本学科题目来算通过率（错题重练不计入通过判定）
    const qs = bySubject[s].filter((q) => q.kind !== 'mistake');
    const subTotal = qs.length;
    let subCorrect = 0;
    for (const q of qs) {
      const i = questions.indexOf(q);
      if (answers[i] === q.answer) subCorrect++;
    }
    correctTotal += subCorrect;

    const already = doneSet.has(s);
    // 通过门槛：≥80% 即算通过（允许错 1 题），降低挫败感。
    const passed = passThreshold(subCorrect, subTotal);
    if (passed && !already) {
      await confirm(childId, today, s); // confirm 内部已统一发放捕捉券
      // 每日一练某科全对 → 点亮该科核心模块 1 星（解锁对应萌可剧情，见文件头 DAILY_CORE_MODULE）
      const core = DAILY_CORE_MODULE[s];
      if (core) {
        try {
          await upsertModuleProgress(childId, core.subjectKey, core.moduleKey, 1);
        } catch {
          /* 进度写失败不影响打卡发奖 */
        }
      }
      newlyMokos.push(mokoChars[subjectMokoKey[s]]?.name ?? '萌可');
      sunlightGain += SUN_PER_SUBJECT;
      ticketGain += 1;
    }
    // 已确认的科始终视为完成；只有「未确认且本次没全对」才标记为待重练
    const status: SubjectStatus = already ? 'already' : passed ? 'passed' : 'failed';
    subjects.push({ subject: s, correct: subCorrect, total: subTotal, status });
  }

  // 三科是否全部确认
  const conf = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = ?',
    args: [childId, today, 'confirmed'],
  });
  const allDone = Number(conf.rows[0]?.n ?? 0) === 3;

  await db.execute({
    sql: 'UPDATE daily_practice SET correct = ?, total = ?, completed = ? WHERE child_id = ? AND day = ?',
    args: [correctTotal, total, allDone ? 1 : 0, childId, today],
  });

  let practiceStreak: number | undefined;
  let milestone: PracticeSubmitResult['milestone'];
  // 繁荣度：本轮恰好补齐第三科时由 confirm 内部加过
  const prosperity = allDone && newlyMokos.length > 0;

  if (allDone) {
    practiceStreak = await computePracticeStreak(childId, today);
    const stRow = (await db.execute({ sql: 'SELECT streak_rewarded FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
    if (MILESTONE_DAYS.includes(practiceStreak) && Number(stRow?.streak_rewarded ?? 0) !== 1) {
      // 先查候选萌可（图鉴里下一只未拥有的 col_ 萌可）
      const ownedKeys = (await db.execute({ sql: 'SELECT moko_key FROM moko_owned WHERE child_id = ?', args: [childId] })).rows.map((r) => String(r.moko_key));
      const candidate = mokoCollection.find((m) => m.key.startsWith('col_') && !ownedKeys.includes(m.key));
      // +10 星星币与事件日志独立于「是否能再解锁新萌可」，
      // 否则图鉴集齐后（无候选萌可）里程碑奖励会静默消失。
      await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + 10 WHERE child_id = ?', args: [childId] });
      const mokoNote = candidate ? `解锁新萌可「${candidate.name}」，并` : '';
      await logGrowthEvent(childId, 'milestone', '🌟', `连续 ${practiceStreak} 日一练达成！`, `${mokoNote}收获 10 星星币！`);
      if (candidate) {
        await db.execute({
          sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
                VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
                ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
          args: [childId, candidate.key],
        });
        milestone = { mokoKey: candidate.key, mokoName: candidate.name ?? '新萌可', img: candidate.img ?? '' };
      }
      await db.execute({ sql: 'UPDATE daily_practice SET streak_rewarded = 1 WHERE child_id = ? AND day = ?', args: [childId, today] });
    }
  }

  const rewards = newlyMokos.length > 0 ? { mokos: newlyMokos, sunlight: sunlightGain, prosperity } : undefined;

  return {
    ok: true,
    correct: correctTotal,
    total,
    completed: allDone,
    subjects,
    practiceStreak,
    rewards,
    milestone,
    tickets: ticketGain,
  };
}