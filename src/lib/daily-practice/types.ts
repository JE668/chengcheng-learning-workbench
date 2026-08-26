import type { Subject } from '../types';

export interface WordItem {
  word: string;
  sound?: string;
  emoji: string;
  cn: string;
  topic?: string;
  sentence?: string;
}

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
      emoji?: string;
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
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 粗略判断答案「形状」，只有同形状的选项混在一起才不别扭（数字 / 英文 / N 个汉字 / emoji…） */
export function shapeOf(s: string): string {
  if (/^-?\d+$/.test(s)) return 'num';
  // eslint-disable-next-line no-control-regex
  if (/^[\u0000-\u007F]+$/.test(s)) return 'ascii';
  if (/^[\u4e00-\u9fa5]+$/.test(s)) return `han${Array.from(s).length}`;
  return 'other';
}

/* ----------------------------- 连续练习天数 ----------------------------- */
export async function computePracticeStreak(childId: number, today: string): Promise<number> {
  const db = (await import('../db')).getDb();
  // 一次性查询最近 400 天的记录，避免循环 N 次 DB 查询
  const start = (await import('../date')).addDays(today, -400);
  const res = await db.execute({
    sql: 'SELECT day FROM daily_practice WHERE child_id = ? AND completed = 1 AND day >= ? AND day <= ? ORDER BY day DESC',
    args: [childId, start, today],
  });
  const completedDays = new Set(res.rows.map(r => String(r.day)));
  let streak = 0;
  let d = today;
  while (completedDays.has(d)) {
    streak++;
    d = (await import('../date')).addDays(d, -1);
  }
  return streak;
}