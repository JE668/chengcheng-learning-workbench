'use client';

import { ClayCard } from '@/components/design-system';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: boolean;
  hint: string;
}

/** 成就：徽章墙（未解锁显示 ?? 与提示） */
export function AchievementTab({ badges }: { badges: Badge[] }) {
  return (
    <div>
      <h2 className="section-title mb-3">🏅 我的成就徽章</h2>
      <p className="text-xs text-gray-500 mb-3">每解锁一只萌可、每次坚持打卡，都会点亮一枚徽章！</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((b) => (
          <ClayCard key={b.id} theme={b.earned ? 'gold' : 'secondary'} className="p-3 text-center">
            <div className="text-4xl mb-1 grayscale-[0.3]">{b.emoji}</div>
            <div className="font-black text-sm">{b.earned ? b.name : '??'}</div>
            <div className="text-[11px] mt-1 leading-tight">
              {b.earned ? b.desc : `🔒 ${b.hint}`}
            </div>
          </ClayCard>
        ))}
      </div>
    </div>
  );
}
