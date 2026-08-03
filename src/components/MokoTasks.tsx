'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';

interface MokoTasksDef {
  key: string;
  emoji: string;
  name: string;
  want: string;
  href: string;
  doneLine: string;
}

const TASKS: MokoTasksDef[] = [
  { key: 'apple', emoji: '🍎', name: '苹果萌可', want: '想吃 3 个苹果！去「古诗诵读」读一首诗喂饱我～', href: '/study/chinese/poems', doneLine: '咕噜～苹果好甜，谢谢你程程！' },
  { key: 'book', emoji: '📚', name: '书本萌可', want: '想听好故事！去「连词成句」造几句话吧～', href: '/study/chinese/sentence', doneLine: '你说的话真通顺，我学会啦！' },
  { key: 'num', emoji: '🔢', name: '数字萌可', want: '数字宝宝走丢啦！去玩一会儿「计算挑战」帮它们回家～', href: '/games/math-challenge', doneLine: '呼～数字都回家了，你真厉害！' },
  { key: 'tree', emoji: '🌳', name: '乘法萌可', want: '口诀树要浇水！去背几句「乘法口诀」吧～', href: '/study/math/mult-table', doneLine: '咕咚～口诀树发芽啦！' },
];

export default function MokoTasks() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/child-tasks')
      .then((r) => r.json())
      .then((res: { done?: Record<string, boolean> }) => {
        if (res.done) setDone(res.done);
      })
      .catch(() => {
        /* 断网时保留本地内存状态，不影响交互 */
      });
  }, []);

  function markDone(t: MokoTasksDef) {
    const next = { ...done, [t.key]: true };
    setDone(next);
    setCelebrate(t.key);
    speakZh(t.doneLine, 0.9);
    setTimeout(() => setCelebrate(null), 1500);
    fetch('/api/child-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: t.key, done: true }),
    }).catch(() => {
      /* 断网静默，下次进入会拉取最新 */
    });
  }

  return (
    <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-gold/20">
      <h3 className="text-lg font-black text-moko-violet mb-1">🪄 萌可的小任务</h3>
      <p className="text-sm text-gray-600 mb-3">萌可们有点小愿望，完成对应的学习任务，它们就会开心地和你道谢！</p>
      <div className="space-y-3">
        {TASKS.map((t) => {
          const isDone = !!done[t.key];
          const isCelebrate = celebrate === t.key;
          return (
            <div
              key={t.key}
              className={`rounded-2xl p-3 border-2 flex items-center gap-3 ${
                isDone ? 'border-green-300 bg-green-50' : 'border-moko-gold/30 bg-moko-gold/5'
              } ${isCelebrate ? 'animate-bounce' : ''}`}
            >
              <span className="text-4xl">{t.emoji}</span>
              <div className="flex-1">
                <div className="font-black text-moko-violet text-sm">{t.name}</div>
                <div className="text-xs text-gray-600">{t.want}</div>
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
                    className="px-3 py-1.5 rounded-full bg-moko-gold text-white font-bold text-xs active:scale-95 transition whitespace-nowrap"
                  >
                    完成啦 ✓
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
