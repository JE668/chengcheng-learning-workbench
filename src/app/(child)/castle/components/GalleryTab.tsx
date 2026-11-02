'use client';

import { ClayCard } from '@/components/design-system';
import { MokoAvatar } from '@/components/MokoAvatar';
import { SeriesCompleteBanner } from '@/components/SeriesCompleteBanner';
import { MokoCategories } from '@/lib/moko';
import type { StateView } from './types';

/** 图鉴（按系列分类） */
export function GalleryTab({ state }: { state: StateView }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">📖 萌可图鉴</h2>
        <span className="text-sm text-gray-500">
          共 {state.gallery.length} 种　已收集 {state.gallery.filter((g) => g.owned).length}
        </span>
      </div>
      {MokoCategories.filter((c) => c.key !== 'trouble').map((cat) => {
        const items = state.gallery.filter((g) => g.category === cat.key);
        if (!items.length) return null;
        const ownedCount = items.filter((g) => g.owned).length;
        const complete = ownedCount === items.length;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{cat.emoji}</span>
              <h2 className="section-title">{cat.label}</h2>
              <span className="text-xs text-gray-400 hidden sm:inline">{cat.desc}</span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ml-auto ${complete ? 'bg-moko-gold text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {complete ? '👑 系列全齐' : `${ownedCount}/${items.length}`}
              </span>
            </div>

            {complete && (
              <div className="mb-3">
                <SeriesCompleteBanner
                  catKey={cat.key}
                  label={cat.label}
                  emoji={cat.emoji}
                  members={items.map((g) => ({ img: g.img, emoji: g.emoji, name: g.name }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((g) => (
                <ClayCard
                  key={g.key}
                  theme="purple"
                  className={`text-center ${g.owned ? '' : 'opacity-70'}`}
                >
                  <MokoAvatar
                    img={g.img}
                    emoji={g.emoji}
                    name={g.name}
                    size={80}
                    owned={g.owned}
                    className="mx-auto"
                  />
                  <div className="font-bold text-moko-violet text-sm mt-1">{g.name}</div>
                  <div className="text-xs text-gray-500">{g.owned ? '已收集 ✅' : '未解锁 🔒'}</div>
                </ClayCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
