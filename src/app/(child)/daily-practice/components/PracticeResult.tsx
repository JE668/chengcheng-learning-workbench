'use client';

import Link from 'next/link';
import { ClayCard } from '@/components/design-system';
import type { PracticeSubmitResult } from '@/lib/daily-practice';

function CompletedResult({ result }: { result: PracticeSubmitResult }) {
  const rewards = result.rewards;
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ClayCard theme="violet" className="overflow-hidden">
        <div className="bg-gradient-to-r from-moko-pink via-moko-rose to-moko-purple p-6 text-white text-center">
          <div className="text-5xl mb-2">🎓</div>
          <h2 className="text-3xl font-black">今日一练报告卡</h2>
          <p className="text-sm opacity-80 mt-1">{dateLabel} · 全部完成</p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {result.subjects.map((subject) => (
              <div key={subject.subject} className="flex items-center gap-3">
                <span className="w-16 text-sm font-bold text-gray-700">{subject.subject}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={
                      'h-full rounded-full transition-all ' +
                      (subject.status === 'passed' || subject.status === 'already'
                        ? 'bg-moko-mint'
                        : 'bg-moko-yellow')
                    }
                    style={{
                      width:
                        ((subject.correct ?? subject.total) / Math.max(1, subject.total)) * 100 +
                        '%',
                    }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-bold">
                  {subject.status === 'passed' || subject.status === 'already'
                    ? '✅ 通过'
                    : `${subject.correct ?? 0}/${subject.total}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {rewards && (
              <>
                <div className="bg-moko-yellow/10 rounded-2xl p-3">
                  <div className="text-2xl">☀️</div>
                  <div className="text-sm font-bold text-moko-gold">+{rewards.sunlight}</div>
                  <div className="text-[11px] text-gray-400">阳光能量</div>
                </div>
                <div className="bg-moko-pink/10 rounded-2xl p-3">
                  <div className="text-2xl">🧸</div>
                  <div className="text-sm font-bold text-moko-rose">+{rewards.mokos.length}</div>
                  <div className="text-[11px] text-gray-400">召唤萌可</div>
                </div>
                <div className="bg-moko-violet/10 rounded-2xl p-3">
                  <div className="text-2xl">🔥</div>
                  <div className="text-sm font-bold text-moko-violet">
                    {result.practiceStreak}天
                  </div>
                  <div className="text-[11px] text-gray-400">连续打卡</div>
                </div>
              </>
            )}
          </div>
          {rewards?.mokos && rewards.mokos.length > 0 && (
            <div className="mt-3 bg-moko-pink/10 rounded-2xl p-3 text-center">
              <span className="text-sm text-gray-600">🧸 今日召唤：</span>
              <span className="text-sm font-bold text-moko-rose">{rewards.mokos.join('、')}</span>
            </div>
          )}
          {(result.tickets ?? 0) > 0 && (
            <div className="mt-2 bg-moko-mint/10 rounded-2xl p-3 text-center">
              <span className="text-sm">
                🎟️ 捕捉券 +{result.tickets}（去「萌可闯关」捉萌可吧！）
              </span>
            </div>
          )}
          {result.milestone && (
            <div className="mt-3 bg-moko-gold/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-moko-gold">
                🌟 连续 {result.practiceStreak} 天达成！
              </div>
              <div className="text-sm mt-1">
                解锁新萌可「{result.milestone.mokoName}」+ 10 ⭐ 星星币
              </div>
            </div>
          )}
        </div>
      </ClayCard>
      <div className="flex gap-3 justify-center mt-5">
        <Link
          href="/home"
          className="px-6 py-3 rounded-full bg-white text-moko-rose font-black shadow border-2 border-moko-rose/20"
        >
          返回首页
        </Link>
        <Link
          href="/castle"
          className="px-6 py-3 rounded-full bg-moko-gold text-white font-black shadow"
        >
          去看城堡
        </Link>
      </div>
    </div>
  );
}

function PartialResult({ result, onRetry }: { result: PracticeSubmitResult; onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ClayCard
        theme="gradient-gold-yellow"
        className="text-center p-8 bg-gradient-to-br from-moko-gold to-moko-yellow text-white"
      >
        <div className="text-6xl mb-3">💪</div>
        <h2 className="text-3xl font-black mb-2">这一科完成啦，继续加油！</h2>
        <p className="text-lg opacity-90">每做对一科，就解锁一只萌可～把没过的也补上吧！</p>
        <div className="mt-5 space-y-2 text-left bg-white/20 rounded-2xl p-4">
          {result.subjects.map((subject) => (
            <div key={subject.subject} className="flex items-center justify-between">
              <span className="font-bold">{subject.subject}</span>
              <span>
                {subject.status === 'passed' || subject.status === 'already'
                  ? '✅ 已完成'
                  : `❌ ${subject.correct}/${subject.total} 再练一次`}
              </span>
            </div>
          ))}
        </div>
        {result.rewards && (
          <div className="mt-3 text-left bg-white/20 rounded-2xl p-4 space-y-1">
            <div>☀️ 阳光能量 +{result.rewards.sunlight}</div>
            <div>🧸 召唤 {result.rewards.mokos.join('、')}</div>
          </div>
        )}
        {(result.tickets ?? 0) > 0 && (
          <div className="mt-3 text-left bg-white/20 rounded-2xl p-4 space-y-1">
            <div>🎟️ 捕捉券 +{result.tickets}（去「萌可闯关」读故事、捉萌可吧！）</div>
          </div>
        )}
        <button
          onClick={onRetry}
          className="mt-6 px-8 py-3 rounded-full bg-white text-moko-rose font-black hover:scale-105 active:scale-95 transition"
        >
          继续练习没完成的科目
        </button>
        <div className="mt-3">
          <Link href="/home" className="text-sm font-bold text-white/90 underline">
            先回首页逛逛 ›
          </Link>
        </div>
      </ClayCard>
    </div>
  );
}

/** 提交后的三科报告、奖励与继续练习入口。 */
export function PracticeResult({
  result,
  onRetry,
}: {
  result: PracticeSubmitResult;
  onRetry: () => void;
}) {
  return result.completed ? (
    <CompletedResult result={result} />
  ) : (
    <PartialResult result={result} onRetry={onRetry} />
  );
}
