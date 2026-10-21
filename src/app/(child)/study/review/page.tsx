'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { playTts } from '@/lib/speak';

/**
 * 🏫 小老师台词（2026-10-21 ②号内容升级）——固定文案，已进预生成
 * 静态集（moko-phrases-manifest ⑥ 段），播放走 preferStatic。
 * learning-by-teaching：让孩子把错题「讲给萌可听」，教是最好的学。
 */
const TEACH_LINES_OK = [
  '萌可学会啦，谢谢小老师！',
  '哇，原来如此！程程教得真清楚！',
  '程程是萌可最棒的小老师！',
];
const TEACH_LINES_RETRY = [
  '萌可还有点没听懂，再教一遍好不好？',
  '萌可想到了另一个答案，小老师再看看？',
];

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

/** 把正确答案和干扰项混在一起打乱 */
function shuffleAns(answer: string, distractors: string[]): string[] {
  const opts = [answer, ...distractors.filter((d) => d !== answer)];
  const uniq = [...new Set(opts)].slice(0, 4);
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return uniq;
}

export default function ReviewPage() {
  const [items, setItems] = useState<MistakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(0);
  const [pickedAns, setPickedAns] = useState<Record<number, string>>({});

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
      <h1 className="page-title mb-2">🏫 萌可小课堂</h1>
      <p className="text-gray-600 mb-6">
        萌可们有些题还没弄懂，程程来当<b className="text-moko-violet">小老师</b>教教它们吧！
        想一想正确答案是哪个，点出来讲给萌可听～
      </p>

      {loading ? (
        <div className="text-center text-gray-400 py-16 flex flex-col items-center justify-center gap-3"><span className="moko-loader"><span></span><span></span><span></span></span>萌可正在翻找你的错题本…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl p-10 bg-white clay-card clay-theme clay-violet text-center">
          <div className="text-6xl mb-3">🎉</div>
          <div className="text-xl font-black text-moko-violet">萌可们全都学会了，没有要教的题！</div>
          <p className="text-gray-500 mt-2">去学科里多学一点，攒更多知识当小老师吧～</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">今日待复习 {items.length} 个 · 已复习 {done} 个</div>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl p-4 bg-white clay-card">
                <div className="flex items-center gap-2 mb-2">
                  <span>{subjectEmoji[it.subject] || '📘'}</span>
                  <span className="font-bold text-moko-violet">{it.subject}</span>
                  <span className="text-xs text-gray-400">· {it.kind}</span>
                </div>
                <div className="text-lg font-black text-gray-700">{it.prompt}</div>
                {revealed[it.id] ? (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-bold">正确答案：{it.answer}</span>
                    {it.wrong && <span className="text-red-400 ml-2">（上次写错：{it.wrong}）</span>}
                    {pickedAns[it.id] && pickedAns[it.id] !== it.answer && (
                      <span className="text-red-500 ml-2">（这次选了：{pickedAns[it.id]}）</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {/* 把答案和干扰项混在一起做选择题 */}
                    {(() => {
                      const opts = shuffleAns(it.answer, items.filter((x) => x.id !== it.id && x.subject === it.subject).map((x) => x.answer).slice(0, 3));
                      return opts.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setPickedAns((p) => ({ ...p, [it.id]: opt }));
                            setRevealed((p) => ({ ...p, [it.id]: true }));
                            if (opt === it.answer) {
                              setDone((n) => n + 1);
                              // 小老师教对了：萌可学会的反馈（静态台词秒响）
                              const line = TEACH_LINES_OK[Math.floor(Math.random() * TEACH_LINES_OK.length)];
                              void playTts(line, 'zh', { wsRate: 0.85, preferStatic: true });
                            } else {
                              const line = TEACH_LINES_RETRY[Math.floor(Math.random() * TEACH_LINES_RETRY.length)];
                              void playTts(line, 'zh', { wsRate: 0.85, preferStatic: true });
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl font-bold text-sm transition ${
                            pickedAns[it.id] === opt
                              ? opt === it.answer ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-red-100 text-red-600 border-2 border-red-500'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-moko-purple/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ));
                    })()}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => review(it.id, true)}
                    className="flex-1 py-2 rounded-full bg-green-500 text-white font-bold text-sm active:scale-95 transition"
                  >
                    萌可学会了 ✅
                  </button>
                  <button
                    onClick={() => review(it.id, false)}
                    className="flex-1 py-2 rounded-full bg-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition"
                  >
                    萌可没听懂 💡
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
