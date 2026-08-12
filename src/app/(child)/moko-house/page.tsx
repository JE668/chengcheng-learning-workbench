'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { storyChapters } from '@/lib/story';
import { mokoCollection } from '@/lib/moko-collection';
import { speakZh } from '@/lib/speak';
import MokoTasks from '@/components/MokoTasks';

const COLLECTION_MAP = new Map(mokoCollection.map((m) => [m.key, m]));

type Theme = { key: string; label: string; bg: string; floor: string };
const THEMES: Theme[] = [
  { key: 'day', label: '☀️ 白天', bg: 'from-sky-100 to-rose-100', floor: 'bg-amber-200' },
  { key: 'night', label: '🌙 夜晚', bg: 'from-indigo-200 to-purple-200', floor: 'bg-indigo-300' },
  { key: 'festival', label: '🎉 节日', bg: 'from-pink-200 to-yellow-200', floor: 'bg-rose-300' },
];

export default function MokoHousePage() {
  const [captured, setCaptured] = useState<string[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [total, setTotal] = useState(storyChapters.length);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/story/progress')
      .then((r) => r.json())
      .then((d) => {
        setCaptured(d.captured ?? []);
        setNextIndex(d.nextIndex ?? 0);
        setTotal(d.total ?? storyChapters.length);
      })
      .catch(() => setCaptured([]))
      .finally(() => setLoading(false));
  }, []);

  // 已捕捉的萌可详情
  const owned = useMemo(() => {
    const byChapter = new Map(storyChapters.map((c) => [c.id, c]));
    return captured
      .map((id) => byChapter.get(id)?.mokoKey)
      .filter((k): k is string => !!k)
      .map((k) => COLLECTION_MAP.get(k))
      .filter((m): m is NonNullable<typeof m> => !!m);
  }, [captured]);

  const tap = (key: string, line: string) => {
    setBouncing(key);
    if (line) speakZh(line, 0.85);
    setTimeout(() => setBouncing((b) => (b === key ? null : b)), 900);
  };

  const nextMoko = nextIndex < storyChapters.length ? storyChapters[nextIndex] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-moko-violet font-black no-underline">‹ 返回首页</Link>
      <div className="flex items-center justify-between mt-2 mb-1">
        <h1 className="page-title">萌可小屋 🏠</h1>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-black shadow transition ${
                theme.key === t.key ? 'bg-moko-violet text-white' : 'bg-white text-moko-violet'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-600 mb-4">
        点一点你收集到的萌可，它会跟你打招呼～ 已入住 {owned.length} / {total} 只。
      </p>

      <div className={`rounded-3xl p-6 shadow-xl border-2 border-white/50 bg-gradient-to-br ${theme.bg} min-h-[420px] flex flex-col`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-moko-violet font-black"><span className="moko-loader"><span></span><span></span><span></span></span>加载中…</div>
        ) : owned.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-3">🪺</div>
            <p className="text-moko-violet font-black">小屋还空空的～</p>
            <p className="text-gray-600 text-sm mt-1">去「萌可剧情」捕捉第一只萌可吧！</p>
            <Link href="/story" className="mt-4 rounded-2xl px-5 py-2 bg-moko-violet text-white font-black shadow hover:scale-105 transition">去捕捉 ›</Link>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 content-start">
            {owned.map((m) => (
              <button
                key={m.key}
                onClick={() => tap(m.key, m.line)}
                className={`flex flex-col items-center bg-white/70 rounded-2xl p-2 shadow hover:scale-105 transition ${bouncing === m.key ? 'animate-bounce' : ''}`}
              >
                {m.img ? (
                  <img src={m.img} alt={m.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span className="w-14 h-14 flex items-center justify-center text-4xl">{m.emoji}</span>
                )}
                <span className="text-xs font-bold text-moko-violet mt-1 text-center leading-tight">{m.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* 地板 */}
        <div className={`mt-6 rounded-b-2xl h-3 ${theme.floor} opacity-70`} />
      </div>

      {nextMoko && (
        <div className="mt-5 rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-gold/20 flex items-center gap-3">
          <span className="text-3xl">🔜</span>
          <div className="flex-1">
            <p className="text-sm text-gray-500">下一只等待捕捉的萌可：</p>
            <p className="text-moko-violet font-black">{nextMoko.emoji} {nextMoko.mokoName}</p>
          </div>
          <Link href="/story" className="rounded-2xl px-4 py-2 bg-moko-gold text-white font-black shadow hover:scale-105 transition text-sm">去剧情 ›</Link>
        </div>
      )}

      <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 小屋玩法</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-insince-inside">
          <li>点萌可会听到它说一句专属台词，集齐越多越热闹。</li>
          <li>右上角可以切换白天 / 夜晚 / 节日三种房间氛围。</li>
          <li>想入住更多萌可，就去「萌可剧情」连续捕捉吧！</li>
        </ul>
      </div>

      <MokoTasks />
    </div>
  );
}
