'use client';

// 轻量「活动计数」：用 localStorage 记录各模块被玩的次数，
// 用于学科徽章的进度展示（无需后端，按本机累计）。
const KEY = 'cc_activity_v1';

export type ActivityKey = 'pinyin' | 'trace' | 'picto' | 'poem' | 'talk' | 'math' | 'quiz';

type Counts = Partial<Record<ActivityKey, number>>;

export function trackActivity(k: ActivityKey): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY);
    const c: Counts = raw ? (JSON.parse(raw) as Counts) : {};
    c[k] = (c[k] ?? 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* 忽略隐私模式等写入失败 */
  }
}

export function getActivity(): Counts {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Counts) : {};
  } catch {
    return {};
  }
}
