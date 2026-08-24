import { MokoCategoryKey } from '@/lib/types';

interface MokoAvatarProps {
  img?: string;
  emoji: string;
  name: string;
  /** 边长（px），默认 80 */
  size?: number;
  owned?: boolean;
  className?: string;
  /** 头像框 key（如 'frame' 或空） */
  frameKey?: string;
  /** 装饰勋章 key（如 'badge_star' 或空） */
  badgeKey?: string;
}

/**
 * 萌可头像：有图片用图片，缺图用「彩色圆底 + emoji」兜底。
 * 用于城堡图鉴、大厅居民、首页等任何需要萌可头像的地方。
 */
const FRAME_STYLES: Record<string, string> = {
  frame: 'ring-4 ring-moko-gold ring-offset-2 rounded-2xl shadow-lg shadow-yellow-300/50',
  frame_silver: 'ring-4 ring-gray-300 ring-offset-2 rounded-2xl shadow-lg shadow-gray-300/50',
  frame_rainbow: 'ring-4 ring-offset-2 rounded-2xl rainbow-ring animate-rainbow',
  frame_star: 'ring-4 ring-moko-cyan ring-offset-2 rounded-2xl shadow-lg shadow-cyan-300/50',
  frame_heart: 'ring-4 ring-moko-pink ring-offset-2 rounded-2xl shadow-lg shadow-pink-300/50',
  frame_crown: 'ring-4 ring-moko-gold ring-offset-2 rounded-2xl shadow-lg shadow-yellow-300/50 crown-glow',
};
const BADGE_EMOJIS: Record<string, string> = {
  badge_star: '⭐',
  badge_heart: '💗',
};

export function MokoAvatar({ img, emoji, name, size = 80, owned = true, className = '', frameKey, badgeKey }: MokoAvatarProps) {
  const frameCls = frameKey && FRAME_STYLES[frameKey] ? FRAME_STYLES[frameKey] : '';
  const badgeEmoji = badgeKey && BADGE_EMOJIS[badgeKey] ? BADGE_EMOJIS[badgeKey] : '';
  const base = `rounded-2xl border-4 border-white shadow object-cover ${frameCls} ${className}`;
  if (img) {
    return (
      <div className="relative inline-block" style={{ width: size, height: size }}>
        <img
          src={img}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`${base} ${owned ? '' : 'grayscale'}`}
          style={{ width: size, height: size }}
        />
        {badgeEmoji && <span className="absolute -top-1 -right-1 text-lg z-10 drop-shadow-lg">{badgeEmoji}</span>}
      </div>
    );
  }
  return (
    <div
      className={`${base} flex items-center justify-center ${owned ? 'bg-white/70' : 'bg-gray-200 grayscale'}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-label={name}
      title={name}
    >
      {emoji}
    </div>
  );
}

export type { MokoCategoryKey };
