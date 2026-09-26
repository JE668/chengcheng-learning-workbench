'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { VerticalCalculation } from './VerticalCalculation';
import type { Operator } from '@/lib/algorithm/types';

/**
 * 典型例题「引导式分步演示」
 *
 * 教学节奏（参考一年级/奥数课堂的提问引导法）：
 * 1. 一次只亮一步，前面的步骤淡显回顾 → 孩子不会被满屏信息淹没；
 * 2. 「拆数」步骤变成互动小提问：先让孩子自己点出答案（如 9 的好朋友是 1，
 *    5 拆成 1 和 4），点对了才展开分解气泡图；
 * 3. 「算一算」步骤每一步都是**一个独立的小竖式**（含进位/退位标记与图例），
 *    而不是一行文字；
 * 4. 竖式下方带图例说明：黄色①=进位、划线+红点=借位，照课本写法标注。
 */

// ── 视觉元素 ────────────────────────────────────────────────

function Num({ n, tone, big }: { n: string | number; tone: 'gray' | 'purple' | 'green' | 'orange' | 'blue' | 'red'; big?: boolean }) {
  const cls = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    purple: 'bg-moko-purple/15 text-moko-purple border-moko-purple/40',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    orange: 'bg-orange-100 text-orange-600 border-orange-300',
    blue: 'bg-moko-blue/10 text-moko-blue border-moko-blue/40',
    red: 'bg-red-100 text-red-600 border-red-300',
  }[tone];
  const size = big ? 'min-w-12 h-12 px-3 text-2xl rounded-2xl' : 'min-w-9 h-9 px-2 text-xl rounded-xl';
  return (
    <span className={`inline-flex items-center justify-center border-2 font-black ${size} ${cls}`}>{n}</span>
  );
}

function Op({ o }: { o: string }) {
  return <span className="text-xl font-black text-moko-purple px-0.5">{o}</span>;
}

/** 「X = A 和 B」分解气泡图（数字妈妈抱两个宝宝） */
function SplitDiagram({ x, a, b }: { x: number; a: number; b: number }) {
  return (
    <div className="flex flex-col items-center gap-0 py-1">
      <Num n={x} tone="purple" big />
      <svg width="96" height="18" viewBox="0 0 96 18" className="text-moko-purple/50" aria-hidden>
        <path d="M48 2 L24 16 M48 2 L72 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex items-center gap-3">
        <Num n={a} tone="orange" big />
        <span className="text-gray-400 font-black text-xl">和</span>
        <Num n={b} tone="blue" big />
      </div>
    </div>
  );
}

/** 竖式 + 标注图例 */
function VerticalWithLegend({ a, b, op, answer }: { a: number; b: number; op: '+' | '-'; answer: number }) {
  const carry = op === '+' && (a % 10) + (b % 10) >= 10;
  const borrow = op === '-' && (a % 10) < (b % 10);
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <VerticalCalculation a={a} b={b} operator={op} answer={answer} showCarry />
      {(carry || borrow) && (
        <div className="text-xs text-gray-500 font-bold space-y-0.5 bg-white/70 rounded-xl px-3 py-1.5 border border-gray-200">
          {carry && <div><span className="text-orange-500">🟡 小「1」</span>：个位满 10，向十位进 1</div>}
          {borrow && <div><span className="text-red-500">🔴 划线+红点</span>：个位不够减，向十位借 1 当 10</div>}
        </div>
      )}
    </div>
  );
}

// ── 步骤解析 ────────────────────────────────────────────────

type Step =
  | { kind: 'split'; x: number; a: number; b: number; text: string }
  | { kind: 'calc'; a: number; op: '+' | '-'; b: number; r: number; lead: string }
  | { kind: 'text'; text: string };

function parseSteps(solution: string[]): Step[] {
  return solution.map((raw) => {
    const sm = raw.match(/把\s*(\d+)\s*拆成\s*[「"]?(\d+)\s*和\s*(\d+)[」"]?/);
    if (sm) return { kind: 'split', x: Number(sm[1]), a: Number(sm[2]), b: Number(sm[3]), text: raw };
    // 纯算式步骤（主体就是 a op b = c），附带的说明文字拆出来当导读
    const cm = raw.match(/([^：:]*?[：:])?\s*(\d+)\s*([+\-])\s*(\d+)\s*=\s*(\d+)\s*✅?\s*$/);
    if (cm) {
      return {
        kind: 'calc',
        a: Number(cm[2]),
        op: cm[3] as '+' | '-',
        b: Number(cm[4]),
        r: Number(cm[5]),
        lead: (cm[1] ?? '').replace(/[：:]\s*$/, ''),
      };
    }
    return { kind: 'text', text: raw };
  });
}

// ── 互动小提问：拆数 ────────────────────────────────────────

