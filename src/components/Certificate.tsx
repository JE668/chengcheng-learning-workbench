'use client';

import { useEffect, useState } from 'react';
import { mokoChars } from '@/lib/moko';
import { MokoAvatar } from '@/components/MokoAvatar';

export type CertData = {
  childName: string;
  weekLabel: string;
  pointsWeek: number;
  fullDays: number;
  activeDays: number;
  resolvedCount: number;
  mokoCount: number;
  earnedBadges: { emoji: string; name: string }[];
  date: string;
};

type Theme = { key: string; name: string; border: string; bg: string; accent: string };
const THEMES: Theme[] = [
  { key: 'violet', name: '梦幻紫', border: 'border-moko-violet', bg: 'from-moko-cream to-white', accent: 'text-moko-violet' },
  { key: 'rose', name: '爱心粉', border: 'border-moko-rose', bg: 'from-pink-50 to-white', accent: 'text-moko-rose' },
  { key: 'blue', name: '勇气蓝', border: 'border-moko-blue', bg: 'from-sky-50 to-white', accent: 'text-moko-blue' },
  { key: 'gold', name: '星光金', border: 'border-moko-gold', bg: 'from-amber-50 to-white', accent: 'text-moko-gold' },
];

// 可选萌可：优先用有真实图片的（真实萌可图案），其余用 emoji 兜底
const CHOICES = ['heartping', 'keyping', 'gemsping', 'courageping', 'singping', 'auroraping', 'moonping', 'hopeping', 'sweetsping', 'lemei'];

const PREF_KEY = 'certPref';

type Pref = { mokoKey: string; theme: string };

export default function Certificate({
  data,
  editable = false,
  initialPref = null,
  persistUrl,
}: {
  data: CertData;
  editable?: boolean;
  initialPref?: Pref | null;
  persistUrl?: string;
}) {
  const [pref, setPref] = useState<Pref>(initialPref ?? { mokoKey: 'heartping', theme: 'violet' });

  useEffect(() => {
    // 服务端未提供初始值（如纯本地兜底）时，回退到 localStorage
    if (initialPref) return;
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPref(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [initialPref]);

  function save(next: Pref) {
    setPref(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    // 云端持久化：家长端打印也能读到孩子的选择
    if (persistUrl) {
      fetch(persistUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
    }
  }

  const theme = THEMES.find((t) => t.key === pref.theme) || THEMES[0];
  const moko = mokoChars[pref.mokoKey] || mokoChars.heartping;
  const lemei = mokoChars.lemei;

  return (
    <div>
      {editable && (
        <div className="no-print mb-6 rounded-3xl p-5 bg-white shadow-lg space-y-5">
          <div>
            <div className="font-bold text-moko-violet mb-2">🎨 选一只萌可站在你的奖状上</div>
            <div className="flex flex-wrap gap-2">
              {CHOICES.map((k) => {
                const mc = mokoChars[k];
                const active = pref.mokoKey === k;
                return (
                  <button
                    key={k}
                    onClick={() => save({ ...pref, mokoKey: k })}
                    className={`rounded-2xl p-2 border-2 transition flex flex-col items-center ${active ? 'border-moko-rose bg-moko-rose/10' : 'border-gray-200 hover:border-moko-pink'}`}
                  >
                    <MokoAvatar img={mc?.img} emoji={mc?.emoji ?? '✨'} name={mc?.name ?? ''} size={48} />
                    <div className="text-xs mt-1 text-gray-600 max-w-[60px] truncate">{mc?.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="font-bold text-moko-violet mb-2">🌈 选一个主题颜色</div>
            <div className="flex gap-2 flex-wrap">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => save({ ...pref, theme: t.key })}
                  className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition ${pref.theme === t.key ? 'border-moko-rose scale-105' : 'border-gray-200'} ${t.bg} ${t.accent}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">你的选择已保存到云端，爸爸妈妈打印的奖状也会用这个样式～</p>
        </div>
      )}

      <div
        id="print-cert"
        className={`rounded-3xl p-8 border-8 border-double ${theme.border} bg-gradient-to-br ${theme.bg} text-center shadow-2xl relative`}
      >
        {/* 真实萌可图案：孩子自选的萌可 + 乐美公主 */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <MokoAvatar img={moko.img} emoji={moko.emoji} name={moko.name} size={72} />
          <div className="text-5xl">🏆</div>
          <MokoAvatar img={lemei.img} emoji={lemei.emoji} name="乐美" size={72} />
        </div>
        <h2 className="text-2xl font-black text-moko-violet">学 习 之 星 奖 状</h2>
        <div className="text-sm text-gray-500 mb-6">Certificate of Achievement</div>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          亲爱的 <span className="font-black text-moko-rose text-xl">{data.childName}</span> 小朋友：
        </p>
        <p className="text-base text-gray-700 leading-relaxed mb-6 text-left mx-auto max-w-md">
          在 <span className="font-bold">{data.weekLabel}</span> 这一周里，你表现超棒！
          本周获得 <span className="font-black text-moko-rose">{data.pointsWeek}</span> 积分，
          全勤 <span className="font-black text-moko-blue">{data.fullDays}</span> 天，
          攻克了 <span className="font-black text-moko-purple">{data.resolvedCount}</span> 道错题，
          还收集了 <span className="font-black text-moko-cyan">{data.mokoCount}</span> 只萌可、点亮{' '}
          <span className="font-black text-moko-gold">{data.earnedBadges.length}</span> 枚徽章！
          你用努力换来了城堡的繁荣，{moko.name}为你骄傲！🌟
        </p>
        <div className="flex items-end justify-between mt-10 text-sm text-gray-600">
          <div className="text-left flex items-end gap-1">
            <MokoAvatar img={lemei.img} emoji={lemei.emoji} name="乐美" size={56} />
            <div className="border-t border-gray-400 pt-1 px-2">萌可导师：乐美公主</div>
          </div>
          <div className="text-right">
            <div className="border-t border-gray-400 pt-1 px-2">爸爸妈妈见证</div>
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-400">程程学习工作台 · 奇妙萌可主题 · 颁发日期 {data.date}</div>
      </div>
    </div>
  );
}
