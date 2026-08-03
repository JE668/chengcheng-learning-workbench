'use client';

import { useState } from 'react';
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
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" />;
}

/* ========================================================================
 * 序数（第1~第N / 排队）
 * ===================================================================== */
export function OrdinalModule() {
  const items: QuizItem[] = ORDINALS.map((o: OrdinalItem) => {
    const ordinals = Array.from({ length: o.row.length }, (_, i) => `第${i + 1}`);
    return {
      prompt: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {o.row.map((e, i) => (
              <span key={i} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-moko-blue/10 text-3xl">
                {e}
              </span>
            ))}
          </div>
          <div className="font-black text-moko-blue">
            {o.question}（从左边数哦）
          </div>
        </div>
      ),
      speak: o.question,
      options: ordinals,
      answer: o.answer,
      kind: '序数',
    };
  });
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" />;
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
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const logM = useMistakeLogger();
  const current: ClockHalfItem = CLOCK_HALF[idx % CLOCK_HALF.length];
  const choices = shuffle(CLOCK_HALF.map((c) => c.label)).slice(0, 4);
  if (!choices.includes(current.label)) choices[0] = current.label;

  function choose(label: string) {
    if (picked) return;
    setPicked(label);
    const ok = label === current.label;
    speakZh(ok ? '答对啦！' : `现在是 ${current.label}`);
    if (ok) {
      setTimeout(() => {
        setPicked(null);
        setIdx((i) => i + 1);
      }, 1200);
    } else {
      logM({ subject: '数学', kind: '认识钟表', prompt: '现在是几点半？', answer: current.label, wrong: label });
      setTimeout(() => setPicked(null), 1500);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-cyan/30">
        <ClockHalfFace hour={current.hour} />
        <div className="text-center text-lg font-black text-moko-cyan mt-2">{current.emoji} 现在几点半？</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {choices.map((label) => {
            const isAnswer = label === current.label;
            const isPicked = label === picked;
            let cls = 'bg-white text-moko-cyan border-2 border-moko-cyan';
            if (picked) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = 'bg-white text-moko-cyan border-2 border-moko-cyan opacity-60';
            }
            return (
              <button
                key={label}
                disabled={!!picked}
                onClick={() => choose(label)}
                className={`py-3 rounded-xl font-black text-2xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-sm text-gray-500">分针指着 6，时针走过几，就是几点半。</p>
    </div>
  );
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
  return <StudyQuiz items={items} subject="数学" color="bg-moko-cyan" textColor="text-moko-cyan" autoSpeak="zh" />;
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
  return <StudyQuiz items={items} subject="数学" color="bg-moko-blue" textColor="text-moko-blue" autoSpeak="zh" />;
}
