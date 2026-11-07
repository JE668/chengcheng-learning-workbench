'use client';

import Link from 'next/link';
import { ClayCard } from '@/components/design-system';
import { GuideModal } from '@/components/GuideModal';
import type { PracticeDayRecord } from '@/lib/daily-practice';

/** 今日练习已经完成时的总结，以及可用时光沙漏再加练一次的入口。 */
export function PracticeCompleted({
  data,
  hasTimeGlass,
  onUseTimeGlass,
}: {
  data: PracticeDayRecord;
  hasTimeGlass: boolean;
  onUseTimeGlass: () => void | Promise<void>;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ClayCard
        theme="gradient-gold-yellow"
        className="text-center p-8 bg-gradient-to-br from-moko-gold to-moko-yellow text-white"
      >
        <div className="text-6xl mb-3">🌟</div>
        <h2 className="text-3xl font-black mb-2">今天的一练完成啦！</h2>
        <p className="text-lg opacity-90">三科打卡已自动完成，萌可们超开心～</p>
        <p className="mt-4 text-sm">
          已连续完成 <b className="text-xl">{data.practiceStreak}</b> 天 · 再坚持{' '}
          <b>{data.nextMilestone}</b> 天解锁新萌可 🧸
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href="/home"
            className="px-6 py-3 rounded-full bg-white text-moko-violet font-black"
          >
            返回首页
          </Link>
          <Link
            href="/castle"
            className="px-6 py-3 rounded-full bg-moko-rose text-white font-black"
          >
            去看城堡
          </Link>
        </div>
      </ClayCard>
      {hasTimeGlass && (
        <div className="mt-4 rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-violet/20 text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-sm text-gray-600 mb-3">
            你有时光沙漏！可以用它再做一次今天的每日一练（不影响已得的奖励）
          </p>
          <button
            onClick={() => void onUseTimeGlass()}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black text-sm clay-btn clay-theme clay-violet transition"
          >
            ⏳ 使用时光沙漏再做一次
          </button>
        </div>
      )}
      <div className="mt-4 text-center">
        <GuideModal
          trigger={
            <span className="inline-block px-4 py-2 rounded-full bg-white shadow text-moko-violet font-bold cursor-pointer">
              📖 查看攻略说明
            </span>
          }
        />
      </div>
    </div>
  );
}
