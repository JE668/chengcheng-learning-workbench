'use client';

import { CVC_WORDS, EN_SENTENCES } from '@/lib/study-data';
import { StudyQuiz, type QuizItem } from './StudyQuiz';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========================================================================
 * 英语自然拼读（CVC：听音 + 看字母音 选图片）
 * ===================================================================== */
export function EnglishPhonicsModule() {
  const items: QuizItem[] = CVC_WORDS.map((c) => {
    const others = shuffle(CVC_WORDS.filter((x) => x.word !== c.word))
      .slice(0, 3)
      .map((x) => x.emoji);
    return {
      prompt: (
        <div className="space-y-1">
          <div className="text-3xl font-black text-moko-violet tracking-[0.2em]">{c.sound}</div>
          <div className="text-xs text-gray-400">听一听，选出对应的图</div>
        </div>
      ),
      speakEn: c.word,
      options: shuffle([c.emoji, ...others]),
      answer: c.emoji,
      kind: '自然拼读',
    };
  });
  return <StudyQuiz items={items} subject="英语" color="bg-moko-yellow" textColor="text-moko-violet" autoSpeak="en" />;
}

/* ========================================================================
 * 英语常见句型（选词填空）
 * ===================================================================== */
export function EnglishSentenceModule() {
  const items: QuizItem[] = EN_SENTENCES.map((s) => {
    const parts = s.sentence.split('___');
    return {
      prompt: (
        <div className="text-2xl font-black text-moko-violet leading-relaxed">
          {parts[0]}
          <span className="inline-block min-w-[3rem] border-b-4 border-moko-yellow mx-1 align-middle">&nbsp;</span>
          {parts[1]}
        </div>
      ),
      speakEn: s.speak,
      options: s.options,
      answer: s.answer,
      kind: '英语句型',
    };
  });
  return <StudyQuiz items={items} subject="英语" color="bg-moko-violet" textColor="text-moko-violet" autoSpeak="en" />;
}
