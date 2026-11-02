'use client';

/** 城堡居民（入驻的萌可） */
export type Stage = 'obtained' | 'settled' | 'playing' | 'friend';

export interface Resident {
  key: string;
  name: string;
  img: string;
  emoji: string;
  color: string;
  stage: Stage;
  mood: number;
  status: 'resident' | 'fled';
  progress: number;
  nextStage: Stage | null;
}

/** /api/castle/state 返回的视图数据 */
export interface StateView {
  today: string;
  sunlight: number;
  starCoins: number;
  prosperity: number;
  streakDays: number;
  shieldEquipped: number;
  skin: string;
  checkins: Record<string, string>;
  residents: Resident[];
  gallery: {
    key: string;
    name: string;
    img: string;
    emoji: string;
    color: string;
    category?: string;
    subject?: string;
    owned: boolean;
  }[];
  troublemakers: { key: string; name: string; img: string }[];
  inventory: Record<string, number>;
  missedDays: { day: string; missed: string[]; hasTrouble: boolean }[];
  canBuyShield: boolean;
  noStarToday: boolean;
  freezeCount: number;
  harvestableStars: number;
  friendTotal: number;
  friendHarvestedToday: number;
  penaltyAlert: string;
}

export const STAGE_LABEL: Record<Stage, string> = {
  obtained: '刚解锁',
  settled: '入驻城堡',
  playing: '开心玩耍',
  friend: '好朋友',
};

export const SKINS = [
  { key: 'default', name: '梦幻城堡', emoji: '🏰' },
  { key: 'skin_star', name: '星空城堡', emoji: '🌌' },
  { key: 'skin_candy', name: '糖果城堡', emoji: '🍬' },
  { key: 'skin_ocean', name: '海洋城堡', emoji: '🌊' },
  { key: 'skin_garden', name: '花园城堡', emoji: '🌸' },
  { key: 'skin_magic', name: '魔法城堡', emoji: '🔮' },
];

export const TABS = [
  ['hall', '🏰 大厅'],
  ['gallery', '📖 图鉴'],
  ['shop', '🛍️ 商店'],
  ['bag', '🎒 背包'],
  ['achv', '🏅 成就'],
] as const;

export type CastleTab = (typeof TABS)[number][0];

export const FRAME_PRIORITY = [
  'frame_crown',
  'frame_rainbow',
  'frame',
  'frame_star',
  'frame_heart',
  'frame_silver',
];
export const BADGE_KEYS = ['badge_star', 'badge_heart'];

export function determineFrame(inv: Record<string, number>): string | undefined {
  for (const k of FRAME_PRIORITY) {
    if (Number(inv[k] || 0) > 0) return k;
  }
  return Number(inv.frame || 0) > 0 ? 'frame' : undefined;
}

export function determineBadge(inv: Record<string, number>): string | undefined {
  for (const k of BADGE_KEYS) {
    if (Number(inv[k] || 0) > 0) return k;
  }
  return undefined;
}
