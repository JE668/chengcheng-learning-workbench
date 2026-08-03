'use client';

import { useMemo } from 'react';
import { WORD_FORM } from '@/lib/study-data';
import { StudyQuiz, type QuizItem } from './StudyQuiz';
import { useModuleProgress } from '@/lib/module-progress';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildItems(): QuizItem[] {
  const items: QuizItem[] = [];
  for (const it of WORD_FORM) {
    // 1) 组词
    items.push({
      prompt: (
        <span>
          给「<b className="text-moko-rose">{it.char}</b>」组一个词，下面哪个对？
        </span>
      ),
      speak: `给${it.char}组一个词，下面哪个对`,
      options: shuffle([it.word, ...it.wrongWords]),
      answer: it.word,
      kind: '组词',
    });
    // 2) 造句
    items.push({
      prompt: (
        <span>
          用「<b className="text-moko-rose">{it.word}</b>」说一句话，哪句说得通？
        </span>
      ),
      speak: `用${it.word}说一句话，哪句说得通`,
      options: shuffle([it.sentenceOk, ...it.sentenceWrong]),
      answer: it.sentenceOk,
      kind: '造句',
    });
  }
  return items;
}

export function WordFormModule() {
  const items = useMemo(buildItems, []);
  const { stars } = useModuleProgress('chinese', 'word-form');
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg text-center">
        <div className="text-4xl mb-1">✍️🌟</div>
        <h2 className="text-2xl font-black">萌可组词造句屋</h2>
        <p className="text-sm opacity-90 mt-1">
          爱心萌可：先给字找个好朋友（组词），再说一句完整的话（造句）！已集 {stars} 颗星
        </p>
      </div>
      <StudyQuiz
        items={items}
        subject="语文"
        color="bg-moko-pink"
        textColor="text-moko-rose"
        autoSpeak="zh"
        moduleKey="word-form"
        roundSize={8}
      />
    </div>
  );
}
