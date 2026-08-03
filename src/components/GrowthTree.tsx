'use client';

import { useEffect, useState } from 'react';

const SUBJ_META: Record<string, { label: string; color: string; text: string; emoji: string }> = {
  chinese: { label: '语文', color: 'bg-moko-pink', text: 'text-moko-rose', emoji: '❤️' },
  math: { label: '数学', color: 'bg-moko-blue', text: 'text-moko-blue', emoji: '🔢' },
  english: { label: '英语', color: 'bg-moko-yellow', text: 'text-moko-yellow', emoji: '🔤' },
};

interface P {
  stars: number;
  rounds: number;
  lastPlayed: number;
}

export default function GrowthTree() {
  const [data, setData] = useState<Record<string, P>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const m: Record<string, P> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cc:progress:v1:')) {
        const parts = k.split(':');
        const subject = parts[3];
        const moduleKey = parts.slice(4).join(':');
        try {
          const v = JSON.parse(localStorage.getItem(k) || '{}');
          m[`${subject}:${moduleKey}`] = { stars: v.stars || 0, rounds: v.rounds || 0, lastPlayed: v.lastPlayed || 0 };
        } catch {
          /* ignore */
        }
      }
    }
    setData(m);
    setLoaded(true);
  }, []);

  const subjects = ['chinese', 'math', 'english'];
  // 动态读取 STUDY_MODULES，避免 SSR 阶段访问 window
  const [summary, setSummary] = useState({
    per: [] as { s: string; total: number; mastered: number; got: number; count: number; mods: { key: string; label: string; emoji: string }[] }[],
    totalStars: 0,
    totalMastered: 0,
    week: 0,
    strongest: '' as string,
  });

  useEffect(() => {
    let active = true;
    import('@/lib/study-modules').then(({ STUDY_MODULES }) => {
      if (!active) return;
      const perCalc = subjects.map((s) => {
        const mods = STUDY_MODULES[s] || [];
        let total = 0;
        let mastered = 0;
        let got = 0;
        mods.forEach((md: any) => {
          const p = data[`${s}:${md.key}`];
          if (p) {
            total += p.stars;
            if (p.stars >= 3) mastered += 1;
            if (p.stars > 0) got += 1;
          }
        });
        return { s, total, mastered, got, count: mods.length, mods: mods.map((md: any) => ({ key: md.key, label: md.label, emoji: md.emoji })) };
      });
      const totalStars = perCalc.reduce((a, b) => a + b.total, 0);
      const totalMastered = perCalc.reduce((a, b) => a + b.mastered, 0);
      const week = Object.values(data).filter((p) => p.lastPlayed && Date.now() - p.lastPlayed < 7 * 864e5).length;
      const strongest = perCalc.slice().sort((a, b) => b.total - a.total)[0]?.s || '';
      setSummary({ per: perCalc, totalStars, totalMastered, week, strongest });
    });
    return () => {
      active = false;
    };
  }, [data]);

  if (!loaded) {
    return <div className="card-moko text-center text-gray-500 py-6">正在长出成长树…</div>;
  }

  return (
    <div>
      {/* 统计条 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="card-moko text-center">
          <div className="text-3xl font-black text-moko-gold">🌟 {summary.totalStars}</div>
          <div className="text-gray-500 text-sm">收集星星</div>
        </div>
        <div className="card-moko text-center">
          <div className="text-3xl font-black text-moko-rose">🏅 {summary.totalMastered}</div>
          <div className="text-gray-500 text-sm">满星模块</div>
        </div>
        <div className="card-moko text-center">
          <div className="text-3xl font-black text-moko-blue">🌱 {summary.week}</div>
          <div className="text-gray-500 text-sm">本周在学</div>
        </div>
        <div className="card-moko text-center">
          <div className="text-3xl font-black text-moko-violet">
            {summary.strongest ? SUBJ_META[summary.strongest]?.emoji : '—'}
          </div>
          <div className="text-gray-500 text-sm">最强学科</div>
        </div>
      </div>

      {/* 成长树 */}
      <div className="rounded-3xl p-5 bg-gradient-to-b from-sky-50 to-green-50 border-2 border-green-200 shadow">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🌳</span>
          <h3 className="text-lg font-black text-green-700">程程的成长树</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {summary.per.map((subj) => {
            const meta = SUBJ_META[subj.s];
            return (
              <div key={subj.s} className="flex flex-col items-center">
                {/* 树冠 */}
                <div className={`w-20 h-20 rounded-full ${meta.color} flex items-center justify-center text-3xl shadow-lg border-4 border-white`}>
                  {meta.emoji}
                </div>
                <div className={`mt-1 font-black ${meta.text}`}>{meta.label}</div>
                <div className="text-xs text-gray-500 mb-2">{subj.got}/{subj.count} 个模块 · {subj.total}★</div>
                {/* 叶子 */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {subj.mods.map((md) => {
                    const stars = data[`${subj.s}:${md.key}`]?.stars || 0;
                    const on = stars > 0;
                    return (
                      <span
                        key={md.key}
                        title={`${md.label} · ${stars}★`}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                          on ? `${meta.color} text-white` : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {md.emoji} {'★'.repeat(stars) || '☆'}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {/* 树干 + 地面 */}
        <div className="flex justify-center mt-3">
          <div className="w-8 h-10 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-xl" />
        </div>
        <div className="h-2 bg-green-300 rounded-full opacity-70 mt-1" />
        <p className="text-center text-xs text-gray-500 mt-2">每认真玩一个模块，树上就会多一片发光的叶子；集满三颗星，叶子就熟透啦！</p>
      </div>
    </div>
  );
}
