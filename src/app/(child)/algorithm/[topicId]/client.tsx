'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { AlgorithmTopic } from '@/lib/algorithm/types';
import { computePerformance, recommendDifficulty } from '@/lib/algorithm/adaptive';
import { MokoGroupBg } from '@/components/moko-bg';
import { MantraCard } from '@/components/algorithm/MantraCard';
import { ExampleDemo } from '@/components/algorithm/ExampleDemo';
import { PrincipleCard } from '@/components/algorithm/PrincipleCard';
import { FadeIn, FloatY } from '@/components/algorithm/LazyMotion';
import { ClayCard } from '@/components/design-system';

export interface PracticeSetSummary {
  id: string;
  title: string;
  topicId: string;
  level: number;
  questionCount: number;
}

interface ProgressData {
  level: number;
  correctCount: number;
  totalCount: number;
  bestStars: number;
  completedAt: string | null;
}

export function AlgorithmTopicClient({
  topic,
  practiceSets,
}: {
  topic: Omit<AlgorithmTopic, 'questions'>;
  practiceSets: PracticeSetSummary[];
}) {
  const [progress, setProgress] = useState<Record<number, ProgressData>>({});
  // 萌可教练推荐（自适应难度）：根据本主题近期表现推荐最合适的关卡。
  // adaptive.ts 的纯函数此前从未被 UI 消费——孩子只能自己挑关卡，
  // 连对两关不知道可以往上走，连错也得不到「先回退巩固」的引导。
  const [suggested, setSuggested] = useState<{
    level: number;
    reason: string;
    confidence: 'low' | 'medium' | 'high';
    hasHistory: boolean;
  } | null>(null);

  // 加载进度数据
  useEffect(() => {
    fetch('/api/algorithm-progress')
      .then((res) => res.json())
      .then((data) => {
        const topicProgress: ProgressData[] | undefined = data.progress?.[topic.id];
        if (topicProgress && topicProgress.length > 0) {
          const map: Record<number, ProgressData> = {};
          for (const p of topicProgress) {
            map[p.level] = p;
          }
          setProgress(map);

          // —— 自适应推荐：数据链路 = algorithm_progress 表 → computePerformance
          //    （最近 5 次练习的关卡 + 全程正确率）→ recommendDifficulty ——
          const perf = computePerformance(topicProgress);
          const rec = recommendDifficulty({ ...perf, topicId: topic.id });
          const hasHistory = topicProgress.some((p) => p.completedAt != null);
          setSuggested({
            level: rec.suggestedLevel,
            reason: rec.reason,
            confidence: rec.confidence,
            hasHistory,
          });
        } else {
          // 全新主题：直接推荐第 1 关（与「从头开始」的直觉一致）
          setSuggested({
            level: 1,
            reason: '第一次来，从第 1 关开始吧！',
            confidence: 'low',
            hasHistory: false,
          });
        }
      })
      .catch((e) => console.error('Failed to load progress', e));
  }, [topic.id]);

  return (
    <div className="relative max-w-4xl mx-auto min-h-screen pb-28 fade-up">
      <MokoGroupBg />

      {/* 头部 */}
      <div className="mb-6 flex items-center text-sm">
        <Link href="/algorithm" className="text-moko-violet font-bold hover:underline">
          ‹ 萌可算法学院
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-700 font-black">{topic.name}</span>
      </div>

      {/* 主题卡片（萌可教练角色 + 口诀） */}
      <ClayCard
        theme="violet"
        className="mb-6 p-6"
        style={{
          background: `linear-gradient(to right, ${topic.moko.color.replace('from-', '').replace('to-', '')})`,
        }}
      >
        <div className="flex items-start gap-4">
          <FloatY duration={3} amplitude={3}>
            <Image
              src={topic.moko.img || '/moko/lemei.webp'}
              alt={topic.moko.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
          </FloatY>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black">{topic.name}</h1>
              <span className="text-2xl">{topic.mantraEmoji}</span>
            </div>
            <p className="text-sm opacity-90">{topic.description}</p>
            <p className="text-xs mt-2 bg-white/20 px-2 py-1 rounded-full inline-block font-bold">
              💬 {topic.moko.line}
            </p>
          </div>
        </div>
      </ClayCard>

      {/* 跟着萌可做例题（先看具体例题，再讲抽象原理，适合低龄孩子） */}
      <FadeIn duration={0.3}>
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg border-2 border-moko-purple/20 mb-6">
          <h3 className="text-lg font-black text-moko-violet mb-4 flex items-center gap-2">
            <span>📖</span>
            <span>跟着萌可做例题</span>
          </h3>
          <ExampleDemo
            problem={topic.example.problem}
            scenes={topic.example.scenes}
            moko={{
              name: topic.moko.name,
              img: topic.moko.img,
              emoji: topic.moko.emoji,
              line: topic.moko.line,
            }}
            mantra={topic.mantra}
            topicId={topic.id}
          />
        </div>
      </FadeIn>

      {/* 口诀 + 原理（看完例题再看口诀和原理，理解更扎实） */}
      <div className="space-y-4 mb-6">
        <MantraCard
          emoji={topic.mantraEmoji}
          mantra={topic.mantra}
          mokoName={topic.moko.name}
          mokoImg={topic.moko.img}
        />
        <PrincipleCard
          title={`${topic.name} 的原理`}
          principle={topic.principle}
          keyPoints={topic.keyPoints}
          signals={topic.signals}
          pitfalls={topic.pitfalls}
          mokoName={topic.moko.name}
          mokoImg={topic.moko.img}
        />
      </div>

      {/* 练习关卡列表 */}
      <h2 id="practice" className="section-title mb-4">
        🎯 开始练习（10 个关卡）
      </h2>

      {/* 萌可教练推荐（自适应难度接入点）：有历史练习时显示建议关卡与理由 */}
      {suggested && (
        <FadeIn duration={0.3}>
          <Link
            href={`/algorithm/${topic.id}/practice/${suggested.level}`}
            data-testid="coach-recommendation"
            className="mb-4 flex items-center gap-3 rounded-3xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-md hover:scale-[1.02] transition"
          >
            <Image
              src={topic.moko.img || '/moko/lemei.webp'}
              alt={topic.moko.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-2xl border-2 border-white shadow object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-black text-gray-800 text-sm sm:text-base">
                {suggested.hasHistory
                  ? `${topic.moko.name}教练建议：去挑战练习 ${suggested.level}！`
                  : `从练习 ${suggested.level} 开始吧！`}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{suggested.reason}</div>
            </div>
            <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-white shadow">
              去练习 →
            </span>
          </Link>
        </FadeIn>
      )}

      <div className="grid grid-cols-2 gap-3">
        {practiceSets.map((set) => {
          const p = progress[set.level];
          const starCount = p?.bestStars ?? 0;
          const completed = p?.completedAt != null;
          const isSuggested = suggested?.level === set.level;
          return (
            <Link
              key={set.id}
              href={`/algorithm/${topic.id}/practice/${set.level}`}
              className={`relative rounded-3xl bg-white shadow-lg border-2 hover:scale-105 transition block p-4 text-center ${
                isSuggested
                  ? 'border-amber-400 ring-2 ring-amber-200'
                  : completed
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-moko-purple/15 hover:border-moko-purple'
              }`}
            >
              {isSuggested && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-white shadow whitespace-nowrap">
                  👍 推荐
                </span>
              )}
              <div className="text-3xl mb-1">{completed ? '🏆' : '🎪'}</div>
              <div className="font-black text-gray-800">{set.title}</div>
              <div className="mt-2 flex justify-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${i < starCount ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {completed ? `${p?.correctCount}/${p?.totalCount} ✓` : `${set.questionCount} 道题`}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
