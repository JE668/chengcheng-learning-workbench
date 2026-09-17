'use client';

import { useState, useEffect, useRef } from 'react';
import { WRITING_TIPS } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function WritingTraceModule() {
  const { record } = useModuleProgress('chinese', 'writing-trace');
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [streak, setStreak] = useState(0);
  const item = WRITING_TIPS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  function playChar() {
    speakZh(item.char);
  }

  function nextStep() {
    if (step < 1) {
      setStep(step + 1);
    } else {
      // Mark done
      praise();
      setStreak((s) => s + 1);
      nextChar();
    }
  }

  function nextChar() {
    setIdx((i) => (i + 1) % WRITING_TIPS.length);
    setStep(0);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-cyan to-moko-blue text-white shadow-lg text-center">
        <div className="text-4xl mb-1">✍️✨</div>
        <h2 className="text-2xl font-black">书写描红</h2>
        <p className="text-sm opacity-90 mt-1">甜甜萌可：在田字格里跟着写一写，记住笔顺规则！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-cyan/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <h3 className="text-xl font-black text-moko-cyan">「{item.char}」字</h3>
              <p className="text-sm text-gray-400">{item.rule}</p>
            </div>
          </div>
          <button
            onClick={playChar}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-bold text-sm hover:scale-105 transition"
          >
            🔊 听
          </button>
        </div>

        {/* 田字格 */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="relative">
            <div className="w-48 h-48 rounded-xl border-4 border-moko-cyan/30 bg-white relative overflow-hidden">
              {/* 田字格虚线 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-moko-cyan/20" />
                <div className="h-full w-px bg-moko-cyan/20 absolute" />
              </div>
              {/* 对角虚线 */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[141%] h-px bg-moko-cyan/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                <div className="absolute w-[141%] h-px bg-moko-cyan/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
              </div>
              {/* 字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-72px font-black ${step === 0 ? 'text-gray-300' : 'text-moko-cyan'}`}>
                  {item.char}
                </span>
              </div>
            </div>
          </div>
          <div className="w-48 h-48 rounded-xl border-4 border-dashed border-moko-yellow/50 bg-moko-yellow/5 flex items-center justify-center">
            <span className={`text-72px font-black ${step === 0 ? 'text-moko-yellow/20' : 'text-moko-yellow'}`}>
              {item.char}
            </span>
          </div>
        </div>

        <div className="rounded-xl p-3 bg-gradient-to-r from-moko-yellow/10 to-moko-orange/10 border border-moko-yellow/30 mb-4 text-sm text-gray-600">
          <span className="font-bold">💡 {item.tip}</span>
        </div>

        <button
          onClick={nextStep}
          className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black hover:scale-105 transition"
        >
          {step === 0 ? '👀 观察笔顺 →' : '✏️ 描红完成 →'}
        </button>
        <div className="mt-2 text-xs text-gray-400 text-center">
          已练习 <span className="font-bold text-moko-green">{streak}</span> / {WRITING_TIPS.length} 字 · 进度 {idx + 1}/{WRITING_TIPS.length}
        </div>
      </div>
    </div>
  );
}