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

export interface MokoChar {
  key: string;
  name: string;
  color: string;
  img: string;
  season: string;
  item: string;
  line: string;
}
