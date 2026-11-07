'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ClayCard } from '@/components/design-system';
import { GuideModal } from '@/components/GuideModal';
import { getMokoPraise, pickMokoLine } from '@/components/study/MokoPraise';
import type {
  PracticeDayRecord,
  PracticeQuestion,
  PracticeSubmitResult,
} from '@/lib/daily-practice';
import { sfxComplete, sfxCorrect, sfxWrong } from '@/lib/sfx';
import { playTts, prefetchTtsBatch, toEdgeRate } from '@/lib/speak';
import { useOfflineStore } from '@/lib/stores';
import { AnswerOptions, type Praise } from './components/AnswerOptions';
import { CheckInSubmit } from './components/CheckInSubmit';
import { PracticeCompleted } from './components/PracticeCompleted';
import { getQuestionMeta, getQuestionSubject } from './components/practice-meta';
import { PracticeProgress } from './components/PracticeProgress';
import { PracticeResult } from './components/PracticeResult';
import {
  PracticeEmpty,
  PracticeLoadError,
  PracticeLoading,
  PracticeOfflineQueued,
} from './components/PracticeStates';
import { QuestionPrompt } from './components/QuestionPrompt';

async function autoPlay(q?: PracticeQuestion) {
  if (!q) return;
  // ⚠️ 只有**真听写**才朗读 han。识字题（chinese-quiz）与谜语题（riddle）的 han
  // 就是**正确答案本身**（han === options[answer]），朗读等于直接把答案念给孩子听。
  // 它们的 kind 已独立，这里刻意不给它们任何朗读分支 —— 见 gen-chinese.ts 与
  // daily-practice-generate-guard.test.ts 里对应的护栏。
  if (q.kind === 'pinyin') void playTts(q.audioText, 'zh', { wsRate: 0.6, pauseMs: 300 });
  else if (q.kind === 'english') void playTts(q.word, 'en');
  else if (q.kind === 'dictation') void playTts(q.han, 'zh', { wsRate: 0.6, pauseMs: 300 });
  else if (q.kind === 'mistake' && q.speakText) void playTts(q.speakText, 'zh', { wsRate: 0.7 });
}

