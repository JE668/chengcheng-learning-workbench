'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { genPracticeSet } from '@/lib/algorithm/generators';
import { getTopic } from '@/lib/algorithm/topics';
import { AlgorithmQuiz } from '@/components/algorithm/AlgorithmQuiz';
import { sfxComplete } from '@/lib/sfx';
import { MokoGroupBg } from '@/components/moko-bg';

/** 计算星级：3⭐ ≥90% | 2⭐ ≥70% | 1⭐ ≥50% | 0 <50% */
function calcStars(correct: number, total: number): number {
  const ratio = correct / total;
  return ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;
}

/** 渲染星星 */
function StarDisplay({ count, total }: { count: number; total: number }) {
  const stars = calcStars(count, total);
  return (
    <div className="text-4xl font-black bg-white/20 rounded-2xl py-4 px-6 inline-block mb-4">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={i < stars ? 'opacity-100' : 'opacity-30'}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export default function PracticeLevelPage() {
  // Next 15：页面级 params 变成 Promise，客户端组件改用 useParams() hook 同步读取（React 18 兼容）
  const params = useParams<{ topicId: string; level: string }>();
  const level = parseInt(params.level, 10);
  const topic = getTopic(params.topicId);

  // 注意：notFound() 必须放在**所有 Hook 之后**调用。
  // 若在 Hook 之前抛错，非法 URL 的渲染只执行了 1 个 Hook（useParams），
  // 而合法 URL 会执行 7 个 —— 同一组件的 Hook 数量不一致，React 会直接报
  //「Rendered fewer hooks than expected」把页面打到错误边界。
  // genPracticeSet 对无效 topicId 返回空数组（不抛错），所以这里提前算题是安全的。
  const questions = useMemo(() => genPracticeSet(params.topicId, level), [params.topicId, level]);
  const totalQuestions = questions.length;

  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stars, setStars] = useState(0);
  // 练题时的「口诀 + 识别信号」回看面板（默认收起）
  const [hintOpen, setHintOpen] = useState(false);

  const currentQuestion = questions[idx];

  const handleComplete = useCallback(
    (correct: boolean) => {
      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        // 记录错题 ID
        setMistakes((prev) => [...prev, currentQuestion.id]);
      }
    },
    [currentQuestion.id]
  );

  const handleNext = useCallback(() => {
    if (idx < totalQuestions - 1) {
      setIdx(idx + 1);
    } else {
      // 关卡完成
      setAllDone(true);
      sfxComplete();
    }
  }, [idx, totalQuestions]);

  // 保存进度到 API
  const saveProgress = useCallback(async () => {
    if (saved) return;
    setSaved(true);
    try {
      const res = await fetch('/api/algorithm-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: params.topicId,
          level,
          correctCount,
          totalCount: totalQuestions,
          mistakes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStars(data.stars);
      }
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }, [saved, params.topicId, level, correctCount, totalQuestions, mistakes]);

  // 当 allDone 变为 true 时保存进度。
  // 必须用 useEffect：saveProgress 内部会 setSaved(true)，放在 useMemo 里等于在
  // 渲染期间更新 state，StrictMode 下会重复提交并产生警告。
  useEffect(() => {
    if (allDone && !saved) {
      void saveProgress();
    }
  }, [allDone, saved, saveProgress]);

  // 全部 Hook 调用完毕后再校验非法参数（见上方注释：不能提前抛）
  // ⚠️ 除参数合法性外，还必须校验**题集非空**：
  // genPracticeSet 对无法出题的主题/关卡会返回 []，此时 currentQuestion 为
  // undefined，后面 `<AlgorithmQuiz question={currentQuestion}>` 会在
  // AlgorithmQuiz 内部读 question.stepFields 时抛 TypeError 打到错误边界 ——
  // 对用户表现为「页面崩了」而不是「404」。
  if (!topic || isNaN(level) || totalQuestions === 0) notFound();

  if (allDone) {
    const finalStars = calcStars(correctCount, totalQuestions);
    return (
      <div className="relative max-w-2xl mx-auto min-h-screen pb-28 fade-up flex items-center justify-center p-6">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-3xl font-black mb-2">练习完成！</h2>
          <p className="text-lg mb-4">
            你答对了 {correctCount} / {totalQuestions} 道题
          </p>
          <StarDisplay count={correctCount} total={totalQuestions} />
          {mistakes.length > 0 && (
            <p className="text-sm mb-4 opacity-90">有 {mistakes.length} 道题需要复习</p>
          )}
          <div className="flex gap-3 justify-center">
            <Link
              href={`/algorithm/${params.topicId}`}
              className="px-6 py-3 bg-white text-moko-purple rounded-full font-black"
            >
              再练一关 →
            </Link>
            <Link
              href="/algorithm"
              className="px-6 py-3 bg-white/20 text-white rounded-full font-bold"
            >
              回学院
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto min-h-screen pb-28 fade-up p-6">
      <MokoGroupBg />

      {/* 进度指示 */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/algorithm/${params.topicId}`}
          className="text-moko-violet font-bold hover:underline text-sm"
        >
          ‹ 返回{topic.name}
        </Link>
        <div className="text-sm font-bold text-moko-violet bg-white/80 px-3 py-1 rounded-full">
          第 {idx + 1} / {totalQuestions} 题
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-white rounded-full overflow-hidden mb-6 shadow">
        <div
          className="h-full bg-gradient-to-r from-moko-violet to-moko-purple"
          style={{ width: `${((idx + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* 口诀 + 识别信号：练题时随时能回看「什么时候用这招」 */}
      <div className="mb-4 rounded-2xl border-2 border-moko-purple/20 bg-white/90 overflow-hidden shadow">
        <button
          onClick={() => setHintOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm font-black text-moko-violet"
        >
          <span>💡 忘了怎么做？点我看口诀</span>
          <span>{hintOpen ? '收起 ▲' : '展开 ▼'}</span>
        </button>
        {hintOpen && (
          <div className="px-4 pb-3 text-sm text-gray-700 space-y-2">
            <p className="font-bold text-moko-violet">
              {topic.mantraEmoji} {topic.mantra}
            </p>
            {topic.signals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topic.signals.map((sg, i) => (
                  <span
                    key={i}
                    className="text-xs bg-moko-purple/10 text-gray-700 rounded-full px-2.5 py-1"
                  >
                    {sg}
                  </span>
                ))}
              </div>
            )}
            {topic.pitfalls.length > 0 && (
              <ul className="text-xs text-amber-700 space-y-0.5">
                {topic.pitfalls.map((pf, i) => (
                  <li key={i}>⚠️ {pf}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 题目 */}
      <AlgorithmQuiz
        key={currentQuestion.id}
        question={currentQuestion}
        onComplete={handleComplete}
        onNext={handleNext}
        showPrinciple
        topicId={params.topicId}
        level={level}
      />
    </div>
  );
}
