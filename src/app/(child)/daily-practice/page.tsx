'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { GuideModal } from '@/components/GuideModal';
import type { PracticeDayRecord, PracticeQuestion, PracticeSubmitResult } from '@/lib/daily-practice';

const KIND_META: Record<string, { label: string; grad: string; icon: string }> = {
  pinyin: { label: '语文 · 拼音', grad: 'from-moko-pink to-moko-rose', icon: '🔤' },
  math: { label: '数学 · 口算', grad: 'from-moko-blue to-sky-400', icon: '🔢' },
  english: { label: '英语 · 听音', grad: 'from-moko-yellow to-amber-300', icon: '🔤' },
};

async function playTts(text: string, lang: 'zh' | 'en') {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.onended = () => URL.revokeObjectURL(url);
      await a.play();
    }
  } catch {
    /* 降级：忽略 */
  }
}

export default function DailyPracticePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PracticeDayRecord | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<PracticeSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/daily-practice');
        const j = await r.json();
        setData(j);
        setSelected(new Array(j.questions?.length ?? 0).fill(-1));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q: PracticeQuestion | undefined = data?.questions[idx];
  const allCorrect = !!data && data.questions.length > 0 && selected.length === data.questions.length && data.questions.every((qq, i) => selected[i] === qq.answer);

  const choose = useCallback(
    (optionIndex: number) => {
      if (!q) return;
      if (selected[idx] === q.answer) return; // 已答对则锁定
      setSelected((prev) => {
        const next = [...prev];
        next[idx] = optionIndex;
        return next;
      });
    },
    [q, selected, idx],
  );

  const submit = useCallback(async () => {
    if (!allCorrect) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: selected }),
      });
      const j = await r.json();
      setResult(j);
    } finally {
      setSubmitting(false);
    }
  }, [allCorrect, selected]);

  if (loading) {
    return <div className="max-w-2xl mx-auto p-10 text-center text-moko-violet font-bold">萌可正在准备今天的练习…</div>;
  }

  // 已完成（当天）
  if (data?.completed && !result) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card-moko text-center p-8 bg-gradient-to-br from-moko-gold to-moko-yellow text-white">
          <div className="text-6xl mb-3">🌟</div>
          <h1 className="text-3xl font-black mb-2">今天的一练完成啦！</h1>
          <p className="text-lg opacity-90">三科打卡已自动完成，萌可们超开心～</p>
          <p className="mt-4 text-sm">已连续完成 <b className="text-xl">{data.practiceStreak}</b> 天 · 再坚持 <b>{data.nextMilestone}</b> 天解锁新萌可 🧸</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/home" className="px-6 py-3 rounded-full bg-white text-moko-violet font-black">返回首页</Link>
            <Link href="/castle" className="px-6 py-3 rounded-full bg-moko-rose text-white font-black">去看城堡</Link>
          </div>
        </div>
        <div className="mt-4 text-center">
          <GuideModal trigger={<span className="inline-block px-4 py-2 rounded-full bg-white shadow text-moko-violet font-bold cursor-pointer">📖 查看攻略说明</span>} />
        </div>
      </div>
    );
  }

  // 提交结果弹窗
  if (result) {
    const rw = result.rewards;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card-moko text-center p-8 bg-gradient-to-br from-moko-pink to-moko-rose text-white">
          <div className="text-6xl mb-3">🎉</div>
          <h1 className="text-3xl font-black mb-2">全部答对，太棒啦！</h1>
          <p className="text-lg opacity-90">今日一练完成，三科打卡自动完成 🌟</p>
          {rw && (
            <div className="mt-5 space-y-2 text-left bg-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2">☀️ <span>阳光能量 +{rw.sunlight}</span></div>
              <div className="flex items-center gap-2">🧸 <span>召唤 {rw.mokos.join('、')}</span></div>
              {rw.prosperity && <div className="flex items-center gap-2">🏰 <span>城堡繁荣度 +1</span></div>}
              <div className="flex items-center gap-2">🔥 <span>已连续完成 {result.practiceStreak} 天</span></div>
            </div>
          )}
          {result.milestone && (
            <div className="mt-4 bg-white/25 rounded-2xl p-4">
              <div className="text-2xl font-black">🌟 连续 7 天达成！</div>
              <div className="mt-1">解锁新萌可「{result.milestone.mokoName}」+ 10 ⭐ 星星币</div>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/home" className="px-6 py-3 rounded-full bg-white text-moko-rose font-black">返回首页</Link>
            <Link href="/castle" className="px-6 py-3 rounded-full bg-moko-gold text-white font-black">去看城堡</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return <div className="max-w-2xl mx-auto p-10 text-center text-moko-violet font-bold">今天暂时没有练习哦～</div>;
  }

  const meta = KIND_META[q.kind];
  const isCorrect = selected[idx] === q.answer;
  const isWrong = selected[idx] !== -1 && selected[idx] !== q.answer;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/home" className="text-sm text-gray-500">‹ 返回</Link>
        <GuideModal trigger={<span className="text-sm text-moko-violet font-bold cursor-pointer">📖 攻略</span>} />
      </div>

      {/* 进度 */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span className={`font-bold bg-gradient-to-r ${meta.grad} bg-clip-text text-transparent`}>{meta.icon} {meta.label}</span>
          <span>第 {idx + 1} / {data?.questions.length} 题</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all" style={{ width: `${((idx + 1) / (data?.questions.length ?? 1)) * 100}%` }} />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className={`card-moko p-6 bg-gradient-to-br ${meta.grad} text-white`}>
        <div className="text-center mb-4">
          {q.kind === 'pinyin' && (
            <>
              <div className="text-6xl font-black mb-2">{q.han}</div>
              <button onClick={() => playTts(q.audioText, 'zh')} className="text-sm bg-white/30 rounded-full px-3 py-1">🔊 听一听</button>
            </>
          )}
          {q.kind === 'math' && <div className="text-5xl font-black">{q.prompt}</div>}
          {q.kind === 'english' && (
            <>
              <div className="text-6xl mb-2">{q.emoji}</div>
              <button onClick={() => playTts(q.word, 'en')} className="text-sm bg-white/30 rounded-full px-3 py-1">🔊 听一听</button>
            </>
          )}
          <p className="text-sm opacity-90 mt-3">{q.prompt}</p>
        </div>

        {/* 选项 */}
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const correct = i === q.answer;
            const picked = selected[idx] === i;
            let cls = 'bg-white/90 text-moko-violet hover:scale-105';
            if (picked && correct) cls = 'bg-white text-green-600 font-black scale-105 ring-4 ring-green-300';
            else if (picked && !correct) cls = 'bg-red-100 text-red-600 font-black ring-4 ring-red-300';
            else if (isCorrect && correct) cls = 'bg-white text-green-600 font-black ring-4 ring-green-300';
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={isCorrect}
                className={`py-4 rounded-2xl text-2xl font-black transition transform active:scale-95 ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {isWrong && <p className="text-center text-sm mt-3 bg-red-500/80 rounded-full py-1">再想想，点一下正确的选项吧～</p>}
        {isCorrect && <p className="text-center text-sm mt-3 bg-green-500/80 rounded-full py-1">答对啦！{q.explain}</p>}
      </div>

      {/* 导航 */}
      <div className="flex justify-between mt-5">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="px-5 py-3 rounded-full bg-white shadow text-moko-violet font-bold disabled:opacity-30"
        >
          ‹ 上一题
        </button>
        {idx < (data?.questions.length ?? 1) - 1 ? (
          <button
            onClick={() => setIdx((i) => i + 1)}
            disabled={!isCorrect}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black disabled:opacity-40"
          >
            下一题 ›
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!allCorrect || submitting}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black disabled:opacity-40"
          >
            {submitting ? '提交中…' : '✅ 完成今日一练'}
          </button>
        )}
      </div>
    </div>
  );
}
