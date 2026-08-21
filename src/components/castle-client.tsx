'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Subject } from '@/lib/types';
import { MokoAvatar } from '@/components/MokoAvatar';
import { mokoChars, subjectMokoKey } from '@/lib/moko';

const SUBJECTS: { key: Subject; label: string; grad: string }[] = [
  { key: '语文', label: '语文', grad: 'from-moko-pink to-moko-rose' },
  { key: '数学', label: '数学', grad: 'from-moko-blue to-sky-400' },
  { key: '英语', label: '英语', grad: 'from-moko-yellow to-amber-300' },
];

/**
 * 今日三科打卡面板（孩子端）。
 * 打卡由「每日一练」全对后自动完成（写 confirmed），不再由孩子手动逐科提交。
 * 这里只展示三科真实状态，并在未完成时引导去做今日一练，避免「已提交却点不动」的困惑。
 * 每科用「对应的萌可」头像（爱心/正正/唱唱），状态胶囊底部对齐、不溢出。
 */
export function CheckinPanel({ initial }: { initial: Record<Subject, string> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SUBJECTS.map((s) => {
        const st = initial[s.key];
        const done = st !== 'pending';
        const m = mokoChars[subjectMokoKey[s.key]];
        return (
          <div key={s.key} className={`flex flex-col items-center rounded-3xl p-4 bg-gradient-to-br ${s.grad} text-white shadow-lg`}>
            <MokoAvatar
              img={m?.img}
              emoji={m?.emoji ?? '🧸'}
              name={m?.name ?? s.label}
              size={64}
              className="rounded-2xl mb-2"
            />
            <div className="font-black text-lg leading-tight">{s.label}</div>
            <div className="text-xs opacity-90 mb-3">{m?.name ?? ''}</div>
            <div
              className={`w-full mt-auto py-1.5 rounded-xl font-bold text-sm text-center whitespace-nowrap ${
                done ? 'bg-white/30' : 'bg-white text-moko-rose'
              }`}
            >
              {done ? '已完成 🌟' : '待完成'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HarvestInfo {
  harvestableStars: number;
  friendTotal: number;
  friendHarvestedToday: number;
}

/**
 * 一键收获星星币。
 * 展示「今日可收获数量 + 萌可好友进度条 + 状态」。
 * 始终显示进度条（0 好友时显示 0% 空状态，让用户知道需要先培养好友）。
 */
export function HarvestBtn({ info }: { info?: HarvestInfo }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const friendTotal = info?.friendTotal ?? 0;
  const friendHarvestedToday = info?.friendHarvestedToday ?? 0;
  const harvestableStars = info?.harvestableStars ?? 0;
  const hasFriends = friendTotal > 0;
  const canHarvest = harvestableStars > 0;
  // 收获进度 = 已收萌可数 / 好友总数（满 100% 时今日已收完）
  const harvestProgress = friendTotal > 0 ? Math.min(100, (friendHarvestedToday / friendTotal) * 100) : 0;
  // 可收获的萌可数 = 好友总数 - 已收数
  const unharvestedCount = friendTotal - friendHarvestedToday;

  async function harvest() {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/castle/harvest', { method: 'POST' });
      const j = await r.json();
      setMsg(j.message || '');
      router.refresh();
    } catch {
      setMsg('网络错误');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl bg-white/80 border-2 border-moko-gold/40 p-3 shadow-sm">
        {/* 可收获数量 */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-moko-violet text-sm">⭐ 星星币收获</span>
          <span className="font-black text-moko-gold text-lg">{harvestableStars} 颗</span>
        </div>

        {/* 进度条：萌可好友收获进度 */}
        <div className="relative">
          <div className="h-3 rounded-full bg-amber-100 overflow-hidden border border-amber-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-moko-gold to-amber-400 transition-all duration-500"
              style={{ width: harvestProgress + '%' }}
            />
          </div>
          <span className="absolute -right-1 -top-4 text-[10px] font-bold text-amber-600">
            {Math.round(harvestProgress)}%
          </span>
        </div>

        {/* 状态说明 */}
        <div className="mt-2 text-xs text-gray-500">
          {hasFriends ? (
            canHarvest ? (
              <span className="text-amber-700 font-semibold">
                {'🎯 ' + unharvestedCount + ' 只萌可好友可以收获，共 ' + harvestableStars + ' 颗星星币！'}
              </span>
            ) : (
              <span>
                {'🌙 今天已全部收完（' + friendHarvestedToday + '/' + friendTotal + ' 只），明天再来～'}
              </span>
            )
          ) : (
            <span>💡 还没有萌可好友，快去培养萌可成为「好朋友」阶段吧！</span>
          )}
        </div>
      </div>

      <div className="inline-flex flex-col items-start gap-1">
        <button
          onClick={harvest}
          disabled={busy || (hasFriends && !canHarvest)}
          className={'btn font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all ' + (canHarvest ? 'bg-gradient-to-r from-moko-gold to-amber-400 text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-default')}
        >
          {busy ? '⏳ 收获中…' : canHarvest ? ('⭐ 收获 ' + harvestableStars + ' 颗星星币') : '⭐ 收获星星币'}
        </button>
        {msg && <span className="text-xs text-moko-violet font-semibold">{msg}</span>}
      </div>
    </div>
  );
}
