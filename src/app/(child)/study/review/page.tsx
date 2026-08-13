'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MistakeRow {
  id: number;
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string | null;
  /** 来源学习模块 key（如 proverbs），用于「去练习」跳转 */
  source_module: string | null;
  interval_days: number;
  reps: number;
}

const subjectEmoji: Record<string, string> = {
  语文: '💗',
  数学: '🔵',
  英语: '💛',
};

const subjectKey: Record<string, string> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
};

export default function ReviewPage() {
  const [items, setItems] = useState<MistakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(0);

  async function load() {
    const r = await fetch('/api/mistakes');
    const d = await r.json();
    setItems(d.due || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: number, correct: boolean) {
    await fetch('/api/mistakes/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, correct }),
    });
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (correct) setDone((n) => n + 1);
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="page-title mb-2">📝 我的复习本</h1>
      <p className="text-gray-600 mb-6">
        这里收集了之前做错的小题，按照「遗忘曲线」每天帮你复习，记牢就不会再错啦～
      </p>

      {loading ? (
        <div className="text-center text-gray-400 py-16 flex flex-col items-center justify-center gap-3"><span className="moko-loader"><span></span><span></span><span></span></span>加载中…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl p-10 bg-white shadow-lg border-2 border-moko-purple/20 text-center">
          <div className="text-6xl mb-3">🎉</div>
          <div className="text-xl font-black text-moko-violet">今天没有要复习的，真棒！</div>
          <p className="text-gray-500 mt-2">去学科里多学一点吧～</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">今日待复习 {items.length} 个 · 已复习 {done} 个</div>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-purple/15">
                <div className="flex items-center gap-2 mb-2">
                  <span>{subjectEmoji[it.subject] || '📘'}</span>
                  <span className="font-bold text-moko-violet">{it.subject}</span>
                  <span className="text-xs text-gray-400">· {it.kind}</span>
                </div>
                <div className="text-lg font-black text-gray-700">{it.prompt}</div>
                {revealed[it.id] ? (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-bold">正确答案：{it.answer}</span>
                    {it.wrong && <span className="text-red-400 ml-2">（你写的：{it.wrong}）</span>}
                  </div>
                ) : (
                  <button
                    onClick={() => setRevealed((p) => ({ ...p, [it.id]: true }))}
                    className="mt-2 text-sm px-3 py-1 rounded-full bg-moko-purple/10 text-moko-violet font-bold"
                  >
                    显示答案
                  </button>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => review(it.id, true)}
                    className="flex-1 py-2 rounded-full bg-green-500 text-white font-bold text-sm active:scale-95 transition"
                  >
                    我会了 ✅
                  </button>
                  <button
                    onClick={() => review(it.id, false)}
                    className="flex-1 py-2 rounded-full bg-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition"
                  >
                    还不会 💡
                  </button>
                </div>
                {it.source_module && (
                  <Link
                    href={`/study/${subjectKey[it.subject] ?? 'chinese'}/${it.source_module}`}
                    className="mt-2 inline-block text-xs px-3 py-1.5 rounded-full bg-moko-purple/10 text-moko-violet font-bold hover:bg-moko-purple/20 transition"
                  >
                    📚 去练同类题
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
