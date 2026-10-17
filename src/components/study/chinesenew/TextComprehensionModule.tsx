'use client';

import { useMemo } from 'react';
import { READING_PASSAGES } from '@/lib/study-data/texts';
import { StudyQuiz, type QuizItem } from '../StudyQuiz';

export function TextComprehensionModule() {
  const items = useMemo<QuizItem[]>(
    () =>
      READING_PASSAGES.map((p) => ({
        prompt: (
          <div className="space-y-2">
            <div className="text-base bg-moko-purple/5 rounded-xl p-3 text-gray-700 leading-relaxed">
              📖 {p.passage}
            </div>
            <div className="font-black text-moko-violet">
              {p.emoji} {p.question}
            </div>
          </div>
        ),
        speak: p.question,
        options: p.options,
        answer: p.answer,
        kind: '阅读理解',
        chapter: p.chapter,
      })),
    []
  );
  return (
    <StudyQuiz
      items={items}
      subject="语文"
      color="bg-moko-purple"
      textColor="text-moko-purple"
      autoSpeak="zh"
      moduleKey="reading"
    />
  );
}

/* ========================================================================
 * 连词成句（造句）
 * ===================================================================== */