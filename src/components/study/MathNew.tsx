'use client';

import { useRef, useState } from 'react';
import {
  WORD_PROBLEMS,
  ORDINALS,
  CLOCK_HALF,
  COMPARE_MORE,
  WEEK_CALENDAR,
  type OrdinalItem,
  type ClockHalfItem,
} from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
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

/* ========================================================================
 * 数学应用题（20 以内加减）
 * ===================================================================== */
export function MathWordProblemModule() {
  const items: QuizItem[] = WORD_PROBLEMS.map((p) => ({
    prompt: (
      <span>
        {p.emoji} {p.text}
      </span>
    ),
    speak: p.text,
    options: p.options,
    answer: p.answer,
    kind: '应用题',
  }));
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" moduleKey="word-problem" />;
}

/* ========================================================================
 * 序数（第1~第N / 排队）
 * ===================================================================== */
export function OrdinalModule() {
  const items: QuizItem[] = ORDINALS.map((o: OrdinalItem) => {
    const ordinals = Array.from({ length: o.row.length }, (_, i) => `第${i + 1}`);
    return {
      prompt: (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {o.row.map((e, i) => (
              <span key={i} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-moko-blue/10 text-3xl">
                {e}
              </span>
            ))}
          </div>
          <div className="font-black text-moko-blue">
            {o.question}
          </div>
        </div>
      ),
      speak: o.question,
      options: ordinals,
      answer: o.answer,
      kind: '序数',
    };
  });
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" moduleKey="ordinal" />;
}

/* ========================================================================
 * 钟表半时（分针指 6）
 * ===================================================================== */
function ClockHalfFace({ hour }: { hour: number }) {
  const cx = 60;
  const cy = 60;
  const hand = (angleDeg: number, len: number, width: number, color: string) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return (
      <line
        x1={cx}
        y1={cy}
        x2={cx + len * Math.cos(a)}
        y2={cy + len * Math.sin(a)}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return (
      <line
        key={i}
        x1={cx + 52 * Math.cos(a)}
        y1={cy + 52 * Math.sin(a)}
        x2={cx + 46 * Math.cos(a)}
        y2={cy + 46 * Math.sin(a)}
        stroke="#94a3b8"
        strokeWidth={2}
      />
    );
  });
  return (
    <svg viewBox="0 0 120 120" className="w-44 h-44 mx-auto">
      <circle cx={cx} cy={cy} r={54} fill="#fff" stroke="#cbd5e1" strokeWidth={3} />
      {ticks}
      {/* 分针指向 6（30 分） */}
      {hand(180, 40, 4, '#334155')}
      {/* 时针在 hour 与 hour+1 之间（半时） */}
      {hand(hour * 30 + 15, 26, 6, '#ef4444')}
      <circle cx={cx} cy={cy} r={4} fill="#334155" />
    </svg>
  );
}

export function ClockHalfModule() {
  const items: QuizItem[] = CLOCK_HALF.map((c) => ({
    prompt: (
      <div className="space-y-3">
        <ClockHalfFace hour={c.hour} />
        <div className="font-black text-moko-cyan">现在几点半？</div>
      </div>
    ),
    speak: `现在是${c.label}`,
    options: shuffle(CLOCK_HALF.map((x) => x.label).filter((x) => x !== c.label)).slice(0, 3).concat([c.label]),
    answer: c.label,
    kind: '钟表半时',
  }));
  return <StudyQuiz items={items} subject="数学" color="bg-moko-cyan" textColor="text-moko-cyan" autoSpeak="zh" moduleKey="clock-half" roundSize={6} />;
}

/* ========================================================================
 * 比轻重 / 比长短
 * ===================================================================== */
export function CompareMoreModule() {
  const items: QuizItem[] = COMPARE_MORE.map((c) => ({
    prompt: (
      <div className="flex items-center justify-center gap-4">
        <span className="text-6xl">{c.a}</span>
        <span className="text-2xl text-gray-400">VS</span>
        <span className="text-6xl">{c.b}</span>
      </div>
    ),
    speak: c.question,
    options: c.options,
    answer: c.answer,
    kind: '比一比',
  }));
  return <StudyQuiz items={items} subject="数学" color="bg-moko-cyan" textColor="text-moko-cyan" autoSpeak="zh" moduleKey="compare-more" />;
}

/* ========================================================================
 * 星期 / 日历 / 天气
 * ===================================================================== */
export function CalendarModule() {
  const items: QuizItem[] = WEEK_CALENDAR.map((c) => ({
    prompt: (
      <span>
        {c.emoji} {c.question}
      </span>
    ),
    speak: c.question,
    options: c.options,
    answer: c.answer,
    kind: '星期日历',
  }));
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" moduleKey="calendar" />;
}
