'use client';

import { ClockFace } from '@/components/study/ClockFace';
import type { PracticeQuestion } from '@/lib/daily-practice';
import { playTts } from '@/lib/speak';

const QUIZ_ICONS = {
  'chinese-quiz': '💡',
  antonym: '🔄',
  proverb: '📜',
  riddle: '🧩',
} as const;

/** 渲染不同题型的题干、图示和听题入口。 */
export function QuestionPrompt({ question: q }: { question: PracticeQuestion }) {
  return (
    <div className="text-center mb-4">
      {q.kind === 'pinyin' && (
        <>
          <div className="text-6xl font-black mb-2">{q.han}</div>
          <button
            onClick={() => playTts(q.audioText, 'zh', { wsRate: 0.6, pauseMs: 300 })}
            className="text-sm bg-white/30 rounded-full px-3 py-1"
          >
            🔊 听一听
          </button>
        </>
      )}
      {q.kind === 'dictation' && (
        <>
          <div className="text-6xl font-black mb-2">✍️</div>
          <button
            onClick={() => playTts(q.han, 'zh', { wsRate: 0.6, pauseMs: 300 })}
            className="text-sm bg-white/30 rounded-full px-4 py-1.5"
          >
            🔊 听写 · 再听一遍
          </button>
        </>
      )}
      {/* 识字 / 反义词 / 谚语 / 谜语：题干就是问题本身，头部只放图标；
          刻意不放朗读按钮，因为这几类的 han 是答案或无需朗读。 */}
      {q.kind in QUIZ_ICONS && (
        <div className="text-6xl font-black mb-2">
          {QUIZ_ICONS[q.kind as keyof typeof QUIZ_ICONS]}
        </div>
      )}
      {q.kind === 'math' && (
        <>
          {q.clockHour !== undefined && (
            <ClockFace hour={q.clockHour} half={q.clockHalf ?? false} />
          )}
          {/* 序数题：显示 emoji 行（不加序号，让孩子自己数） */}
          {q.emojiRow && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {q.emojiRow.map((e, i) => (
                <span
                  key={i}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-sm"
                >
                  {e}
                </span>
              ))}
            </div>
          )}
          <div className="text-5xl font-black">{q.prompt}</div>
        </>
      )}
      {q.kind === 'poem' && <div className="text-2xl font-black leading-relaxed">{q.prompt}</div>}
      {q.kind === 'english' && (
        <>
          <div className="text-6xl mb-2">{q.emoji}</div>
          {q.subtype !== 'initial' && q.cn && <div className="text-sm opacity-80 mb-1">{q.cn}</div>}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => playTts(q.word, 'en')}
              className="text-sm bg-white/30 rounded-full px-3 py-1"
            >
              🔊 听一听
            </button>
            <button
              onClick={() => playTts(q.word, 'en')}
              className="text-sm bg-moko-pink/30 rounded-full px-3 py-1"
            >
              🎙️ 跟读
            </button>
          </div>
        </>
      )}
      {q.kind === 'mistake' && (
        <>
          <div className="text-4xl mb-2">😈</div>
          <div className="inline-block text-xs bg-white/25 px-3 py-1 rounded-full mb-2">
            {q.origin} · 捣蛋萌可把这个知识点弄乱了，把它送回家！
          </div>
          <div className="text-2xl font-black leading-snug">{q.prompt}</div>
          {q.speakText && (
            <button
              onClick={() => playTts(q.speakText as string, 'zh', { wsRate: 0.7 })}
              className="mt-2 text-sm bg-white/30 rounded-full px-3 py-1"
            >
              🔊 听一听
            </button>
          )}
        </>
      )}
      {q.kind !== 'mistake' && <p className="text-sm opacity-90 mt-3">{q.prompt}</p>}
    </div>
  );
}
