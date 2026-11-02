'use client';

import { ClayCard, ClayButton } from '@/components/design-system';
import { magicShop } from '@/lib/moko';
import type { StateView } from './types';

/** 魔法商店（阳光能量兑换） */
export function ShopTab({
  state,
  busy,
  onBuy,
}: {
  state: StateView;
  busy: boolean;
  onBuy: (itemKey: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="section-title">🧪 魔法商店（阳光能量）</h2>
      {magicShop.map((s) => (
        <ClayCard key={s.key} className="flex items-center gap-3">
          <div className="text-4xl">{s.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-moko-violet">{s.name}</div>
            <div className="text-xs text-gray-500">{s.desc}</div>
            {s.key === 'shield' && !state.canBuyShield && (
              <div className="text-xs text-red-400">
                需连续打卡 3 天（当前 {state.streakDays} 天）
              </div>
            )}
          </div>
          <ClayButton
            variant="gold"
            size="sm"
            onClick={() => onBuy(s.key)}
            disabled={busy}
            className="whitespace-nowrap"
          >
            ☀️ {s.cost}
          </ClayButton>
        </ClayCard>
      ))}
    </div>
  );
}
