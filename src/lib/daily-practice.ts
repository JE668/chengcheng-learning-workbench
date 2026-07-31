import { getDb } from './db';
import { confirm, logGrowthEvent } from './castle';
import { PINYIN_TONES, applyTone, ALL_EN_WORDS } from './study-data';
import { mokoChars, subjectMokoKey, SUN_PER_SUBJECT } from './moko';
import { mokoCollection } from './moko-collection';
import type { Subject } from './types';

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
      options: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: 'english';
      subject: Subject;
      prompt: string;
      word: string;
      cn: string;
      emoji: string;
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

export interface PracticeSubmitResult {
  ok: boolean;
  correct: number;
  total: number;
  completed: boolean;
  practiceStreak?: number;
  rewards?: { mokos: string[]; sunlight: number; prosperity: boolean };
  milestone?: { mokoKey: string; mokoName: string; img: string };
}

/* ----------------------------- 时间工具（本地副本，避免改动 castle 导出面） ----------------------------- */
function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dateStr(dt);
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
  const base = PINYIN_FULL[randInt(0, PINYIN_FULL.length - 1)];
  const tones = PINYIN_TONES[base];
  const t = randInt(1, 4);
  const han = tones[t - 1];
  const marked = [1, 2, 3, 4].map((tn) => applyTone(base, tn));
  const options = shuffle(marked);
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

function genMathQ(): PracticeQuestion {
  const isAdd = Math.random() < 0.6;
  let a: number, b: number, ans: number, prompt: string;
  if (isAdd) {
    a = randInt(0, 12);
    b = randInt(0, 12);
    ans = a + b;
    prompt = `${a} + ${b} = ?`;
  } else {
    a = randInt(2, 18);
    b = randInt(0, a);
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

function genEnglishQ(): PracticeQuestion {
  const w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
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

function generateQuestions(): PracticeQuestion[] {
  const qs: PracticeQuestion[] = [];
  const usedPinyin = new Set<string>();
  for (let i = 0; i < 3; i++) {
    let base = PINYIN_FULL[randInt(0, PINYIN_FULL.length - 1)];
    let guard = 0;
    while (usedPinyin.has(base) && guard++ < 20) base = PINYIN_FULL[randInt(0, PINYIN_FULL.length - 1)];
    usedPinyin.add(base);
    qs.push(genPinyinQ());
  }
  for (let i = 0; i < 3; i++) qs.push(genMathQ());
  const usedEn = new Set<string>();
  for (let i = 0; i < 3; i++) {
    let w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
    let guard = 0;
    while (usedEn.has(w.word) && guard++ < 20) w = ALL_EN_WORDS[randInt(0, ALL_EN_WORDS.length - 1)];
    usedEn.add(w.word);
    qs.push(genEnglishQ());
  }
  return qs;
}

/* ----------------------------- 连续练习天数 ----------------------------- */
async function computePracticeStreak(childId: number, today: string): Promise<number> {
  const db = getDb();
  let streak = 0;
  let d = today;
  for (let i = 0; i < 400; i++) {
    const r = await db.execute({
      sql: 'SELECT completed FROM daily_practice WHERE child_id = ? AND day = ?',
      args: [childId, d],
    });
    if (r.rows.length && Number(r.rows[0].completed) === 1) {
      streak++;
      d = addDays(d, -1);
    } else break;
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
    const qs = generateQuestions();
    await db.execute({
      sql: 'INSERT OR IGNORE INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 0, 0, ?, ?)',
      args: [childId, today, qs.length, JSON.stringify(qs)],
    });
    row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  }
  const streak = await computePracticeStreak(childId, today);
  const nextMilestone = streak > 0 ? 7 - (streak % 7) : 7;
  if (!row) {
    return { completed: false, correct: 0, total: 0, questions: [], practiceStreak: streak, nextMilestone };
  }
  const questions: PracticeQuestion[] = row.questions ? JSON.parse(String(row.questions)) : [];
  return {
    completed: Number(row.completed) === 1,
    correct: Number(row.correct),
    total: Number(row.total),
    questions,
    practiceStreak: streak,
    nextMilestone,
  };
}

/** 提交答案：全对 → 合并三科打卡 + 奖励；否则仅记录正确数，不合并。 */
export async function submitPractice(childId: number, answers: number[]): Promise<PracticeSubmitResult> {
  const db = getDb();
  const today = dateStr();
  let row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  if (!row) {
    const qs = generateQuestions();
    await db.execute({
      sql: 'INSERT OR IGNORE INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 0, 0, ?, ?)',
      args: [childId, today, qs.length, JSON.stringify(qs)],
    });
    row = (await db.execute({ sql: 'SELECT * FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  }
  const questions: PracticeQuestion[] = JSON.parse(String(row.questions));
  const total = questions.length;
  let correct = 0;
  for (let i = 0; i < total; i++) if (answers[i] === questions[i].answer) correct++;

  if (correct < total) {
    await db.execute({
      sql: 'UPDATE daily_practice SET correct = ?, total = ? WHERE child_id = ? AND day = ?',
      args: [correct, total, childId, today],
    });
    return { ok: false, correct, total, completed: false };
  }

  // ✅ 全对：标记完成 + 合并三科打卡
  await db.execute({
    sql: 'UPDATE daily_practice SET completed = 1, correct = ?, total = ?, completed_at = CURRENT_TIMESTAMP WHERE child_id = ? AND day = ?',
    args: [correct, total, childId, today],
  });

  const mokos: string[] = [];
  const SUBJECTS: Subject[] = ['语文', '数学', '英语'];
  for (const s of SUBJECTS) {
    await confirm(childId, today, s);
    mokos.push(mokoChars[subjectMokoKey[s]]?.name ?? '萌可');
  }
  const prosperity = true; // 三科全确认后 confirm 内部已加繁荣度

  // 🌟 连续 7 天里程碑：解锁一只新萌可 + 10 星星币
  const streak = await computePracticeStreak(childId, today);
  const stRow = (await db.execute({ sql: 'SELECT streak_rewarded FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, today] })).rows[0];
  let milestone: PracticeSubmitResult['milestone'];
  if (streak % 7 === 0 && Number(stRow?.streak_rewarded ?? 0) !== 1) {
    const ownedKeys = (await db.execute({ sql: 'SELECT moko_key FROM moko_owned WHERE child_id = ?', args: [childId] })).rows.map((r) => String(r.moko_key));
    const candidate = mokoCollection.find((m) => m.key.startsWith('col_') && !ownedKeys.includes(m.key));
    if (candidate) {
      await db.execute({
        sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
              VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
              ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
        args: [childId, candidate.key],
      });
      await db.execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + 10 WHERE child_id = ?', args: [childId] });
      await logGrowthEvent(childId, 'milestone', '🌟', '连续 7 日一练达成！', `解锁新萌可「${candidate.name}」，并收获 10 星星币！`);
      milestone = { mokoKey: candidate.key, mokoName: candidate.name ?? '新萌可', img: candidate.img ?? '' };
    }
    await db.execute({ sql: 'UPDATE daily_practice SET streak_rewarded = 1 WHERE child_id = ? AND day = ?', args: [childId, today] });
  }

  return {
    ok: true,
    correct,
    total,
    completed: true,
    practiceStreak: streak,
    rewards: { mokos, sunlight: SUN_PER_SUBJECT * 3, prosperity },
    milestone,
  };
}
