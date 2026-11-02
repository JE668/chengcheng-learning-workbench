'use client';

import Image from 'next/image';
import { ClayCard } from '@/components/design-system';
import { MokoAvatar } from '@/components/MokoAvatar';
import { EmptyState } from '@/components/EmptyState';
import { determineFrame, determineBadge, STAGE_LABEL, type StateView } from './types';

/** 大厅：入驻萌可 + 捣蛋萌可捣乱动画 + 皮肤背景 */
export function HallTab({ state }: { state: StateView }) {
  return (
    <ClayCard
      theme="gold"
      className={`relative overflow-hidden ${state.shieldEquipped > 0 ? 'shield-glow' : ''}`}
    >
      <div
        className={`castle-bg rounded-2xl p-4 min-h-[260px] ${state.skin === 'skin_star' ? 'castle-skin-star' : state.skin === 'skin_candy' ? 'castle-skin-candy' : state.skin === 'skin_ocean' ? 'castle-skin-ocean' : state.skin === 'skin_garden' ? 'castle-skin-garden' : state.skin === 'skin_magic' ? 'castle-skin-magic' : 'castle-skin-default'}`}
      >
        {state.troublemakers.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {state.troublemakers.map((t, i) => (
              <Image
                key={i}
                src={t.img || '/moko/lemei.webp'}
                alt={t.name}
                width={64}
                height={64}
                className="trouble-fly absolute w-16 h-16 rounded-full border-2 border-red-400 shadow-lg"
                style={{
                  top: `${10 + i * 18}%`,
                  left: `${20 + i * 25}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-4 relative z-10">
          {state.residents.map((r) => (
            <div
              key={r.key}
              className={`w-28 text-center ${r.mood < 3 ? 'moko-sad' : 'moko-enter'} ${r.stage === 'friend' ? 'moko-walk' : ''}`}
            >
              <div className="relative">
                <MokoAvatar
                  img={r.img}
                  emoji={r.emoji}
                  name={r.name}
                  size={96}
                  className="mx-auto"
                  frameKey={determineFrame(state.inventory)}
                  badgeKey={determineBadge(state.inventory)}
                />
                <div className="absolute -top-2 -right-2 text-lg">
                  {'❤️'.repeat(r.mood)}
                  {'🖤'.repeat(3 - r.mood)}
                </div>
              </div>
              <div className="font-bold text-moko-violet text-sm mt-1">{r.name}</div>
              <div className="text-xs text-gray-500">{STAGE_LABEL[r.stage]}</div>
              {r.stage !== 'friend' && (
                <div className="h-1.5 rounded-full bg-white/70 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-moko-mint transition-all duration-700"
                    style={{ width: `${Math.round(r.progress * 100)}%` }}
                  />
                </div>
              )}
              {r.stage === 'friend' && (
                <div className="text-xs text-moko-mint font-bold mt-1">产出 ⭐</div>
              )}
            </div>
          ))}
          {state.residents.length === 0 && (
            <EmptyState
              emoji="🧸"
              title="还没有萌可入驻"
              desc="去完成「今日一练」打卡，就能召唤第一只萌可啦！"
            />
          )}
        </div>
      </div>
      {state.troublemakers.length > 0 && (
        <p className="text-red-500 font-bold text-sm mt-3">
          ⚠️ {state.troublemakers.length}{' '}
          只捣蛋萌可溜进城堡捣乱！快在背包用魔法喷雾，和乐美一起把它们捉回去，或请爸爸妈妈补作业。
        </p>
      )}
    </ClayCard>
  );
}