function SplitQuiz({ step, onSolved }: { step: Extract<Step, { kind: 'split' }>; onSolved: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const options = useMemo(() => {
    // 正确项 + 相邻干扰项（保证在 [0, x] 内、去重、最多 4 个）
    const set = new Set<number>([step.a]);
    for (const d of [1, 2]) {
      if (step.a - d >= 0) set.add(step.a - d);
      if (step.a + d <= step.x) set.add(step.a + d);
    }
    return [...set].sort((m, n) => m - n).slice(0, 4);
  }, [step]);

  const solved = picked === step.a;
  return (
    <div className="mt-1 space-y-2">
      {!solved ? (
        <div className="bg-white/80 rounded-2xl p-3 border-2 border-moko-purple/15">
          <div className="text-sm font-black text-moko-purple mb-2">
            🤔 动动脑：{step.x} 可以拆成 <span className="text-orange-500">?</span> 和 {step.b}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Num n={step.x} tone="purple" big />
            <span className="text-xl font-black text-gray-400">=</span>
            <span className="min-w-12 h-12 px-3 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50 text-2xl font-black text-orange-400 inline-flex items-center justify-center">?</span>
            <span className="text-xl font-black text-gray-400">和</span>
            <Num n={step.b} tone="blue" big />
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  if (o === step.a) { setPicked(o); onSolved(); }
                  else { setWrong(o); setTimeout(() => setWrong(null), 600); }
                }}
                className={`min-w-12 h-12 px-3 rounded-2xl border-2 text-2xl font-black transition active:scale-95 ${
                  wrong === o
                    ? 'bg-red-100 border-red-300 text-red-500 animate-pulse'
                    : 'bg-moko-yellow/15 border-moko-yellow/60 text-gray-800 hover:bg-moko-yellow/30'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2 font-bold">点一点正确的数字 👆</div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-black text-emerald-600">🎉 对啦！{step.x} 可以拆成 {step.a} 和 {step.b}</div>
          <SplitDiagram x={step.x} a={step.a} b={step.b} />
        </div>
      )}
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────

export function ExampleDemo({ problem, solution }: { problem: string; solution: string[] }) {
  // 严格匹配「a ± b = ?」的两数题，三数连加（如 27 + 36 + 13）不出总结竖式
  const pm = problem.match(/^\s*(\d+)\s*([+\-])\s*(\d+)\s*=\s*\?\s*$/);
  const mainOp = pm ? (pm[2] as '+' | '-') : null;
  const mainA = pm ? Number(pm[1]) : 0;
  const mainB = pm ? Number(pm[3]) : 0;
  const mainAnswer = mainOp === '+' ? mainA + mainB : mainOp === '-' ? mainA - mainB : null;

  const steps = useMemo(() => parseSteps(solution), [solution]);
  const [revealed, setRevealed] = useState(0); // 已展开到第几步
  const [solvedSplits, setSolvedSplits] = useState<Set<number>>(new Set());

  const stepNeedsAnswer = (i: number) => steps[i].kind === 'split' && !solvedSplits.has(i);
  const allDone = revealed >= steps.length - 1 && !stepNeedsAnswer(steps.length - 1);

  return (
    <div className="space-y-4">
      {/* 整题 */}
      <div className="text-center">
        <div className="text-3xl font-black text-moko-purple">{problem}</div>
        <div className="text-xs text-gray-400 font-bold mt-1">
          👇 跟着萌可一步一步来，答对小问题就能看到下一步
        </div>
      </div>

      {/* 分步：每一步一张卡片，逐步展开 */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          if (i > revealed) return null;
          const isCurrent = i === revealed && !allDone;
          const locked = stepNeedsAnswer(i);
          return (
            <div
              key={i}
              className={`rounded-2xl p-3 border-2 transition ${
                isCurrent
                  ? 'bg-white border-moko-purple/40 shadow-md'
                  : 'bg-moko-purple/5 border-moko-purple/10 opacity-90'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5 ${
                  isCurrent ? 'bg-moko-purple text-white' : 'bg-moko-purple/40 text-white'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {/* 拆分步骤：先互动答题，答对才出图 */}
                  {step.kind === 'split' && (
                    <>
                      <div className="font-bold text-gray-700 leading-7">{step.text}</div>
                      <SplitQuiz
                        step={step}
                        onSolved={() => setSolvedSplits((s) => new Set(s).add(i))}
                      />
                    </>
                  )}
                  {/* 算式步骤：每一步一个独立小竖式 */}
                  {step.kind === 'calc' && (
                    <div className="space-y-1">
                      {step.lead && <div className="font-bold text-gray-700 leading-7">{step.lead}</div>}
                      <VerticalWithLegend a={step.a} b={step.b} op={step.op} answer={step.r} />
                    </div>
                  )}
                  {/* 纯文字步骤 */}
                  {step.kind === 'text' && (
                    <div className="font-bold text-gray-700 leading-7">{step.text}</div>
                  )}
                </div>
              </div>

              {/* 下一步按钮（当前步的拆数先答对才放行） */}
              {isCurrent && (
                <div className="mt-3 text-center">
                  <button
                    disabled={locked}
                    onClick={() => setRevealed(revealed + 1)}
                    className={`px-5 py-2 rounded-full font-black text-sm transition ${
                      locked
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-moko-purple to-moko-violet text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    {locked ? '先答对上面的问题 🔒' : i === steps.length - 2 ? '看最后一步 ▶' : '我明白了，下一步 ▶'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 全部完成：展示整题竖式总结 */}
      {allDone && mainOp && mainAnswer !== null && (
        <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4 text-center space-y-2">
          <div className="text-sm font-black text-emerald-600">🏆 全部步骤完成！连起来再看一遍整题：</div>
          <div className="flex justify-center">
            <VerticalWithLegend a={mainA} b={mainB} op={mainOp} answer={mainAnswer} />
          </div>
        </div>
      )}
    </div>
  );
}
