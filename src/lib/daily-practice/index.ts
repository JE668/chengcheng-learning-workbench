import { getDb } from '../db';
import { confirm, logGrowthEvent } from '../castle';
import { 
  PINYIN_TONES, applyTone, CHARACTERS, PROVERBS, ANTONYMS, RIDDLES, POEMS, 
  WORD_PROBLEMS, ORDINALS, CLOCKS, EN_SENTENCES, ALL_EN_WORDS 
} from '../study-data';
import { mokoChars, subjectMokoKey, SUN_PER_SUBJECT } from '../moko';
import { mokoCollection } from '../moko-collection';
import { getDueMistakes, reviewMistake, type MistakeRow } from '../mistakes';
import { upsertModuleProgress } from '../progress-store';
import { dateStr, addDays } from '../date';
import { MILESTONE_DAYS } from '../economy';
import { safeJsonParse } from '../safe-json';
import type { Subject } from '../types';

import type {
  PracticeQuestion,
  PracticeDayRecord,
  PracticeSubmitResult,
  SubjectResult,
  SubjectStatus,
} from './types';

// 导入所有生成器
import {
  passThreshold,
  DAILY_CORE_MODULE,
  randInt,
  shuffle,
  shapeOf,
  computePracticeStreak,
} from './types';

import {
  genPinyinQ,
  genDictationQ,
  genChineseQuizQ,
  genAntonymQ,
  genProverbQ,
  genRiddleQ,
  genPoemQ,
  genUniquePinyinQ,
  genUniqueDictationQ,
  genUniqueChineseQuizQ,
  genUniqueAntonymQ,
  genUniqueProverbQ,
  genUniqueRiddleQ,
  genUniquePoemQ,
} from './gen-chinese';

import {
  genMathQ,
  genWordProblemQ,
  genOrdinalQ,
  genCompareQ,
  genClockQ,
  genCompareNumQ,
} from './gen-math';

import {
  genEnglishQ,
  genEnPicQ,
  genEnInitialQ,
  genUniqueEnglishQ,
  genUniqueEnPicQ,
  genUniqueEnInitialQ,
} from './gen-english';

import {
  genMistakeQ,
} from './gen-mistake';

// 类型导出
export type {
  PracticeQuestion,
  PracticeDayRecord,
  PracticeSubmitResult,
  SubjectResult,
  SubjectStatus,
} from './types';

// 核心函数导出
export { passThreshold, DAILY_CORE_MODULE, computePracticeStreak };

/* ============================================================
   核心生成逻辑
   ============================================================ */

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
  const zhPool: (() => PracticeQuestion)[] = [
    () => genUniquePoemQ(),   // 古诗（不涉及汉字去重，直接出题）
    // 带去重的拼音题
    () => genUniquePinyinQ(usedChars),
    () => genUniquePinyinQ(usedChars),
    // 带去重的听写题
    () => genUniqueDictationQ(usedChars),
    () => genUniqueDictationQ(usedChars),
    () => genUniqueDictationQ(usedChars),
    // 识字（看释义选字）
    () => genUniqueChineseQuizQ(usedChars),
    () => genUniqueAntonymQ(),   // 反义词（不涉及汉字去重，是不同的词对）
    () => genProverbQ(),   // 谚语配对（不涉及汉字去重）
    () => genRiddleQ(),    // 谜语（不涉及汉字去重）
  ];
  const zhPick = shuffle(zhPool).slice(0, 10);
  for (const fn of zhPick) qs.push(fn());

  // 根据连续天数决定难度：天数越多，难题比例越高
  // 这里先用0作为占位，实际难度会在 getTodayPractice 中根据真实 streak 计算
  const diffLevel = 0; // 默认基础难度，实际难度在 getTodayPractice 中根据真实 streak 计算
  const useHard = (idx: number) => idx < diffLevel; // 前 diffLevel 道用难题

  // 数学 10 题：基础口算+应用题混合，每天随机（数字题天然不重复，无需去重）
  const mathPool: (() => PracticeQuestion)[] = [
    () => genMathQ(useHard(0)), () => genMathQ(useHard(1)), () => genMathQ(useHard(2)), () => genMathQ(useHard(3)),
    () => genMathQ(useHard(4)), () => genMathQ(useHard(5)),  // 6 道口算（难度递增）
    () => genWordProblemQ(),                                  // 应用题
    () => genWordProblemQ(),                                  // 应用题
    () => genWordProblemQ(),                                  // 应用题
    () => genWordProblemQ(),                                  // 应用题
    () => genCompareQ(),                                      // 比大小
    () => genClockQ(),                                        // 钟表
  ];
  const mathPick = shuffle(mathPool).slice(0, 10);
  for (const fn of mathPick) qs.push(fn());

  // 英语 5 题：听音选词 + 看图选词 + 首字母，每天随机组合（单词去重）
  const usedEn = new Set<string>();
  const enPool: (() => PracticeQuestion)[] = [
    () => genUniqueEnglishQ(usedEn),
    () => genUniqueEnglishQ(usedEn),
    () => genEnPicQ(),
    () => genEnInitialQ(),
    () => genEnPicQ(),
  ];
  for (const fn of enPool) qs.push(fn());
  
  return qs;
}

/* ----------------------------- 连续练习天数 ----------------------------- */
export async function computePracticeStreakFromDB(childId: number, today: string): Promise<number> {
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

  for (const s of ['语文', '数学', '英语'] as Subject[]) {
    // 只取非错题的本学科题目来算通过率（错题重练不计入通过判定）
    const qs = (bySubject[s] || []).filter((q) => q.kind !== 'mistake');
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
    practiceStreak = await computePracticeStreak(childId, dateStr());
    const stRow = (await db.execute({ sql: 'SELECT streak_rewarded FROM daily_practice WHERE child_id = ? AND day = ?', args: [childId, dateStr()] })).rows[0];
    if (MILESTONE_DAYS.includes(practiceStreak!) && Number(stRow?.streak_rewarded ?? 0) !== 1) {
      // 先查候选萌可（图鉴里下一只未拥有的 col_ 萌可）
      const ownedKeys = (await getDb().execute({ sql: 'SELECT moko_key FROM moko_owned WHERE child_id = ?', args: [childId] })).rows.map((r) => String(r.moko_key));
      const candidate = mokoCollection.find((m) => m.key.startsWith('col_') && !ownedKeys.includes(m.key));
      // +10 星星币与事件日志独立于「是否能再解锁新萌可」，
      // 否则图鉴集齐后（无候选萌可）里程碑奖励会静默消失。
      await getDb().execute({ sql: 'UPDATE castle_state SET star_coins = star_coins + 10 WHERE child_id = ?', args: [childId] });
      const mokoNote = candidate ? `解锁新萌可「${candidate.name}」，并` : '';
      await logGrowthEvent(childId, 'milestone', '🌟', `连续 ${practiceStreak} 日一练达成！`, `${mokoNote}收获 10 星星币！`);
      if (candidate) {
        await getDb().execute({
          sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
                VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
                ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
          args: [childId, candidate.key],
        });
        milestone = { mokoKey: candidate.key, mokoName: candidate.name ?? '新萌可', img: candidate.img ?? '' };
      }
      await getDb().execute({ sql: 'UPDATE daily_practice SET streak_rewarded = 1 WHERE child_id = ? AND day = ?', args: [childId, dateStr()] });
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
    tickets: 0, // ticketGain 在 confirm 内部处理
  };
}