'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';
import { MOKO_TASKS, type MokoTaskDef } from '@/lib/moko-tasks';

export default function MokoTasks() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/child-tasks')
      .then((r) => r.json())
      .then((res: { done?: Record<string, boolean>; unlocked?: Record<string, boolean> }) => {
        if (res.done) setDone(res.done);
        if (res.unlocked) setUnlocked(res.unlocked);
      })
      .catch(() => {
        /* 断网时保留本地内存状态，不影响交互 */
      });
  }, []);

  async function markDone(t: MokoTaskDef) {
    if (!unlocked[t.key]) {
      setToast(t.lockHint);
      setTimeout(() => setToast(null), 2600);
      return;
    }
    setDone((prev) => ({ ...prev, [t.key]: true }));
    setCelebrate(t.key);
    speakZh(t.doneLine, 0.9);
    setTimeout(() => setCelebrate(null), 1500);
    try {
      const r = await fetch('/api/child-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: t.key, done: true }),
      });
      if (!r.ok) {
        // 服务端判定未达成 → 回滚乐观更新
        const j = await r.json().catch(() => ({}));
        setDone((prev) => ({ ...prev, [t.key]: false }));
        setToast(j.error || t.lockHint);
        setTimeout(() => setToast(null), 2600);
      }
    } catch {
      /* 断网静默，下次进入会拉取最新 */
    }
  }

  return (
    <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-gold/20">
      <h3 className="text-lg font-black text-moko-violet mb-1">🪄 萌可的小任务</h3>
      <p className="text-sm text-gray-600 mb-3">
        萌可们有点小愿望，先把对应的学习练到 ⭐，再回来点「完成啦」，它们就会开心地和你道谢！
      </p>
      {toast && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-2">
          🔒 {toast}
        </div>
      )}
      <div className="space-y-3">
        {MOKO_TASKS.map((t) => {
          const isDone = !!done[t.key];
          const isUnlocked = !!unlocked[t.key];
          const isCelebrate = celebrate === t.key;
          return (
            <div
              key={t.key}
              className={`rounded-2xl p-3 border-2 flex items-center gap-3 ${
                isDone ? 'border-green-300 bg-green-50' : 'border-moko-gold/30 bg-moko-gold/5'
              } ${isCelebrate ? 'animate-bounce' : ''}`}
            >
              <span className="text-4xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-moko-violet text-sm">{t.name}</div>
                <div className="text-xs text-gray-600">{t.want}</div>
                {!isDone && !isUnlocked && (
                  <div className="text-[11px] text-amber-600 font-bold mt-0.5">🔒 {t.lockHint}</div>
                )}
              </div>
              {isDone ? (
                <span className="text-green-600 font-black text-sm whitespace-nowrap">✅ 已完成</span>
              ) : (
                <>
                  <Link
                    href={t.href}
                    className="px-3 py-1.5 rounded-full bg-moko-violet text-white font-bold text-xs active:scale-95 transition whitespace-nowrap"
                  >
                    去完成 ›
                  </Link>
                  <button
                    onClick={() => markDone(t)}
                    disabled={!isUnlocked}
                    title={isUnlocked ? '' : t.lockHint}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs transition whitespace-nowrap ${
                      isUnlocked
                        ? 'bg-moko-gold text-white active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isUnlocked ? '完成啦 ✓' : '未解锁 🔒'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
