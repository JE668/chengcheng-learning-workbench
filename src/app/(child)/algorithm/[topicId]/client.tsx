'use client';

import Image from 'next/image';
import Link from 'next/link';;
import type { AlgorithmTopic } from '@/lib/algorithm/types';
import { MokoGroupBg } from '@/components/moko-bg';
import { MantraCard } from '@/components/algorithm/MantraCard';
import { PrincipleCard } from '@/components/algorithm/PrincipleCard';
import { FadeIn, FloatY } from '@/components/algorithm/LazyMotion';

export interface PracticeSetSummary {
  id: string;
  title: string;
  topicId: string;
  level: number;
  questionCount: number;
}

export function AlgorithmTopicClient({
  topic,
  practiceSets,
}: {
  topic: Omit<AlgorithmTopic, 'questions'>;
  practiceSets: PracticeSetSummary[];
}) {
  return (
    <div className="relative max-w-4xl mx-auto min-h-screen pb-28 fade-up">
      <MokoGroupBg />

      {/* 头部 */}
      <div className="mb-6 flex items-center text-sm">
        <Link href="/algorithm" className="text-moko-violet font-bold hover:underline">‹ 萌可算法学院</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-700 font-black">{topic.name}</span>
      </div>

      {/* 主题卡片（萌可教练角色 + 口诀） */}
      <div className={`card-moko mb-6 bg-gradient-to-r ${topic.moko.color} text-white p-6`}>
        <div className="flex items-start gap-4">
          <FloatY duration={3} amplitude={3}>
            <Image
              src={topic.moko.img || '/moko/lemei.jpg'}
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
      </div>

      {/* 知识点 + 原理 */}
      <div className="space-y-4 mb-6">
        <PrincipleCard
          title={`${topic.name} 的原理`}
          principle={topic.principle}
          keyPoints={topic.keyPoints}
          mokoName={topic.moko.name}
          mokoImg={topic.moko.img}
        />
        <MantraCard
          emoji={topic.mantraEmoji}
          mantra={topic.mantra}
          mokoName={topic.moko.name}
          mokoImg={topic.moko.img}
        />
      </div>

      {/* 示例题目展示 */}
      <FadeIn duration={0.3}>
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-moko-purple/20 mb-6">
          <h3 className="text-lg font-black text-moko-violet mb-4 flex items-center gap-2">
            <span>📖</span>
            <span>典型例题</span>
          </h3>
          <div className="text-center mb-4">
            <div className="text-3xl font-black text-moko-purple mb-2">{topic.example.problem}</div>
          </div>
          <div className="space-y-2">
            {topic.example.solution.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-moko-purple/5 rounded-2xl p-3 border-2 border-moko-purple/10"
              >
                <span className="w-7 h-7 rounded-full bg-moko-purple text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* 练习关卡列表 */}
      <h2 className="section-title mb-4">🎯 开始练习（10 个关卡）</h2>
      <div className="grid grid-cols-2 gap-3">
        {practiceSets.map((set) => {
          const starCount = 0; // TODO: 从数据库读取
          return (
            <Link
              key={set.id}
              href={`/algorithm/${topic.id}/practice/${set.level}`}
              className="rounded-3xl bg-white shadow-lg border-2 border-moko-purple/15 hover:border-moko-purple hover:scale-105 transition block p-4 text-center"
            >
              <div className="text-3xl mb-1">🎪</div>
              <div className="font-black text-gray-800">{set.title}</div>
              <div className="mt-2 flex justify-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < starCount ? 'text-yellow-400' : 'text-gray-200'}`}>
                    ★
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">{set.questionCount} 道题</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
