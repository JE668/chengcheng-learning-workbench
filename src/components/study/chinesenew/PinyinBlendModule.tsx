'use client';

import { useState, useMemo } from 'react';
import { PINYIN_BLEND, type PinyinBlendItem } from '@/lib/study-data/pinyin';
import { speakZh, speakPinyin } from '@/lib/speak';

import { StudyQuiz, type QuizItem } from '../StudyQuiz';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========================================================================
 * 拼音拼读（声母 + 单韵母 拼一拼）
 * ===================================================================== */
export function PinyinBlendModule() {
  const [idx, setIdx] = useState(0);
  const b: PinyinBlendItem = PINYIN_BLEND[idx % PINYIN_BLEND.length];

  const quizItems = useMemo<QuizItem[]>(
    () =>
      PINYIN_BLEND.map((x) => {
        const others = shuffle(PINYIN_BLEND.filter((y) => y.syllable !== x.syllable))
          .slice(0, 3)
          .map((y) => y.syllable);
        return {
          prompt: (
            <span>
              <b>{x.sheng}</b> 和 <b>{x.yun}</b> 拼成什么音节？
            </span>
          ),
          options: shuffle([x.syllable, ...others]),
          answer: x.syllable,
          kind: '拼音拼读',
        };
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg text-center">
        <p className="text-sm opacity-90 mb-3">把声母和韵母拼在一起，读一读～</p>
        <div className="flex items-center justify-center gap-3 text-4xl font-black">
          <div className="w-20 h-20 rounded-2xl bg-white/25 flex items-center justify-center">
            {b.sheng}
          </div>
          <span className="opacity-80">+</span>
          <div className="w-20 h-20 rounded-2xl bg-white/25 flex items-center justify-center">
            {b.yun}
          </div>
          <span className="opacity-80">→</span>
          <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-moko-rose">
            {b.syllable}
          </div>
        </div>
        <div className="mt-3 text-2xl font-black">
          {b.emoji} 例字：{b.word}
        </div>
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <button
            onClick={() => speakPinyin(b.syllable, 0, b.word)}
            className="px-4 py-2 rounded-full bg-white text-moko-rose font-bold text-sm active:scale-95 transition"
          >
            🔊 听拼读
          </button>
          <button
            onClick={() => speakZh(b.word)}
            className="px-4 py-2 rounded-full bg-white/30 font-bold text-sm active:scale-95 transition"
          >
            🔊 听例字
          </button>
          <button
            onClick={() => setIdx((i) => i - 1 + PINYIN_BLEND.length)}
            className="px-4 py-2 rounded-full bg-white/20 font-bold text-sm active:scale-95 transition"
          >
            ‹ 上一个
          </button>
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="px-4 py-2 rounded-full bg-white/20 font-bold text-sm active:scale-95 transition"
          >
            下一个 ›
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black text-moko-violet mb-2">🎯 拼读小考场</h3>
        <StudyQuiz
          items={quizItems}
          subject="语文"
          color="bg-moko-pink"
          textColor="text-moko-rose"
          moduleKey="pinyin-blend"
        />
      </div>
    </div>
  );
}

/* ========================================================================
 * 笔顺（hanzi-writer 动画演示）
 * ===================================================================== */