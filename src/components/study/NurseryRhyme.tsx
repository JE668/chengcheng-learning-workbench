'use client';

import { useState } from 'react';
import { NURSERY_RHYMES } from '@/lib/study-data';
import { useModuleProgress } from '@/lib/module-progress';
import { speakZh, praise } from '@/lib/speak';

/**
 * 唱唱萌可的儿歌乐园（语文模块）
 * 对应人教版一上「和大人一起读」：跟读儿歌 → 理解小问答 → 萌可小提示。
 * 唱唱萌可带读，欢欢萌可伴舞，答对得星。
 */
export function NurseryRhymeModule() {
  const { record } = useModuleProgress('chinese', 'nursery-rhymes');
  const [idx, setIdx] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [rightCount, setRightCount] = useState(0);

  const rhyme = NURSERY_RHYMES[idx];

  function readLine(lineIdx: number) {
    setActiveLine(lineIdx);
    speakZh(rhyme.lines[lineIdx].replace(/[「」""]/g, ''), 0.85);
    setTimeout(() => setActiveLine((a) => (a === lineIdx ? null : a)), 1800);
  }

  /** 跟读整首：逐行朗读 */
  function readAll() {
    let delay = 0;
    rhyme.lines.forEach((line, i) => {
      setTimeout(() => {
        setActiveLine(i);
        speakZh(line.replace(/[「」""]/g, ''), 0.85);
        setTimeout(() => setActiveLine((a) => (a === i ? null : a)), 1700);
      }, delay);
      delay += 2200;
    });
  }

  function pickAnswer(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === rhyme.answer) {
      praise();
      setRightCount((c) => c + 1);
      record(Math.min(3, 1 + rightCount));
    } else {
      speakZh('再想一想哦，唱唱萌可相信你！', 0.85);
    }
  }

  function next() {
    setQuizMode(false);
    setPicked(null);
    setIdx((i) => (i + 1) % NURSERY_RHYMES.length);
  }

  function prev() {
    setQuizMode(false);
    setPicked(null);
    setIdx((i) => (i - 1 + NURSERY_RHYMES.length) % NURSERY_RHYMES.length);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-yellow to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎵😄</div>
        <h2 className="text-2xl font-black">唱唱萌可的儿歌乐园</h2>
        <p className="text-sm opacity-90 mt-1">
          唱唱萌可：啦啦啦，唱给世界听！点一点，跟我一起念儿歌吧！ 欢欢萌可：笑一个嘛，嘿嘿！
        </p>
      </div>

      {/* 儿歌卡片 */}
      <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-yellow/40">
        <div className="text-center mb-3">
          <div className="text-4xl">{rhyme.emoji}</div>
          <h3 className="text-xl font-black text-moko-pink mt-1">《{rhyme.title}》</h3>
          <p className="text-xs text-gray-400">第 {idx + 1} 首 · 共 {NURSERY_RHYMES.length} 首</p>
          <button
            onClick={readAll}
            className="mt-2 px-4 py-1.5 rounded-full bg-moko-yellow text-white font-bold text-sm shadow active:scale-95 transition"
          >
            🎤 唱给我听
          </button>
        </div>

        <div className="rounded-2xl bg-moko-yellow/10 border-2 border-moko-yellow/30 p-4 space-y-2">
          {rhyme.lines.map((line, i) => (
            <button
              key={i}
              onClick={() => readLine(i)}
              className={`w-full text-left px-3 py-2 rounded-xl transition font-medium ${
                activeLine === i
                  ? 'bg-moko-yellow text-white shadow scale-[1.01]'
                  : 'bg-white text-gray-700 hover:bg-moko-yellow/20'
              }`}
            >
              {line}
            </button>
          ))}
        </div>
      </div>

      {/* 理解小问答 */}
      {!quizMode ? (
        <button
          onClick={() => setQuizMode(true)}
          className="w-full py-3 rounded-2xl bg-moko-pink text-white font-black shadow-lg active:scale-[0.98] transition text-lg"
        >
          🧠 读完了？答个小问题！
        </button>
      ) : (
        <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-pink/30">
          <p className="font-black text-moko-pink mb-1">欢欢萌可的小问题：</p>
          <p className="text-gray-700 font-bold mb-3">{rhyme.question}</p>
          <div className="grid gap-2">
            {rhyme.options.map((opt) => {
              const isAnswer = opt === rhyme.answer;
              const state = picked
                ? isAnswer
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : opt === picked
                    ? 'bg-red-100 border-red-300 text-red-500'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-white border-moko-pink/40 hover:bg-moko-pink/5';
              return (
                <button
                  key={opt}
                  disabled={!!picked}
                  onClick={() => pickAnswer(opt)}
                  className={`px-4 py-2.5 rounded-xl border-2 font-bold text-left transition ${state}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className="mt-4 rounded-2xl bg-moko-yellow/15 p-3 text-sm">
              <p className="font-bold text-moko-pink mb-1">💡 唱唱萌可的小提示：</p>
              <p className="text-gray-600">{rhyme.tip}</p>
            </div>
          )}
        </div>
      )}

      {/* 切换按钮 */}
      <div className="flex justify-center gap-3">
        <button
          onClick={prev}
          className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition"
        >
          ⬅️ 上一首
        </button>
        <button
          onClick={next}
          className="px-5 py-2 rounded-full bg-moko-pink text-white font-bold text-sm active:scale-95 transition"
        >
          下一首 ➡️
        </button>
      </div>
    </div>
  );
}