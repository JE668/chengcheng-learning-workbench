'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { storyChapters } from '@/lib/story';
import { mokoImgByName } from '@/lib/moko-imgs';
import { playTtsEnd } from '@/lib/speak';

interface Progress {
  captured: string[];
  read: string[];
  nextIndex: number;
  total: number;
  allDone: boolean;
  tickets: number;
}

export default function StoryPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [active, setActive] = useState<string | null>(null); // 正在展开阅读章节
  const [narrating, setNarrating] = useState<string | null>(null); // 正在自动朗读的章节
  const [readPara, setReadPara] = useState(-1); // 当前朗读到第几段（-1=未朗读，paragraphs.length=正在读 tip）
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState('');
  const abortRef = useRef(false);

  async function load() {
    const r = await fetch('/api/story/progress');
    const j = await r.json();
    setProgress(j);
    setReadSet(new Set(j.read || []));
  }

  useEffect(() => { load(); }, []);

  /** 标记某集已读完（捕捉前必须先读） */
  async function markRead(chapterId: string) {
    try {
      await fetch('/api/story/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
    } catch { /* 离线也先本地标记，保证体验流畅 */ }
    setReadSet((s) => new Set(s).add(chapterId));
  }

  /** 顺序朗读整集：一段一段读，读完标记已读并解锁捕捉 */
  async function startNarration(c: (typeof storyChapters)[number]) {
    if (narrating) stopNarration();
    setNarrating(c.id);
    setReadPara(0);
    abortRef.current = false;
    for (let k = 0; k < c.paragraphs.length; k++) {
      if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
      setReadPara(k);
      await playTtsEnd(c.paragraphs[k], 'zh', { wsRate: 0.7, pauseMs: 140 });
    }
    if (c.tip) {
      if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
      setReadPara(c.paragraphs.length);
      await playTtsEnd(c.tip, 'zh', { wsRate: 0.7, pauseMs: 140 });
    }
    if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
    setNarrating(null);
    setReadPara(-1);
    await markRead(c.id);
  }

  /** 停止朗读 */
  function stopNarration() {
    abortRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setNarrating(null);
    setReadPara(-1);
  }

  function toggleOpen(c: (typeof storyChapters)[number]) {
    if (active === c.id) {
      stopNarration();
      setActive(null);
    } else {
      setActive(c.id);
      // 还没读过这集 → 打开就自动朗读（满足「打开阅读故事 + 自动语音」）
      if (!readSet.has(c.id)) startNarration(c);
    }
  }

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
        stopNarration();
        await load();
      } else if (j.code === 'not_read') {
        setToast(j.error || '先读完故事再捕捉哦～');
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
          const isRead = readSet.has(c.id);
          const isNext = i === progress.nextIndex;
          const isLocked = i > progress.nextIndex;
          const img = mokoImgByName[c.mokoName];
          const open = active === c.id;
          const isNarrating = narrating === c.id;

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
                {!isCaptured && isRead && <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">📖 已读</span>}
              </div>

              {open && (
                <div className="mt-4 bg-white/95 text-gray-700 rounded-2xl p-4">
                  {isNarrating && (
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moko-violet/10 text-moko-violet font-bold px-3 py-1 text-sm">
                      🔊 正在读故事…
                    </div>
                  )}
                  {!isNarrating && isRead && (
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moko-gold/15 text-moko-gold font-bold px-3 py-1 text-sm">
                      ✅ 故事读完啦，可以捕捉咯！
                    </div>
                  )}
                  {c.paragraphs.map((p, k) => (
                    <p
                      key={k}
                      className={`mb-2 leading-relaxed transition ${isNarrating && readPara === k ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2 font-bold text-moko-violet' : ''}`}
                    >
                      {p}
                    </p>
                  ))}
                  {c.tip && (
                    <p
                      className={`text-sm text-moko-violet font-semibold mt-2 transition ${isNarrating && readPara === c.paragraphs.length ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2' : ''}`}
                    >
                      💡 {c.tip}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  onClick={() => toggleOpen(c)}
                  className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
                >
                  {open ? '收起故事' : isRead ? '📖 再读一遍' : '📖 读这一集'}
                </button>

                {/* 已展开且已读：提供「再听一遍」 */}
                {open && isRead && !isNarrating && (
                  <button
                    onClick={() => startNarration(c)}
                    className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
                  >
                    🔊 再听一遍
                  </button>
                )}

                {/* —— 捕捉门槛：必须先读完故事 —— */}
                {isNext && !isCaptured && !isRead && (
                  <button
                    disabled
                    className="px-5 py-2 rounded-full bg-white/40 text-white/80 font-black cursor-not-allowed"
                  >
                    {isNarrating ? '🎧 正在读故事…' : '🔒 先听故事'}
                  </button>
                )}
                {isNext && !isCaptured && !isRead && !isNarrating && (
                  <p className="text-xs text-white/90 w-full mt-1">
                    {i === 0 ? '点「读这一集」，听完故事就能捕捉萌可～' : '先读完故事，并用捕捉券解锁这一集哦～'}
                  </p>
                )}

                {/* 已读但缺券（非首集）：去赚券 */}
                {isNext && !isCaptured && isRead && i > 0 && progress.tickets === 0 && (
                  <Link href="/daily-practice" className="px-5 py-2 rounded-full bg-white/90 text-moko-violet font-black shadow hover:scale-105 transition">
                    🎯 去赚捕捉券
                  </Link>
                )}

                {/* 已读且有资格：直接捕捉 */}
                {isNext && !isCaptured && isRead && (i === 0 || progress.tickets > 0) && (
                  <button
                    onClick={() => capture(c.id)}
                    disabled={capturing}
                    className="px-5 py-2 rounded-full bg-white text-moko-violet font-black shadow hover:scale-105 transition disabled:opacity-60"
                  >
                    {capturing ? '捕捉中…' : `✨ 捕捉${c.mokoName}！`}
                  </button>
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
