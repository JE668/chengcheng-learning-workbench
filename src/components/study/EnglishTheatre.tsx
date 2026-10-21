'use client';

import { useMemo, useState } from 'react';
import { playTts, playTtsEnd } from '@/lib/speak';
import { sfxCorrect, sfxWrong } from '@/lib/sfx';
import { DIALOGUE_SCENES } from '@/lib/study-data/english-dialogues';

/**
 * 🎭 萌可英语小剧场（⑤号内容升级 2026-10-21）
 *
 * 一年级口语启蒙：情景三选一。全部台词预生成（en 静态集），
 * 弱网/断网也秒响——英语模块此前只有单词跟读，缺「说句子」场景。
 * 顺序推进 16 课，答对才解锁下一课（简单成就感节奏）。
 */
export function EnglishTheatre() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [rightCount, setRightCount] = useState(0);
  const scene = useMemo(() => DIALOGUE_SCENES[idx] ?? DIALOGUE_SCENES[0], [idx]);
  const finished = idx >= DIALOGUE_SCENES.length;
  const ok = picked === scene.answer;

  if (finished) {
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-xl font-black text-moko-gold mb-1">
          {rightCount === DIALOGUE_SCENES.length ? '全对！你是英语小达人！' : `剧场演完啦！答对 ${rightCount} 课`}
        </div>
        <p className="text-gray-500 text-sm mb-4">明天再来演一遍，口语会越来越棒哦～</p>
        <button
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setRightCount(0);
          }}
          className="px-6 py-2.5 rounded-full bg-moko-yellow text-white font-black clay-btn clay-theme clay-gold transition"
        >
          🔄 再演一遍
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 课进度 */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="font-black text-moko-gold">
          第 {idx + 1}/{DIALOGUE_SCENES.length} 课
        </span>
        <span className="text-gray-400">答对 {rightCount}</span>
      </div>

      {/* 情景卡 */}
      <div className="rounded-3xl p-5 bg-white clay-card clay-theme clay-yellow text-center mb-4">
        <div className="text-5xl mb-2">{scene.emoji}</div>
        <div className="text-sm font-black text-moko-gold mb-2">🎭 {scene.scene}</div>
        {/* 萌可台词：大字英文 + 点击朗读 */}
        <button
          onClick={() => void playTts(scene.mokoLine, 'en', { wsRate: 0.7, preferStatic: true })}
          className="w-full rounded-2xl px-4 py-3 bg-moko-yellow/10 border-2 border-moko-yellow/30 hover:bg-moko-yellow/20 transition"
        >
          <div className="text-lg font-black text-gray-800">“{scene.mokoLine}”</div>
          <div className="text-xs text-gray-400 mt-1">🔊 点我听唱唱萌可说</div>
        </button>
        <div className="text-xs text-gray-400 mt-2">{scene.hint}</div>
      </div>

      {/* 三个回应选项 */}
      <div className="space-y-2">
        {scene.options.map((opt, i) => (
          <button
            key={opt}
            disabled={picked !== null && ok}
            onClick={() => {
              setPicked(i);
              if (i === scene.answer) {
                sfxCorrect();
                try {
                  navigator.vibrate?.(30);
                } catch {}
                setRightCount((c) => c + 1);
                // 答对：朗读孩子选的句子（跟读巩固），然后进下一课
                void playTtsEnd(opt, 'en', { wsRate: 0.7, pauseMs: 400, preferStatic: true }).then(() => {
                  setIdx((n) => n + 1);
                  setPicked(null);
                });
              } else {
                sfxWrong();
                try {
                  navigator.vibrate?.([40, 40, 40]);
                } catch {}
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-base transition active:scale-95 ${
              picked === null
                ? 'bg-white text-gray-700 border-2 border-gray-200 hover:border-moko-yellow/50 clay-card'
                : i === scene.answer
                  ? 'bg-green-100 text-green-700 border-2 border-green-400'
                  : picked === i
                    ? 'bg-red-100 text-red-500 border-2 border-red-300'
                    : 'bg-white text-gray-400 border-2 border-gray-200 opacity-60'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {picked !== null && !ok && (
        <div className="mt-3 text-center text-xs text-gray-500 rounded-xl bg-moko-yellow/10 p-2">
          💡 唱唱萌可说的是「{scene.hint}」——再听听，选合适的回应吧！
        </div>
      )}
    </div>
  );
}
