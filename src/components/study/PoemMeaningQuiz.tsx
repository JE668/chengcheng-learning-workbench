'use client';

import { useState } from 'react';
import { playTtsEnd } from '@/lib/speak';
import { POEM_MEANING_QUIZZES } from '@/lib/study-data/poem-quizzes';

/**
 * 🌙 诗意小问答（2026-10-21 ④号内容升级）
 *
 * 阅读理解启蒙：PoemCard 读完/背完后弹出的一道画面感三选一。
 * - 问题与解释全部朗读（固定文案，预生成静态集秒响）
 * - 答对：sfx + 星星反馈；答错：温柔提示再选一次（不惩罚）
 * - 一诗一题（Record 查表，无题的诗自动隐藏）
 * 由 PoemModule 的 PoemCard 挂载在复读机之后。
 */
export function PoemMeaningQuiz({ poemTitle }: { poemTitle: string }) {
  const quiz = POEM_MEANING_QUIZZES[poemTitle];
  const [picked, setPicked] = useState<number | null>(null);
  if (!quiz) return null;

  const ok = picked === quiz.answer;

  return (
    <div className="mt-3 rounded-2xl p-3 bg-moko-purple/5 border-2 border-moko-purple/15">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🌙</span>
        <span className="font-black text-moko-violet text-sm">诗意小问答</span>
        <button
          onClick={() => void playTtsEnd(quiz.q, 'zh', { wsRate: 0.75, preferStatic: true })}
          className="ml-auto text-xs px-2 py-1 rounded-full bg-moko-purple/10 text-moko-violet font-bold active:scale-95 transition"
        >
          🔊 听问题
        </button>
      </div>
      <div className="text-sm font-bold text-gray-700 mb-2">{quiz.q}</div>
      <div className="grid grid-cols-1 gap-1.5">
        {quiz.options.map((opt, i) => (
          <button
            key={opt}
            disabled={picked !== null && ok}
            onClick={() => {
              setPicked(i);
              if (i === quiz.answer) {
                void playTtsEnd(quiz.explain, 'zh', { wsRate: 0.8, preferStatic: true });
              }
            }}
            className={`text-left px-3 py-2 rounded-xl font-bold text-sm transition active:scale-95 ${
              picked === null
                ? 'bg-white border-2 border-gray-200 hover:border-moko-purple/30'
                : i === quiz.answer
                  ? 'bg-green-100 text-green-700 border-2 border-green-400'
                  : picked === i
                    ? 'bg-red-100 text-red-500 border-2 border-red-300'
                    : 'bg-white border-2 border-gray-200 opacity-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={`mt-2 text-xs rounded-xl p-2 ${ok ? 'bg-green-50 text-green-700' : 'bg-moko-yellow/10 text-gray-600'}`}>
          {ok ? `✅ ${quiz.explain}` : '💡 再想一想，试试别的答案吧～'}
        </div>
      )}
    </div>
  );
}
