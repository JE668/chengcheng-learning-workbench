/** 英语模块共享工具（EnglishModules 拆分，2026-10-17）。 */

/** Levenshtein 距离：语音评分用（WordModule 跟读打分 / EnSpeakModule 口语评测）。 */
export function lev(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

/* ---------- 听音选词难度定义（EnListenModule 专用，从原 EnglishModules 迁入） ---------- */
import type { WordItem } from '@/lib/study-data-en';
import { ALL_EN_WORDS } from '@/lib/study-data-en';

export type DiffLevel = 'easy' | 'medium' | 'hard';
export const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
export const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

const EN_WORD_MAP: Record<string, WordItem> = Object.fromEntries(
  ALL_EN_WORDS.map((w) => [w.word, w])
);
export const EN_EASY_WORDS = [
  'apple',
  'dog',
  'cat',
  'sun',
  'red',
  'blue',
  'eye',
  'ear',
  'book',
  'one',
  'two',
  'mom',
]
  .map((w) => EN_WORD_MAP[w])
  .filter(Boolean) as WordItem[];
