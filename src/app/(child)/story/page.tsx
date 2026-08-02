'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { storyChapters } from '@/lib/story';
import { mokoImgByName } from '@/lib/moko-imgs';

interface Progress {
  captured: string[];
  nextIndex: number;
  total: number;
  allDone: boolean;
  tickets: number;
}

export default function StoryPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [active, setActive] = useState<string | null>(null); // 正在阅读的章节
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState('');

  async function load() {
    const r = await fetch('/api/story/progress');
    const j = await r.json();
    setProgress(j);
  }

  useEffect(() => { load(); }, []);

  async function capture(chapterId: string) {
    setCapturing(true);
    setToast('');
    try {
      const r = await fetch('/api/story/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
      const j = await r.json();
      if (j.ok) {
        setToast(`🎉 捕捉到${j.mokoName}啦！去看看图鉴吧～`);
        setActive(null);
        await load();
      } else {
        setToast(j.error || '捕捉失败，再试一次');
      }
    } catch {
      setToast('网络好像走神了，再试一次吧');
    } finally {
      setCapturing(false);
    }
  }

  if (!progress) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-gray-400">故事加载中…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/games" className="text-moko-violet font-bold hover:underline">‹ 游戏乐园</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-violet mb-2">📜 萌可剧情</h1>
      <p className="text-gray-600 mb-2">
        跟着乐美公主的领航故事，一集一集认识并捕捉萌可。已捕捉
        <span className="font-black text-moko-rose"> {progress.captured.length} </span>/ {progress.total} 只。
      </p>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-moko-gold/15 text-moko-gold font-black px-3 py-1 text-sm">🎟️ 捕捉券 ×{progress.tickets}</span>
        {progress.tickets === 0 && (
          <span className="text-xs text-gray-500">做「萌可闯关」练习可攒捕捉券，用来解锁下一集</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all" style={{ width: `${(progress.captured.length / progress.total) * 100}%` }} />
      </div>

      {toast && (
        <div className="mb-5 rounded-2xl p-3 text-center font-bold bg-moko-rose/10 text-moko-rose border-2 border-moko-rose/20">{toast}</div>
      )}

      <div className="space-y-5">
        {storyChapters.map((c, i) => {
          const isCaptured = progress.captured.includes(c.id);
          const isNext = i === progress.nextIndex;
          const isLocked = i > progress.nextIndex;
          const img = mokoImgByName[c.mokoName];
          const open = active === c.id;

          if (isLocked) {
            return (
              <div key={c.id} className="rounded-3xl p-5 shadow-lg border-2 border-gray-200 bg-gray-100 opacity-80 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-300 flex items-center justify-center text-2xl">🔒</div>
                <div>
                  <div className="font-black text-gray-500">第 {i + 1} 集 · {c.title}</div>
                  <div className="text-xs text-gray-400">先捕捉上一集的萌可，就能解锁这一集～</div>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} className={`rounded-3xl p-5 shadow-xl border-2 bg-gradient-to-br ${c.gradient} text-white`}>
              <div className="flex items-center gap-4">
                {img ? (
                  <img src={img} alt={c.mokoName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/30 flex items-center justify-center text-3xl">{c.emoji}</div>
                )}
                <div className="flex-1">
                  <div className="font-black text-lg">第 {i + 1} 集 · {c.title}</div>
                  <div className="text-sm opacity-90">{c.scene} · 主角 {c.mokoName}</div>
                </div>
                {isCaptured && <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">✅ 已捕捉</span>}
              </div>

              {open && (
                <div className="mt-4 bg-white/95 text-gray-700 rounded-2xl p-4">
                  {c.paragraphs.map((p, k) => (
                    <p key={k} className="mb-2 leading-relaxed">{p}</p>
                  ))}
                  {c.tip && <p className="text-sm text-moko-violet font-semibold mt-2">💡 {c.tip}</p>}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setActive(open ? null : c.id)}
                  className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
                >
                  {open ? '收起故事' : '📖 读这一集'}
                </button>
                {isNext && !isCaptured && (() => {
                  const canCapture = progress.tickets > 0 || i === 0;
                  if (canCapture) {
                    return (
                      <button
                        onClick={() => capture(c.id)}
                        disabled={capturing}
                        className="px-5 py-2 rounded-full bg-white text-moko-violet font-black shadow hover:scale-105 transition disabled:opacity-60"
                      >
                        {capturing ? '捕捉中…' : `✨ 捕捉${c.mokoName}！`}
                      </button>
                    );
                  }
                  return (
                    <Link href="/daily-practice" className="px-5 py-2 rounded-full bg-white/90 text-moko-violet font-black shadow hover:scale-105 transition">
                      🎯 去赚捕捉券
                    </Link>
                  );
                })()}
                {isNext && !isCaptured && progress.tickets === 0 && i > 0 && (
                  <p className="text-xs text-white/90 w-full mt-1">需要「捕捉券」才能解锁，先去萌可闯关做练习吧～</p>
                )}
                {isCaptured && (
                  <Link href="/castle" className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition">
                    去城堡看看 ›
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progress.allDone && (
        <div className="mt-8 rounded-3xl p-6 text-center bg-gradient-to-r from-moko-gold to-moko-yellow text-white shadow-xl">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-black">哇，你捕捉了全部萌可！</div>
          <div className="text-sm opacity-90 mt-1">打开图鉴，看看谁在城堡里等你回家～</div>
          <Link href="/castle" className="inline-block mt-3 px-6 py-2 rounded-full bg-white text-moko-violet font-black shadow">🏰 进入城堡</Link>
        </div>
      )}
    </div>
  );
}
