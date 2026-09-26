'use client';

import type { ReactNode } from 'react';
import { VerticalCalculation } from './VerticalCalculation';
import type { Operator } from '@/lib/algorithm/types';

/**
 * 典型例题的可视化演示：
 * - 整题用真正的竖式展示（数位对齐、带进位/退位标记）
 * - 「把 X 拆成「A 和 B」」→ 数字分解气泡图
 * - 步骤里的算式（如 9 + 1 = 10）→ 彩色数字筹码，而不是一行文字
 * - 其余说明文字保持原样
 * 全部从 topics.ts 的现有 example 数据自动解析，无需改数据格式。
 */

/** 数字筹码 */
function Num({ n, tone }: { n: string | number; tone: 'gray' | 'purple' | 'green' | 'orange' | 'blue' }) {
  const cls = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    purple: 'bg-moko-purple/15 text-moko-purple border-moko-purple/40',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    orange: 'bg-orange-100 text-orange-600 border-orange-300',
    blue: 'bg-moko-blue/10 text-moko-blue border-moko-blue/40',
  }[tone];
  return (
    <span className={`inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-xl border-2 text-xl font-black ${cls}`}>
      {n}
    </span>
  );
}

function Op({ o }: { o: string }) {
  return <span className="text-xl font-black text-moko-purple px-0.5">{o}</span>;
}

/** 把一段步骤文本里的所有算式渲染成筹码，其余文字原样保留 */
function InlineMath({ text }: { text: string }) {
  const re = /(\d+)\s*([+\-])\s*(\d+)\s*=\s*([✅]?)(\s*)(\d+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    out.push(
      <span key={k++} className="inline-flex items-center gap-1.5 align-middle mx-1">
        <Num n={m[1]} tone="purple" />
        <Op o={m[2]} />
        <Num n={m[3]} tone="blue" />
        <Op o="=" />
        <Num n={m[6]} tone="green" />
        {m[4] === '✅' && <span>✅</span>}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={k++}>{text.slice(last)}</span>);
  return <>{out}</>;
}

/** 「把 X 拆成 A 和 B」分解气泡图 */
function SplitDiagram({ x, a, b, op }: { x: number; a: number; b: number; op: '+' | '-' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
      <Num n={x} tone="gray" />
      <span className="text-gray-400 font-black text-lg">=</span>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Num n={a} tone="orange" />
          <span className="text-gray-400 font-black">{op}</span>
          <Num n={b} tone="blue" />
        </div>
        <svg width="110" height="14" viewBox="0 0 110 14" className="text-moko-purple/50 -mt-0.5" aria-hidden>
          {/* 类似大括号括号把两部分「抱住」 */}
          <path d="M4 2 Q4 8 10 8 L46 8 Q52 8 52 12 M106 2 Q106 8 100 8 L64 8 Q58 8 58 12"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function ExampleDemo({ problem, solution }: { problem: string; solution: string[] }) {
  // 解析整题（支持两位数内的 + / -）
  const pm = problem.match(/(\d+)\s*([+\-×÷])\s*(\d+)/);
  const op: Operator | null = pm && (pm[2] === '+' || pm[2] === '-') ? (pm[2] as Operator) : null;
  const a = pm ? Number(pm[1]) : 0;
  const b = pm ? Number(pm[3]) : 0;
  const answer = op === '+' ? a + b : op === '-' ? a - b : null;

  return (
    <div className="space-y-3">
      {/* 竖式区 */}
      {op && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl font-black text-moko-purple">{problem}</div>
          <VerticalCalculation a={a} b={b} operator={op} answer={answer} showCarry />
        </div>
      )}
      {!op && <div className="text-3xl font-black text-moko-purple text-center">{problem}</div>}

      {/* 分步演示 */}
      <div className="space-y-2 mt-2">
        {solution.map((step, i) => {
          const sm = step.match(/把\s*(\d+)\s*拆成\s*[「"]?(\d+)\s*和\s*(\d+)[」"]?/);
          return (
            <div
              key={i}
              className="bg-moko-purple/5 rounded-2xl p-3 border-2 border-moko-purple/10"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-moko-purple text-white flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 font-bold text-gray-700 leading-9">
                  {sm ? (
                    <>
                      <InlineMath text={step} />
                      <SplitDiagram
                        x={Number(sm[1])}
                        a={Number(sm[2])}
                        b={Number(sm[3])}
                        op={op === '-' ? '-' : '+'}
                      />
                    </>
                  ) : (
                    <InlineMath text={step} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