export default function DailyPracticePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PracticeDayRecord | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<PracticeSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 离线暂存：网络异常时本地保存打卡，联网后由 OfflineSync 自动重放
  const [offlineQueued, setOfflineQueued] = useState(false);
  // 时光沙漏：是否拥有（已完成态下显示「再做一次」按钮用）
  const [hasTimeGlass, setHasTimeGlass] = useState(false);
  /** 加载失败的原因。与「今天没有练习」必须区分开不只显示空状态。 */
  const [loadError, setLoadError] = useState<string | null>(null);
  /**
   * 🧸 镇守萌可的答题反馈：
   * 当前题答对/答错时由三科镇守萌可（爱心/正正/唱唱）出口头禅。
   * 文案与语音取自同一句（pickMokoLine），保证「听到的=看到的」。
   */
  const [praise, setPraise] = useState<Praise | null>(null);

  /**
   * 拉取今日练习。
   *
   * 请求失败、返回 error 或 JSON 形状不对时必须进入 loadError，
   * 不能伪装成「今天本来就没有题」。
   */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/daily-practice');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || !Array.isArray(payload.questions)) {
        setLoadError(payload?.error || `题目加载失败（HTTP ${response.status}）`);
        return;
      }
      setData(payload);
      setSelected(new Array(payload.questions.length).fill(-1));
    } catch {
      setLoadError('网络好像走神了，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const q: PracticeQuestion | undefined = data?.questions[idx];

  // 切到新题时自动朗读（拼音/英语），不点也能听到。
  // 但已完成时不要朗读，避免在「已完成」页面后面偷偷播放语音。
  useEffect(() => {
    if (q && !data?.completed && !result) autoPlay(q);
  }, [q, data?.completed, result]);

  // TTS 批量预取：只覆盖与 autoPlay 同口径、会被朗读的动态文本。
  useEffect(() => {
    if (!data || data.completed || result) return;
    const items: Array<{ text: string; lang: 'zh' | 'en'; rate?: string }> = [];
    for (const question of data.questions) {
      if (question.kind === 'pinyin' && question.audioText)
        items.push({ text: question.audioText, lang: 'zh', rate: toEdgeRate(0.6) });
      else if (question.kind === 'english' && question.word)
        items.push({ text: question.word, lang: 'en', rate: '+0%' });
      else if (question.kind === 'dictation' && question.han)
        items.push({ text: question.han, lang: 'zh', rate: toEdgeRate(0.6) });
      else if (question.kind === 'mistake' && question.speakText)
        items.push({ text: question.speakText, lang: 'zh', rate: toEdgeRate(0.7) });
    }
    prefetchTtsBatch(items);
  }, [data, result]);

  // 拉取是否拥有时光沙漏（控制已完成态下「再做一次」按钮显隐）
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/castle/state');
        const payload = await response.json();
        setHasTimeGlass(Number(payload.inventory?.timeglass ?? 0) > 0);
      } catch {
        /* 城堡状态不可用时不影响每日一练主流程 */
      }
    })();
  }, []);

  const allAnswered =
    !!data &&
    selected.length === data.questions.length &&
    selected.every((answer) => answer !== -1);

  const choose = useCallback(
    (optionIndex: number) => {
      if (!q) return;
      // 已答对的本题锁死，不再重复触发萌可反馈
      if (selected[idx] === q.answer) return;
      setSelected((prev) => {
        const next = [...prev];
        next[idx] = optionIndex;
        return next;
      });
      // 文案先取，横幅与语音用同一句（听到的=看到的）。
      const subject = getQuestionSubject(q);
      const ok = optionIndex === q.answer;
      const text =
        q.kind === 'mistake'
          ? ok
            ? '捣蛋萌可被送回家啦，这个知识点归你了！'
            : '哎呀，捣蛋萌可又溜回来了！再想一想，把它捉住！'
          : pickMokoLine(subject, ok);
      setPraise({ ok, text });
      // 答题瞬间 SFX 先响；萌可台词稍后再说，避免两路音频叠在一起。
      try {
        if (ok) sfxCorrect();
        else sfxWrong();
        // 轻触觉反馈（安卓平板支持，iOS Safari 忽略）
        navigator.vibrate?.(ok ? 30 : [40, 40, 40]);
      } catch {}
      const m = getMokoPraise(subject);
      setTimeout(() => {
        void playTts(`${m.name}说：${text} ${ok ? m.sign : ''}`, 'zh', {
          wsRate: 0.85,
          preferStatic: true,
        });
      }, 350);
    },
    // selected 走函数式更新，无需列入依赖；q/idx 变化需重建
    [q, idx, selected]
  );

  const retry = useCallback(() => {
    if (!data || !result) return;
    setPraise(null);
    // 已完成的科自动填对答案（锁定），只清空没过、需要重练的科。
    setSelected(
      data.questions.map((question) => {
        const status = result.subjects.find(
          (subject) => subject.subject === question.subject
        )?.status;
        return status === 'failed' ? -1 : question.answer;
      })
    );
    setResult(null);
  }, [data, result]);

  const submit = useCallback(async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: selected }),
      });
      const payload = await response.json();
      setResult(payload);
      try {
        if (payload?.completed) sfxComplete();
        else sfxWrong();
      } catch {
        /* 忽略音效异常 */
      }
    } catch {
      // 离线/网络异常 → 本地暂存打卡。服务端提交是幂等的，联网后 OfflineSync 重放不会重复发奖。
      useOfflineStore.getState().addAction({
        type: 'checkin',
        payload: { answers: selected },
      });
      setOfflineQueued(true);
    } finally {
      setSubmitting(false);
    }
  }, [allAnswered, selected]);

  const resetWithTimeGlass = useCallback(async () => {
    const response = await fetch('/api/daily-practice/reset', { method: 'POST' });
    const payload = await response.json();
    if (!payload.ok) {
      alert(payload.message || '操作失败');
      return;
    }

    setLoading(true);
    const refreshed = await fetch('/api/daily-practice');
    const nextData = await refreshed.json();
    setData(nextData);
    setSelected(new Array(nextData.questions?.length ?? 0).fill(-1));
    setLoading(false);
    setHasTimeGlass(false);
  }, []);

  if (loading) return <PracticeLoading />;

  if (loadError) {
    return <PracticeLoadError message={loadError} onRetry={() => void load()} />;
  }

  if (offlineQueued) return <PracticeOfflineQueued />;

  if (data?.completed && !result) {
    return (
      <PracticeCompleted
        data={data}
        hasTimeGlass={hasTimeGlass}
        onUseTimeGlass={resetWithTimeGlass}
      />
    );
  }

  if (result) return <PracticeResult result={result} onRetry={retry} />;

  if (!q) return <PracticeEmpty />;

  const meta = getQuestionMeta(q);
  const total = data?.questions.length ?? 1;
  const currentAnswered = selected[idx] !== undefined && selected[idx] !== -1;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/home" className="text-sm text-gray-500">
          ‹ 返回
        </Link>
        <GuideModal
          trigger={
            <span className="text-sm text-moko-violet font-bold cursor-pointer">📖 攻略</span>
          }
        />
      </div>

      <PracticeProgress meta={meta} index={idx} total={total} />

      {data?.textbookHint && (
        <div className="mb-3 rounded-2xl bg-gradient-to-r from-moko-yellow/10 to-moko-orange/10 border border-moko-yellow/20 px-4 py-2 text-sm text-gray-600 text-center">
          {data.textbookHint}
        </div>
      )}

      <ClayCard className={`p-6 bg-gradient-to-br ${meta.grad} text-white`}>
        <QuestionPrompt question={q} />
        <AnswerOptions
          question={q}
          selectedIndex={selected[idx]}
          praise={praise}
          onChoose={choose}
        />
      </ClayCard>

      <CheckInSubmit
        index={idx}
        total={total}
        currentAnswered={currentAnswered}
        allAnswered={allAnswered}
        submitting={submitting}
        onPrevious={() => {
          setPraise(null);
          setIdx((current) => Math.max(0, current - 1));
        }}
        onNext={() => {
          setPraise(null);
          setIdx((current) => current + 1);
        }}
        onSubmit={() => void submit()}
      />
    </div>
  );
}
