'use client';

import { ClayCard } from '@/components/design-system';
import { SKINS } from './types';

/** 城堡皮肤切换（default 常驻；其余需在星星币商城兑换后可用） */
export function SkinSwitcher({
  skin,
  inventory,
  busy,
  onSelect,
}: {
  skin: string;
  inventory: Record<string, number>;
  busy: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <ClayCard className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-moko-violet mr-1">🎨 城堡皮肤：</span>
        {SKINS.map((s) => {
          const owned = s.key === 'default' || Number(inventory[s.key] || 0) > 0;
          const active = skin === s.key;
          return (
            <button
              key={s.key}
              onClick={() => owned && onSelect(s.key)}
              disabled={busy || !owned}
              title={owned ? `换成${s.name}` : '去星星币商城兑换'}
              className={`px-3 py-1.5 rounded-full font-bold text-sm transition ${active ? 'bg-moko-violet text-white' : owned ? 'bg-white text-moko-violet shadow' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {s.emoji} {s.name}
              {!owned && ' 🔒'}
            </button>
          );
        })}
      </div>
    </ClayCard>
  );
}
