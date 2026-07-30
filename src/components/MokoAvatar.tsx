import { MokoCategoryKey } from '@/lib/types';

interface MokoAvatarProps {
  img?: string;
  emoji: string;
  name: string;
  /** 边长（px），默认 80 */
  size?: number;
  owned?: boolean;
  className?: string;
}

/**
 * 萌可头像：有图片用图片，缺图用「彩色圆底 + emoji」兜底。
 * 用于城堡图鉴、大厅居民、首页等任何需要萌可头像的地方。
 */
export function MokoAvatar({ img, emoji, name, size = 80, owned = true, className = '' }: MokoAvatarProps) {
  const base = `rounded-2xl border-4 border-white shadow object-cover ${className}`;
  if (img) {
    return (
      <img
        src={img}
        alt={name}
        className={`${base} ${owned ? '' : 'grayscale'}`}
        style={{ width: size, height: size }}
      />
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
