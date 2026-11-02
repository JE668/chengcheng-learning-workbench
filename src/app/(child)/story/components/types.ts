/**
 * 剧情章节解锁状态（与 page.tsx 共用）
 */
export interface StoryProgress {
  captured: string[];
  read: string[];
  quiz: string[];
  nextIndex: number;
  total: number;
  allDone: boolean;
  tickets: number;
}

/** 模块绑定章节的解锁信息 */
export interface StoryModuleInfo {
  label: string;
  done: boolean;
  href: string;
}
