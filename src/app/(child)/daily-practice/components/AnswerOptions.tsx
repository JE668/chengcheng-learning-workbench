'use client';

import { MokoPraiseBanner } from '@/components/study/MokoPraise';
import type { PracticeQuestion } from '@/lib/daily-practice';
import { getQuestionSubject } from './practice-meta';

export interface Praise {
  ok: boolean;
  text: string;
}

/** 选项、正误反馈与镇守萌可台词。 */
export function AnswerOptions({
  question,
  selectedIndex,
  praise,
  onChoose,
}: {
  question: PracticeQuestion;
  selectedIndex: number | undefined;
  praise: Praise | null;
  onChoose: (optionIndex: number) => void;
}) {
  const isCorrect = selectedIndex === question.answer;
  const isWrong =
    selectedIndex !== undefined && selectedIndex !== -1 && selectedIndex !== question.answer;
  // 错题重练的选项可能是整句话，太长就改成一行一个、字号调小
  const longOpts = question.options.some((option) => option.length > 6);

  return (
    <>
      <div className={`grid ${longOpts ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        {question.options.map((option, i) => {
          const correct = i === question.answer;
          const picked = selectedIndex === i;
          let cls = 'bg-white/90 text-moko-violet hover:scale-105';
          if (picked && correct)
            cls = 'bg-white text-green-600 font-black scale-105 ring-4 ring-green-300';
          else if (picked && !correct)
            cls = 'bg-red-100 text-red-600 font-black ring-4 ring-red-300';
          else if (isCorrect && correct)
            cls = 'bg-white text-green-600 font-black ring-4 ring-green-300';
          return (
            <button
              key={i}
              onClick={() => onChoose(i)}
              disabled={isCorrect}
              className={`py-4 px-3 rounded-2xl clay-card ${longOpts ? 'text-base leading-snug' : 'text-2xl'} font-black transition transform ${cls}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {isWrong && (
        <p className="text-center text-sm mt-3 bg-moko-yellow/80 text-moko-violet rounded-full py-1">
          没关系，再想想，点一下正确的选项吧～答错可以重选哦！
        </p>
      )}
      {isCorrect && (
        <p className="text-center text-sm mt-3 bg-green-500/80 rounded-full py-1">
          答对啦！{question.explain}
        </p>
      )}

      {/* 镇守萌可反馈：规则提示/解析之外，再给孩子伙伴情绪 */}
      {praise && (
        <MokoPraiseBanner
          subject={getQuestionSubject(question)}
          ok={praise.ok}
          text={praise.text}
        />
      )}
    </>
  );
}
