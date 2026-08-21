import type { Subject } from './types';

/* 📔 萌可成长日记 */
export interface GrowthEvent {
  id: number;
  day: string;
  type: string;
  emoji: string;
  title: string;
  desc: string | null;
  created_at: string;
}

/* ----------------------------- 类型定义 ----------------------------- */
export type MokoStage = 'obtained' | 'settled' | 'playing' | 'friend';
export const STAGE_ORDER: MokoStage[] = ['obtained', 'settled', 'playing', 'friend'];

export interface ResidentMoko {
  key: string;
  name: string;
  img: string;
  emoji: string;
  color: string;
  stage: MokoStage;
  mood: number;
  status: 'resident' | 'fled';
  progress: number;
  nextStage: MokoStage | null;
}

export interface CastleStateView {
  today: string;
  sunlight: number;
  starCoins: number;
  prosperity: number;
  streakDays: number;
  shieldEquipped: number;
  skin: string;
  checkins: Record<Subject, 'pending' | 'child_done' | 'confirmed'>;
  residents: ResidentMoko[];
  gallery: { key: string; name: string; img: string; emoji: string; color: string; category?: string; subject?: string; owned: boolean }[];
  troublemakers: { key: string; name: string; img: string }[];
  inventory: Record<string, number>;
  missedDays: { day: string; missed: Subject[]; hasTrouble: boolean }[];
  canBuyShield: boolean;
  freezeCount: number;
  noStarToday: boolean;
  harvestableStars: number;
  friendTotal: number;
  friendHarvestedToday: number;
  penaltyAlert: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: boolean;
  hint: string;
}

export const STAGE_LABEL: Record<MokoStage, string> = {
  obtained: '刚解锁',
  settled: '入驻城堡',
  playing: '开心玩耍',
  friend: '成为好朋友',
};