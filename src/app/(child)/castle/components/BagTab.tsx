'use client';

import { ClayCard, ClayButton } from '@/components/design-system';
import { EmptyState } from '@/components/EmptyState';
import { starShop } from '@/lib/moko';
import { TimeGlassCard } from './TimeGlass';
import type { StateView } from './types';

/** 背包：星星币余额 + 各类道具 + 补打卡时光沙漏 */
export function BagTab({
  state,
  busy,
  onUseItem,
}: {
  state: StateView;
  busy: boolean;
  onUseItem: (itemKey: string, day?: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="section-title">🎒 魔法背包</h2>
      <ClayCard className="text-sm text-gray-600">
        星星币余额：⭐ {state.starCoins}　护盾：🛡️ {state.shieldEquipped}
        {state.freezeCount > 0 ? `　冰冻：🧊 ×${state.freezeCount}` : ''}
      </ClayCard>
      {Number(state.inventory.spray || 0) > 0 && (
        <ClayCard theme="mint" className="flex items-center gap-3">
          <div className="text-4xl">🧴</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-moko-violet">魔法喷雾 ×{state.inventory.spray}</div>
            <div className="text-xs text-gray-500">捉回捣蛋萌可 + 安抚萌可 + 找回星星币</div>
          </div>
          <ClayButton variant="mint" size="sm" disabled={busy} onClick={() => onUseItem('spray')}>
            帮乐美捉回
          </ClayButton>
        </ClayCard>
      )}
      {Number(state.inventory.shield || 0) > 0 && (
        <ClayCard className="flex items-center gap-3">
          <div className="text-4xl">🛡️</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-moko-violet">护盾 ×{state.inventory.shield}</div>
            <div className="text-xs text-gray-500">已自动装备，能帮乐美挡住一次捣蛋萌可</div>
          </div>
        </ClayCard>
      )}
      {state.freezeCount > 0 && (
        <ClayCard className="flex items-center gap-3">
          <div className="text-4xl">🧊</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-moko-violet">冰冻徽章 ×{state.freezeCount}</div>
            <div className="text-xs text-gray-500">下次漏卡时自动消耗，保护连胜不中断</div>
          </div>
        </ClayCard>
      )}
      {Number(state.inventory.timeglass || 0) > 0 && (
        <TimeGlassCard
          count={Number(state.inventory.timeglass)}
          busy={busy}
          onUse={(day) => onUseItem('timeglass', day)}
        />
      )}
      {starShop
        .filter((s) => Number(state.inventory[s.key] || 0) > 0)
        .map((s) => (
          <ClayCard key={s.key} className="flex items-center gap-3">
            <div className="text-4xl">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-moko-violet">
                {s.name} ×{state.inventory[s.key]}
              </div>
              <div className="text-xs text-gray-500">已拥有</div>
            </div>
          </ClayCard>
        ))}
      {Object.keys(state.inventory).length === 0 && (
        <EmptyState emoji="🎒" title="背包还是空的" desc="去魔法商店用阳光能量兑换好物吧！" />
      )}
    </div>
  );
}
