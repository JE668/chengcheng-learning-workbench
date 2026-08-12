'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getActivity, type ActivityKey } from '@/lib/activity';

type Tier = 0 | 1 | 2 | 3; // 0 未获得，1 铜，2 银，3 金
interface BadgeDef {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  tiers: [number, number, number]; // 铜/银/金 阈值
  value: number; // 当前值
}

const TIER_META = [
  { icon: '🔒', label: '未获得', cls: 'bg-gray-100 text-gray-400' },
  { icon: '🥉', label: '铜牌', cls: 'bg-amber-100 text-amber-700' },
  { icon: '🥈', label: '银牌', cls: 'bg-slate-200 text-slate-700' },
  { icon: '🥇', label: '金牌', cls: 'bg-yellow-200 text-yellow-700' },
];

function tierFor(value: number, t: [number, number, number]): Tier {
  if (value >= t[2]) return 3;
  if (value >= t[1]) return 2;
  if (value >= t[0]) return 1;
  return 0;
}

export default function BadgesPage() {
  const [captured, setCaptured] = useState(0);
  const [streak, setStreak] = useState(0);
  const [act, setAct] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/story/progress').then((r) => r.json()).catch(() => ({})),
      fetch('/api/daily-practice').then((r) => r.json()).catch(() => ({})),
    ]).then(([s, d]) => {
      if (!alive) return;
      setCaptured(Array.isArray(s.captured) ? s.captured.length : 0);
      setStreak(typeof d.practiceStreak === 'number' ? d.practiceStreak : 0);
      setAct(getActivity());
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const charAct = (act.trace ?? 0) + (act.picto ?? 0);

  const badges: BadgeDef[] = useMemo(
    () => [
      { key: 'collector', name: '萌可收藏家', emoji: '🧸', desc: '收集到的萌可数量', tiers: [10, 50, 150], value: captured },
      { key: 'streak', name: '坚持打卡', emoji: '📅', desc: '连续完成每日一练天数', tiers: [3, 14, 30], value: streak },
      { key: 'pinyin', name: '拼音小将', emoji: '🀄', desc: '玩拼读乐园次数', tiers: [5, 15, 30], value: act.pinyin ?? 0 },
      { key: 'char', name: '识字小能手', emoji: '✍️', desc: '描红 + 象形字练习次数', tiers: [3, 10, 25], value: charAct },
      { key: 'poem', name: '小诗人', emoji: '📜', desc: '古诗填空练习次数', tiers: [2, 6, 12], value: act.poem ?? 0 },
      { key: 'math', name: '数学小星', emoji: '🔢', desc: '数学练习次数', tiers: [5, 15, 30], value: (act.math ?? 0) + (act.quiz ?? 0) },
      { key: 'talk', name: '表达小明星', emoji: '🗣️', desc: '看图说话练习次数', tiers: [2, 5, 10], value: act.talk ?? 0 },
    ],
    [captured, streak, act, charAct],
  );

  const earned = badges.filter((b) => tierFor(b.value, b.tiers) > 0).length;

  return (
    <div className="max-w-4xl mx-auto fade-up">
      <Link href="/" className="text-moko-violet font-black no-underline">‹ 返回首页</Link>
      <h1 className="page-title mt-2 mb-1">我的勋章墙 🏆</h1>
      <p className="text-gray-600 mb-4">
        每多学一点就能解锁一枚勋章，已经拿到 {earned} / {badges.length} 枚啦！
      </p>

      {loading ? (
        <div className="rounded-3xl p-10 bg-white shadow flex flex-col items-center justify-center gap-3 text-moko-violet font-black"><span className="moko-loader"><span></span><span></span><span></span></span>加载中…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((b) => {
            const tier = tierFor(b.value, b.tiers);
            const meta = TIER_META[tier];
            const nextTh = b.tiers[Math.min(tier, 2)] ?? b.tiers[2];
            const remain = tier < 3 ? Math.max(0, nextTh - b.value) : 0;
            return (
              <div key={b.key} className={`rounded-3xl p-5 shadow-lg border-2 ${meta.cls} flex flex-col items-center text-center`}>
                <div className="text-5xl mb-2">{tier === 0 ? '🔒' : b.emoji}</div>
                <div className="text-2xl">{meta.icon}</div>
                <h3 className="text-lg font-black text-moko-violet mt-1">{b.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
                <div className="mt-2 text-sm font-bold text-moko-violet">{b.value} / {b.tiers[2]}</div>
                {tier === 0 && (
                  <p className="text-xs text-gray-400 mt-1">再 {remain} 个解锁铜牌</p>
                )}
                {tier > 0 && tier < 3 && (
                  <p className="text-xs text-gray-400 mt-1">再 {remain} 个升 {TIER_META[tier + 1].label}</p>
                )}
                {tier === 3 && <p className="text-xs text-moko-gold font-bold mt-1">已满级 🌟</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 怎么得更多勋章</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>「萌可收藏家」去萌可剧情多捕捉萌可。</li>
          <li>「坚持打卡」每天做一遍每日一练，别断签。</li>
          <li>其余勋章多玩对应的小游戏就会慢慢亮起来。</li>
        </ul>
      </div>
    </div>
  );
}
