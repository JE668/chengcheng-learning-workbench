'use client';

import { useState } from 'react';
import {
  POSITIONS,
  SOLID_SHAPES,
  NUMBERS_1120,
  CLOCKS,
  type PositionItem,
  type SolidShapeItem,
  type ClockItem,
} from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 位置（上下前后左右） ---------- */
export function PositionModule() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const item: PositionItem = POSITIONS[idx % POSITIONS.length];
  const blank = item.example.replace(item.word, '（　）');
  const options = shuffle(POSITIONS.map((p) => p.word));
  const logM = useMistakeLogger();

  function choose(w: string) {
    if (picked) return;
    setPicked(w);
    const ok = w === item.word;
    speakZh(ok ? '答对啦！' : `应该是「${item.word}」`);
    if (ok) {
      setTimeout(() => {
        setPicked(null);
        setIdx((i) => i + 1);
      }, 1200);
    } else {
      logM({ subject: '数学', kind: '位置', prompt: blank, answer: item.word, wrong: w });
      setTimeout(() => setPicked(null), 1500);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {POSITIONS.map((p) => (
          <button
            key={p.word}
            onClick={() => speakZh(`${p.word}，${p.desc}。${p.example}`)}
            className="rounded-2xl p-3 bg-gradient-to-br from-moko-blue to-sky-300 text-white shadow text-center active:scale-95 transition"
          >
            <div className="text-3xl">{p.emoji}</div>
            <div className="text-xl font-black">{p.word}</div>
            <div className="text-[10px] opacity-90">{p.desc}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20 text-center">
        <div className="text-2xl font-black text-moko-blue mb-1">{blank}</div>
        <div className="text-sm text-gray-500 mb-3">选一个字填进去～</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {options.map((w) => {
            const isAnswer = w === item.word;
            const isPicked = w === picked;
            let cls = 'bg-white text-moko-blue border-2 border-moko-blue';
            if (picked) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = 'bg-white text-moko-blue border-2 border-moko-blue opacity-60';
            }
            return (
              <button
                key={w}
                disabled={!!picked}
                onClick={() => choose(w)}
                className={`py-3 rounded-xl font-black text-2xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 认识图形（立体图形） ---------- */
export function SolidShapeModule() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const target = SOLID_SHAPES[idx % SOLID_SHAPES.length];
  const options = shuffle(SOLID_SHAPES.map((s) => s.name));
  const logM = useMistakeLogger();

  function choose(name: string) {
    if (picked) return;
    setPicked(name);
    const ok = name === target.name;
    speakZh(ok ? '答对啦！' : `不对哦，这是${target.name}`);
    if (ok) {
      setTimeout(() => {
        setPicked(null);
        setIdx((i) => i + 1);
      }, 1200);
    } else {
      logM({ subject: '数学', kind: '立体图形', prompt: '找出' + target.name, answer: target.name, wrong: name });
      setTimeout(() => setPicked(null), 1500);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SOLID_SHAPES.map((s) => (
          <button
            key={s.name}
            onClick={() => speakZh(`${s.name}，${s.desc}。${s.roll}。`)}
            className="rounded-2xl p-4 bg-gradient-to-br from-moko-mint to-emerald-300 text-white shadow text-center active:scale-95 transition"
          >
            <div className="text-5xl mb-1">{s.emoji}</div>
            <div className="text-xl font-black">{s.name}</div>
            <div className="text-xs opacity-90 mt-1">{s.desc}</div>
            <div className="text-xs opacity-80">{s.roll}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-mint/30 text-center">
        <div className="text-lg font-bold text-moko-mint mb-3">小测验：点一点「{target.name}」</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {options.map((name) => {
            const isAnswer = name === target.name;
            const isPicked = name === picked;
            let cls = 'bg-white text-moko-mint border-2 border-moko-mint';
            if (picked) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = 'bg-white text-moko-mint border-2 border-moko-mint opacity-60';
            }
            return (
              <button
                key={name}
                disabled={!!picked}
                onClick={() => choose(name)}
                className={`py-4 rounded-xl font-black text-xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 11~20 各数的认识 ---------- */
export function Numbers1120Module() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {NUMBERS_1120.map((n) => (
        <button
          key={n.num}
          onClick={() => speakZh(`${n.num}，${n.compose}，也就是 1 个十和 ${n.ones} 个一`)}
          className="rounded-2xl p-4 bg-gradient-to-br from-moko-blue to-indigo-300 text-white shadow text-center active:scale-95 transition"
        >
          <div className="text-4xl font-black">{n.num}</div>
          <div className="text-xs opacity-90 mt-1">1 个十 + {n.ones} 个一</div>
          <div className="text-[10px] opacity-80">{n.compose}</div>
        </button>
      ))}
    </div>
  );
}

/* ---------- 认识钟表（整时） ---------- */
function ClockFace({ hour }: { hour: number }) {
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
      {/* 分针指向 12 */}
      {hand(0, 38, 4, '#334155')}
      {/* 时针指向 hour */}
      {hand(hour * 30, 26, 6, '#ef4444')}
      <circle cx={cx} cy={cy} r={4} fill="#334155" />
    </svg>
  );
}

export function ClockModule() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const logM = useMistakeLogger();
  const current: ClockItem = CLOCKS[idx % CLOCKS.length];
  const choices = shuffle(CLOCKS.map((c) => c.label)).slice(0, 4);
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
      logM({ subject: '数学', kind: '认识钟表', prompt: '现在是几点？', answer: current.label, wrong: label });
      setTimeout(() => setPicked(null), 1500);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20">
        <ClockFace hour={current.hour} />
        <div className="text-center text-lg font-black text-moko-blue mt-2">{current.emoji} 现在几点？</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {choices.map((label) => {
            const isAnswer = label === current.label;
            const isPicked = label === picked;
            let cls = 'bg-white text-moko-blue border-2 border-moko-blue';
            if (picked) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = 'bg-white text-moko-blue border-2 border-moko-blue opacity-60';
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
      <p className="text-center text-sm text-gray-500">分针指着 12，时针指着几，就是几时。</p>
    </div>
  );
}
