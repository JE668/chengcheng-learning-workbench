export type Role = 'parent' | 'child';

export interface User {
  id: number;
  username: string;
  role: Role;
  displayName: string;
}

export interface Task {
  id: number;
  title: string;
  subject: Subject;
  description?: string;
  points: number;
  createdBy: number;
  createdAt: string;
  completed?: boolean;
}

export type Subject = '语文' | '数学' | '英语';

export interface Completion {
  id: number;
  taskId: number;
  childId: number;
  points: number;
  createdAt: string;
}

export interface Redemption {
  id: number;
  childId: number;
  rewardName: string;
  cost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type MokoCategoryKey =
  | 'royal'     // 皇室萌可
  | 'mo'        // 魔方萌可（第一、二季）
  | 'key'       // 钥匙萌可
  | 'jewel'     // 闪亮宝石萌可
  | 'sweetie'   // 魔法甜心萌可
  | 'star'      // 闪耀流星萌可
  | 'princess'  // 闪亮公主萌可
  | 'prince'    // 王子萌可
  | 'villain'   // 反派萌可
  | 'legend'    // 传奇萌可
  | 'guide'     // 引导萌可
  | 'subject'   // 学科萌可（兼容旧分类）
  | 'bonus'     // 奖励萌可（兼容旧分类）
  | 'trouble';  // 捣蛋萌可

export interface MokoChar {
  key: string;
  name: string;
  color: string;
  img?: string;     // 有图片时用图片，缺图时用 emoji 兜底
  emoji: string;    // 无图片时的头像
  season: string;
  item: string;
  line: string;
  category: MokoCategoryKey;
  subject?: Subject;
}
