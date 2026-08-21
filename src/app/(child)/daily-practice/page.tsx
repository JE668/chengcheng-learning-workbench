'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { GuideModal } from '@/components/GuideModal';
import { EmptyState } from '@/components/EmptyState';
import { playTts } from '@/lib/speak';
import type { PracticeDayRecord, PracticeQuestion, PracticeSubmitResult } from '@/lib/daily-practice';
import { PROSPERITY_BONUS } from '@/lib/moko';

const KIND_META: Record<string, { label: string; grad: string; icon: string }> = {
  pinyin: { label: '语文 · 拼音', grad: 'from-moko-pink to-moko-rose', icon: '🔤' },
  dictation: { label: '语文 · 听写', grad: 'from-moko-pink to-moko-rose', icon: '✍️' },
  math: { label: '数学 · 口算', grad: 'from-moko-blue to-sky-400', icon: '🔢' },
  english: { label: '英语 · 听音', grad: 'from-moko-yellow to-amber-300', icon: '🔤' },
  mistake: { label: '错题重练', grad: 'from-moko-violet to-purple-400', icon: '🔁' },
};
const FALLBACK_META = { label: '今日练习', grad: 'from-moko-violet to-moko-purple', icon: '📝' };

async function autoPlay(q?: PracticeQuestion) {
  if (!q) return;
  if (q.kind === 'pinyin') void playTts(q.audioText, 'zh', { wsRate: 0.5, pauseMs: 400 });
  else if (q.kind === 'english') void playTts(q.word, 'en');
  else if (q.kind === 'dictation') void playTts(q.han, 'zh', { wsRate: 0.5, pauseMs: 400 });
  else if (q.kind === 'mistake' && q.speakText) void playTts(q.speakText, 'zh', { wsRate: 0.6 });
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

  // 切到新题时自动朗读（拼音/英语），不点也能听到。
  // 但已完成时不要朗读（避免在"已完成"弹窗后面偷偷播放语音）
  useEffect(() => {
    if (q && !data?.completed && !result) autoPlay(q);
  }, [q]);

  const allAnswered = !!data && selected.length === data.questions.length && selected.every((s) => s !== -1);

  const choose = useCallback(
    (optionIndex: number) => {
      if (!q) return;
      setSelected((prev) => {
        const next = [...prev];
        next[idx] = optionIndex;
        return next;
      });
    },
    [q, selected, idx],
  );

  const retry = useCallback(() => {
    if (!data || !result) return;
    // 已完成的科自动填对答案（锁定），只清空没过、需要重练的科
    setSelected(
      data.questions.map((qq) => {
        const st = result.subjects.find((x) => x.subject === qq.subject)?.status;
        return st === 'failed' ? -1 : qq.answer;
      }),
    );
    setResult(null);
  }, [data, result]);

  const submit = useCallback(async () => {
    if (!allAnswered) return;
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
  }, [allAnswered, selected]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-10 flex flex-col items-center gap-3 text-moko-violet font-bold">
        <span className="moko-loader"><span></span><span></span><span></span></span>
        <span>萌可正在准备今天的练习…</span>
      </div>
    );
  }

  // 已完成（当天）
  const [hasTimeGlass, setHasTimeGlass] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/castle/state');
        const j = await r.json();
        setHasTimeGlass(Number(j.inventory?.timeglass ?? 0) > 0);
      } catch { /* */ }
    })();
  }, []);

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
        {/* 使用时光沙漏再做一次 */}
        {hasTimeGlass && (
          <div className="mt-4 rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-violet/20 text-center">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-sm text-gray-600 mb-3">你有时光沙漏！可以用它再做一次今天的每日一练（不影响已得的奖励）</p>
            <button
              onClick={async () => {
                const r = await fetch('/api/daily-practice/reset', { method: 'POST' });
                const j = await r.json();
                if (j.ok) {
                  // 重新拉取每日一练数据
                  setLoading(true);
                  const r2 = await fetch('/api/daily-practice');
                  const d = await r2.json();
                  setData(d);
                  setSelected(new Array(d.questions?.length ?? 0).fill(-1));
                  setLoading(false);
                  setHasTimeGlass(false);
                } else {
                  alert(j.message || '操作失败');
                }
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black text-sm shadow active:scale-95 transition"
            >
              ⏳ 使用时光沙漏再做一次
            </button>
          </div>
        )}
        <div className="mt-4 text-center">
          <GuideModal trigger={<span className="inline-block px-4 py-2 rounded-full bg-white shadow text-moko-violet font-bold cursor-pointer">📖 查看攻略说明</span>} />
        </div>
      </div>
    );
  }

  // 提交结果弹窗
  if (result) {
    // 三科全部完成 → 庆祝
    if (result.completed) {
      const rw = result.rewards;
      return (
        <div className="max-w-2xl mx-auto p-6">
          <div className="card-moko text-center p-8 bg-gradient-to-br from-moko-pink to-moko-rose text-white">
            <div className="text-6xl mb-3">🎉</div>
            <h1 className="text-3xl font-black mb-2">三科全部完成，太棒啦！</h1>
            <p className="text-lg opacity-90">今日一练打卡完成，萌可们超开心～</p>
            {rw && (
              <div className="mt-5 space-y-2 text-left bg-white/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">☀️ <span>阳光能量 +{rw.sunlight}</span></div>
                <div className="flex items-center gap-2">🧸 <span>召唤 {rw.mokos.join('、')}</span></div>
                {rw.prosperity && <div className="flex items-center gap-2">🏰 <span>城堡繁荣度 +{PROSPERITY_BONUS}</span></div>}
                <div className="flex items-center gap-2">🔥 <span>已连续完成 {result.practiceStreak} 天</span></div>
                {(result.tickets ?? 0) > 0 && <div className="flex items-center gap-2">🎟️ <span>捕捉券 +{result.tickets}（去「萌可闯关」读故事、捉萌可吧！）</span></div>}
              </div>
            )}
            {result.milestone && (
              <div className="mt-4 bg-white/25 rounded-2xl p-4">
                <div className="text-2xl font-black">🌟 连续 {result.practiceStreak} 天达成！</div>
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
    // 部分完成 → 按科展示 + 继续练习
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card-moko text-center p-8 bg-gradient-to-br from-moko-gold to-moko-yellow text-white">
          <div className="text-6xl mb-3">💪</div>
          <h1 className="text-3xl font-black mb-2">这一科完成啦，继续加油！</h1>
          <p className="text-lg opacity-90">每做对一科，就解锁一只萌可～把没过的也补上吧！</p>
          <div className="mt-5 space-y-2 text-left bg-white/20 rounded-2xl p-4">
            {result.subjects.map((s) => (
              <div key={s.subject} className="flex items-center justify-between">
                <span className="font-bold">{s.subject}</span>
                <span>
                  {s.status === 'passed' || s.status === 'already' ? '✅ 已完成' : `❌ ${s.correct}/${s.total} 再练一次`}
                </span>
              </div>
            ))}
          </div>
          {result.rewards && (
            <div className="mt-3 text-left bg-white/20 rounded-2xl p-4 space-y-1">
              <div>☀️ 阳光能量 +{result.rewards.sunlight}</div>
              <div>🧸 召唤 {result.rewards.mokos.join('、')}</div>
            </div>
          )}
          {(result.tickets ?? 0) > 0 && (
            <div className="mt-3 text-left bg-white/20 rounded-2xl p-4 space-y-1">
              <div>🎟️ 捕捉券 +{result.tickets}（去「萌可闯关」读故事、捉萌可吧！）</div>
            </div>
          )}
          <button onClick={retry} className="mt-6 px-8 py-3 rounded-full bg-white text-moko-rose font-black hover:scale-105 transition">
            继续练习没完成的科目
          </button>
          <div className="mt-3">
            <Link href="/home" className="text-sm font-bold text-white/90 underline">先回首页逛逛 ›</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-10">
        <EmptyState emoji="🌙" title="今天暂时没有练习哦～" desc="去「萌可剧情」读个故事，或到城堡看看萌可吧！" />
      </div>
    );
  }

  const meta = KIND_META[q.kind] ?? FALLBACK_META;
  const isCorrect = selected[idx] === q.answer;
  const isWrong = selected[idx] !== -1 && selected[idx] !== q.answer;
  // 错题重练的选项可能是整句话，太长就改成一行一个、字号调小
  const longOpts = q.options.some((o) => o.length > 6);

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
        {/* 通过门槛提示 */}
        <p className="text-xs text-gray-400 mt-1 text-center">💡 答对 80% 以上就算通过（允许错 1~2 题），做错可以重选哦～</p>
      </div>

      {/* 题目卡片 */}
      <div className={`card-moko p-6 bg-gradient-to-br ${meta.grad} text-white`}>
        <div className="text-center mb-4">
          {q.kind === 'pinyin' && (
            <>
              <div className="text-6xl font-black mb-2">{q.han}</div>
              <button onClick={() => playTts(q.audioText, 'zh', { wsRate: 0.5, pauseMs: 400 })} className="text-sm bg-white/30 rounded-full px-3 py-1">🔊 听一听</button>
            </>
          )}
          {q.kind === 'dictation' && (
            <>
              <div className="text-6xl font-black mb-2">✍️</div>
              <button onClick={() => playTts(q.han, 'zh', { wsRate: 0.5, pauseMs: 400 })} className="text-sm bg-white/30 rounded-full px-4 py-1.5">🔊 听写 · 再听一遍</button>
            </>
          )}
          {q.kind === 'math' && <div className="text-5xl font-black">{q.prompt}</div>}
          {q.kind === 'english' && (
            <>
              <div className="text-6xl mb-2">{q.emoji}</div>
              {q.subtype !== 'initial' && q.cn && <div className="text-sm opacity-80 mb-1">{q.cn}</div>}
              <div className="flex gap-2 justify-center">
                <button onClick={() => playTts(q.word, 'en')} className="text-sm bg-white/30 rounded-full px-3 py-1">🔊 听一听</button>
                <button onClick={() => playTts(q.word, 'en')} className="text-sm bg-moko-pink/30 rounded-full px-3 py-1">🎙️ 跟读</button>
              </div>
            </>
          )}
          {q.kind === 'mistake' && (
            <>
              <div className="text-4xl mb-2">🔁</div>
              <div className="inline-block text-xs bg-white/25 px-3 py-1 rounded-full mb-2">
                {q.origin} · 上次做错了，再来一次！
              </div>
              <div className="text-2xl font-black leading-snug">{q.prompt}</div>
              {q.speakText && (
                <button
                  onClick={() => playTts(q.speakText as string, 'zh', { wsRate: 0.6 })}
                  className="mt-2 text-sm bg-white/30 rounded-full px-3 py-1"
                >
                  🔊 听一听
                </button>
              )}
            </>
          )}
          {q.kind !== 'mistake' && <p className="text-sm opacity-90 mt-3">{q.prompt}</p>}
        </div>

        {/* 选项 */}
        <div className={`grid ${longOpts ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
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
                className={`py-4 px-3 rounded-2xl ${longOpts ? 'text-base leading-snug' : 'text-2xl'} font-black transition transform active:scale-95 ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {isWrong && <p className="text-center text-sm mt-3 bg-moko-yellow/80 text-moko-violet rounded-full py-1">没关系，再想想，点一下正确的选项吧～答错可以重选哦！</p>}
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
            disabled={selected[idx] === -1}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black disabled:opacity-40"
          >
            下一题 ›
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black disabled:opacity-40"
          >
            {submitting ? '提交中…' : '✅ 完成今日一练'}
          </button>
        )}
      </div>
    </div>
  );
}
