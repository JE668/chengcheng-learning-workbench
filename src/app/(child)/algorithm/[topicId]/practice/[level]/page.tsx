'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { genPracticeSet } from '@/lib/algorithm/generators';
import { getTopic } from '@/lib/algorithm/topics';
import { AlgorithmQuiz } from '@/components/algorithm/AlgorithmQuiz';
import { sfxComplete } from '@/lib/sfx';
import { MokoGroupBg } from '@/components/moko-bg';
import { motion } from 'framer-motion';

export default function PracticeLevelPage({
  params,
}: {
  params: { topicId: string; level: string };
}) {
  const level = parseInt(params.level, 10);
  const topic = getTopic(params.topicId);

  if (!topic || isNaN(level)) notFound();

  // 生成当前关卡的 10 道题
  const questions = useMemo(() => genPracticeSet(params.topicId, level), [params.topicId, level]);
  const totalQuestions = questions.length;

  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const currentQuestion = questions[idx];

  const handleNext = () => {
    if (idx < totalQuestions - 1) {
      setIdx(idx + 1);
    } else {
      setAllDone(true);
      sfxComplete();
    }
  };

  const handleComplete = (correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1);
  };

  if (allDone) {
    return (
      <div className="relative max-w-2xl mx-auto min-h-screen pb-28 fade-up flex items-center justify-center p-6">
        <motion.div
          className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-center text-white shadow-2xl"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-3xl font-black mb-2">练习完成！</h2>
          <p className="text-lg mb-4">你答对了 {correctCount} / {totalQuestions} 道题</p>
          <motion.div
            className="text-4xl font-black bg-white/20 rounded-2xl py-4 px-6 inline-block mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: 3, duration: 0.5 }}
          >
            ⭐ ⭐ ⭐
          </motion.div>
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto min-h-screen pb-28 fade-up p-6">
      <MokoGroupBg />

      {/* 进度指示 */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/algorithm/${params.topicId}`} className="text-moko-violet font-bold hover:underline text-sm">
          ‹ 返回{topic.name}
        </Link>
        <div className="text-sm font-bold text-moko-violet bg-white/80 px-3 py-1 rounded-full">
          第 {idx + 1} / {totalQuestions} 题
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-white rounded-full overflow-hidden mb-6 shadow">
        <motion.div
          className="h-full bg-gradient-to-r from-moko-violet to-moko-purple"
          animate={{ width: `${((idx + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* 题目 */}
      <AlgorithmQuiz
        key={currentQuestion.id}
        question={currentQuestion}
        onComplete={handleComplete}
        onNext={handleNext}
        showPrinciple
      />
    </div>
  );
}
