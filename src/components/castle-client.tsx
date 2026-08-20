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
 * 传入 info 后展示「今日可收获数量 + friend 进度条 + 状态」；
 * 不传 info（兼容旧调用）则退化为裸按钮。
 */
export function HarvestBtn({ info }: { info?: HarvestInfo }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const hasFriends = (info?.friendTotal ?? 0) > 0;
  const canHarvest = (info?.harvestableStars ?? 0) > 0;

  async function harvest() {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/castle/harvest', { method: 'POST' });
      const j = await r.json();
      setMsg(j.message || '');
      router.refresh(); // 服务端重算 harvestableStars，按钮自动变为「明日可收」
    } catch {
      setMsg('网络错误');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {info && (
        <div className="rounded-2xl bg-moko-gold/10 border-2 border-moko-gold/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-moko-violet">⭐ 今日可收获</span>
            <span className="font-black text-moko-gold">{info.harvestableStars} 颗</span>
          </div>
          {hasFriends ? (
            <>
              <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-moko-gold to-moko-yellow"
                  style={{ width: `${Math.min(100, (info.friendHarvestedToday / info.friendTotal) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-gray-500 text-right">
                {canHarvest
                  ? `还有 ${info.friendTotal - info.friendHarvestedToday} 只萌可没收获～`
                  : '今天都收完啦，明天再来 🌙'}
                （${info.friendHarvestedToday}/${info.friendTotal} 只已收）
              </div>
            </>
          ) : (
            <div className="mt-1 text-[11px] text-gray-500">成为好朋友的萌可才能每天产星星币哦～</div>
          )}
        </div>
      )}
      <div className="inline-flex flex-col items-start gap-1">
        <button onClick={harvest} disabled={busy || (hasFriends && !canHarvest)} className="btn btn-gold">
          {busy ? '收获中…' : canHarvest ? `⭐ 收获 ${info?.harvestableStars} 颗` : '⭐ 收获星星币'}
        </button>
        {msg && <span className="text-xs text-moko-violet font-semibold">{msg}</span>}
      </div>
    </div>
  );
}
