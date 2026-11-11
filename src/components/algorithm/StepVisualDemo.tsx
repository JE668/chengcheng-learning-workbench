'use client';

import { useState } from 'react';
import type { AlgorithmQuestion } from '@/lib/algorithm/types';

/**
 * 练习页「当前题真实数字」的迷你思维演示 —— 替代写死示例的 MiniVisualAid。
 *
 * B：用本题的 a、b 渲染十格阵 / 点点图 / 拆数树，孩子先「看见」凑十、破十的动作；
 *    每答对一步（solved 变 true）就揭晓下一段动画（搬豆子 / 划豆子）。
 * D：答错时可点「看萌可演示」按钮，主动播放引导动画 —— 纠错本身变成教学。
 *
 * 全部 CSS 动画（keyframes 定义在 ExampleVisualStyle，由主题页渲染一次；
 * 练习页不含例题时用本组件内嵌的兜底 keyframes）。
 */

// ── 兜底 keyframes：例题页已全局注入 ExampleVisualStyle，这里保证单独使用也不缺 ──
const STEP_DEMO_KF = `
  @keyframes sdPop { 0% {opacity:0; transform:scale(.2)} 60% {opacity:1; transform:scale(1.12)} 100% {opacity:1; transform:scale(1)} }
  @keyframes sdGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0) } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,.2) } }
  @keyframes sdBlink { 0%,100% { opacity:.35 } 50% { opacity:1 } }
  @keyframes exPop { 0% {opacity:0; transform:scale(.2)} 60% {opacity:1; transform:scale(1.12)} 100% {opacity:1; transform:scale(1)} }
`;

function pop(delay = 0): React.CSSProperties {
  return { animation: 'sdPop .5s cubic-bezier(.34,1.56,.64,1) both', animationDelay: `${delay}s` };
}

export function StepVisualDemo({
  question,
  stepIdx,
  solved,
}: {
  question: AlgorithmQuestion;
  /** 当前步骤索引（用于决定演示推进到哪一段） */
  stepIdx: number;
  /** 当前步是否已答对（true 时播放本步揭晓动画） */
  solved: boolean;
}) {
  const [manualPlay, setManualPlay] = useState(0); // D：手动触发次数，作 key 重播动画

  const a = question.digits[0];
  const b = question.digits[1];

  switch (question.topicId) {
    case 'making-ten':
      return (
        <DemoShell onReplay={() => setManualPlay((c) => c + 1)} canReplay={stepIdx > 0 || solved}>
          <MakingTenDemo a={a} b={b} reveal={stepIdx + (solved ? 1 : 0)} key={manualPlay} />
        </DemoShell>
      );
    case 'breaking-ten':
      return (
        <DemoShell onReplay={() => setManualPlay((c) => c + 1)} canReplay={stepIdx > 0 || solved}>
          <BreakingTenDemo a={a} b={b} reveal={stepIdx + (solved ? 1 : 0)} key={manualPlay} />
        </DemoShell>
      );
    case 'leveling-ten':
      return (
        <DemoShell onReplay={() => setManualPlay((c) => c + 1)} canReplay={stepIdx > 0 || solved}>
          <LevelingTenDemo a={a} b={b} reveal={stepIdx + (solved ? 1 : 0)} key={manualPlay} />
        </DemoShell>
      );
    default:
      // 其余主题（三数连算 / 去括号 / 交换律…）继续用原有静态思维图
      return <StaticFallback topicId={question.topicId} />;
  }
}

/** 演示外壳：标题 + D 的「看萌可演示」重播按钮 */
function DemoShell({
  children,
  onReplay,
  canReplay,
}: {
  children: React.ReactNode;
  onReplay: () => void;
  canReplay: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4 bg-gradient-to-r from-moko-purple/5 to-moko-blue/5 rounded-2xl p-3 border border-moko-purple/15">
      <style>{STEP_DEMO_KF}</style>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-black text-moko-violet">👀 看萌可摆一摆</span>
        <div className="flex items-center gap-1">
          {canReplay && (
            <button
              onClick={onReplay}
              className="text-xs font-bold text-moko-violet bg-white/70 px-2 py-0.5 rounded-full hover:bg-white transition"
            >
              🔁 再看一遍
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-bold text-gray-400 bg-white/70 px-2 py-0.5 rounded-full hover:bg-white transition"
          >
            {open ? '收起' : '展开'}
          </button>
        </div>
      </div>
      {open && children}
    </div>
  );
}

// ============================================================================
// 凑十法：a + b，从 b 搬 10−a 颗进左十格阵
//   揭晓段：reveal>=1 搬豆子（对应步骤1拆数）；>=2 显示 a+b1=10；>=3 显示 10+b2=答案
// ============================================================================
function MakingTenDemo({ a, b, reveal }: { a: number; b: number; reveal: number }) {
  const need = 10 - a;
  const b2 = b - need;
  const dot = 'w-4 h-4 rounded-full';
  const cell =
    'relative w-6 h-6 rounded-md border border-moko-purple/20 bg-white flex items-center justify-center';

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={`十格阵演示：${a} 加 ${b}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`grid grid-cols-5 gap-1 rounded-2xl border-2 p-1.5 transition-colors ${
              reveal >= 1
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-moko-purple/30 bg-moko-purple/5'
            }`}
            style={reveal >= 1 ? { animation: 'sdGlow 1.6s ease-in-out infinite' } : {}}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const filled = i < a;
              const movedIn = reveal >= 1 && i >= a && i < a + need;
              return (
                <div key={i} className={cell}>
                  {filled && <span className={`${dot} bg-pink-400`} />}
                  {movedIn && (
                    <span className={`${dot} bg-sky-400`} style={pop(0.15 + (i - a) * 0.12)} />
                  )}
                  {!filled && !movedIn && (
                    <span
                      className="w-4 h-4 rounded-full border-2 border-dashed border-orange-300"
                      style={{ animation: 'sdBlink 1.4s ease-in-out infinite' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs font-black text-gray-500">
            {reveal >= 1 ? (
              <span className="text-emerald-600" style={pop(0.8)}>
                凑成 10 啦 ✨
              </span>
            ) : (
              `${a} 颗，还空 ${need} 格`
            )}
          </div>
        </div>

        <svg width="32" height="48" viewBox="0 0 36 52" className="flex-shrink-0" aria-hidden>
          <defs>
            <marker
              id="sdTenArrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="#f97316" />
            </marker>
          </defs>
          <path
            d="M 32 40 C 32 14, 6 14, 6 34"
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#sdTenArrow)"
            pathLength={1}
            strokeDasharray={reveal >= 1 ? 'none' : 1}
            strokeDashoffset={reveal >= 1 ? 0 : 1}
            style={{ transition: 'stroke-dashoffset .6s ease .1s' }}
          />
        </svg>

        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-5 gap-1 rounded-2xl border-2 border-sky-300 bg-sky-50 p-1.5">
            {Array.from({ length: Math.max(10, b) }, (_, i) => {
              const has = i < b;
              const movedOut = reveal >= 1 && i < need;
              return (
                <div key={i} className={cell}>
                  {has && (
                    <span
                      className={`${dot} ${movedOut ? 'border-2 border-dashed border-sky-300 bg-transparent' : 'bg-sky-400'}`}
                      style={movedOut ? { transition: 'all .4s ease .3s' } : {}}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs font-black text-gray-500">
            {reveal >= 1 ? `${b} − ${need} = ${b2} 颗` : `${b} 颗`}
          </div>
        </div>
      </div>

      {/* 算式 chips：随步骤逐个亮 */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {reveal >= 2 && <Chip text={`${a} + ${need} = 10`} tone="violet" delay={0.1} />}
        {reveal >= 3 && <Chip text={`10 + ${b2} = ${a + b}`} tone="green" delay={0.1} />}
        {reveal < 2 && (
          <span className="text-xs font-black text-gray-400">答对步骤，萌可继续摆给你看 ✨</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 破十法：a − b（a 十几），拆出 10，10−b，加回个位
// ============================================================================
function BreakingTenDemo({ a, b, reveal }: { a: number; b: number; reveal: number }) {
  const ones = a % 10;
  const sub1 = 10 - b;
  const dot = 'w-4 h-4 rounded-full';
  const cell =
    'relative w-6 h-6 rounded-md border border-moko-purple/20 bg-white flex items-center justify-center';

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={`破十演示：${a} 减 ${b}`}
    >
      {/* 拆数树：a → 10 + ones */}
      <div className="flex items-center gap-2">
        <Chip text={`${a}`} tone="violet" delay={0} />
        <span className="text-moko-violet font-black">→</span>
        {reveal >= 1 ? (
          <>
            <Chip text="10" tone="orange" delay={0.15} />
            <span className="text-xs font-black text-gray-400">和</span>
            <Chip text={`${ones}`} tone="blue" delay={0.3} />
          </>
        ) : (
          <span
            className="w-9 h-9 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 text-orange-400 font-black flex items-center justify-center"
            style={{ animation: 'sdBlink 1.6s ease-in-out infinite' }}
          >
            ?
          </span>
        )}
      </div>

      {/* 点点图：10 颗划掉 b 颗 */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1 flex-wrap justify-center max-w-64">
          {Array.from({ length: 10 }, (_, i) => {
            const crossed = reveal >= 2 && i < b;
            return (
              <span key={i} className={`${cell} ${crossed ? 'opacity-60' : ''}`}>
                <span
                  className={`${dot} ${crossed ? 'bg-gray-300' : reveal >= 1 ? 'bg-emerald-400' : 'bg-moko-purple/60'}`}
                  style={crossed ? { transition: 'all .3s ease' } : {}}
                />
                {crossed && (
                  <span
                    className="absolute text-rose-500 font-black text-lg select-none"
                    style={pop(0.2 + i * 0.08)}
                  >
                    ✕
                  </span>
                )}
              </span>
            );
          })}
        </div>
        <div className="text-xs font-black text-gray-500">
          {reveal >= 2 ? (
            <span className="text-rose-500">
              10 颗划掉 {b} 颗 → 剩 {sub1} 颗
            </span>
          ) : (
            '10 颗豆子待命'
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {reveal >= 2 && <Chip text={`10 − ${b} = ${sub1}`} tone="violet" delay={0.2} />}
        {reveal >= 3 && <Chip text={`${sub1} + ${ones} = ${a - b}`} tone="green" delay={0.2} />}
        {reveal < 2 && (
          <span className="text-xs font-black text-gray-400">答对步骤，萌可继续划给你看 ✨</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 平十法：a − b，先减到 10（b1=个位），再减剩下的
// ============================================================================
function LevelingTenDemo({ a, b, reveal }: { a: number; b: number; reveal: number }) {
  const ones = a % 10;
  const b2 = b - ones;
  const dot = 'w-4 h-4 rounded-full';
  const cell =
    'relative w-6 h-6 rounded-md border border-moko-purple/20 bg-white flex items-center justify-center';

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={`平十演示：${a} 减 ${b}`}
    >
      {/* 数轴式两段跳 */}
      <div className="flex items-center gap-2">
        <Chip text={`${a}`} tone="violet" delay={0} />
        {reveal >= 1 && (
          <>
            <span className="text-moko-violet font-black">−{ones}→</span>
            <Chip text="10" tone="orange" delay={0.2} />
          </>
        )}
        {/* 第二跳与答案要到第三步（reveal>=3）才揭晓——提前亮出会把最终答案
            泄露给正要做「10 − b2 = ?」的孩子 */}
        {reveal >= 3 && (
          <>
            <span className="text-moko-violet font-black">−{b2}→</span>
            <Chip text={`${a - b}`} tone="green" delay={0.2} />
          </>
        )}
      </div>

      {/* b 拆两段 */}
      <div className="flex items-center gap-2 text-sm font-black">
        <span className="text-gray-500">{b} 拆成</span>
        {reveal >= 1 ? (
          <Chip text={`${ones}`} tone="orange" delay={0.3} />
        ) : (
          <span
            className="w-8 h-8 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 text-orange-400 flex items-center justify-center"
            style={{ animation: 'sdBlink 1.6s ease-in-out infinite' }}
          >
            ?
          </span>
        )}
        <span className="text-gray-400">+</span>
        {/* b2 是第三步的减数（10 − b2），第三步（reveal>=3）才揭晓 */}
        {reveal >= 3 ? (
          <Chip text={`${b2}`} tone="blue" delay={0.3} />
        ) : (
          <span
            className="w-8 h-8 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 text-orange-400 flex items-center justify-center"
            style={{ animation: 'sdBlink 1.6s ease-in-out infinite' }}
          >
            ?
          </span>
        )}
      </div>

      {/* 豆子排：a 颗里划掉 ones 颗到 10 */}
      <div className="flex gap-1 flex-wrap justify-center max-w-72">
        {Array.from({ length: a }, (_, i) => {
          const crossedFirst = reveal >= 1 && i < ones;
          return (
            <span key={i} className={`${cell} scale-90`}>
              <span
                className={`${dot} ${crossedFirst ? 'bg-gray-300' : i % 10 === 9 ? 'bg-emerald-400' : 'bg-moko-purple/50'}`}
              />
              {crossedFirst && (
                <span className="absolute text-rose-500 font-black select-none">✕</span>
              )}
            </span>
          );
        })}
      </div>
      <div className="text-xs font-black text-gray-500">
        {reveal >= 1 ? `先划 ${ones} 颗，正好到 10` : '先划掉几个正好到 10？'}
      </div>
    </div>
  );
}

// ============================================================================
// 其余主题的静态思维图（复用原 MiniVisualAid 内容，保留兜底）
// ============================================================================
function StaticFallback({ topicId }: { topicId: string }) {
  return <MiniAidInline topicId={topicId} />;
}

function MiniAidInline({ topicId }: { topicId: string }) {
  const VIEWS: Record<string, React.ReactNode> = {
    commutative: (
      <>
        <span className="text-lg">45+38</span>
        <span className="text-moko-violet">⇄</span>
        <span className="text-lg">38+45</span>
      </>
    ),
    associative: (
      <>
        <span>8+62+47</span>
        <span className="text-moko-violet">→</span>
        <span>(8+62)</span>
        <span>+47</span>
      </>
    ),
    'subtraction-parens': (
      <>
        <span>100-(35+18)</span>
        <span className="text-moko-violet">→</span>
        <span>100-35-18</span>
      </>
    ),
    'addition-parens': (
      <>
        <span>27+13+47</span>
        <span className="text-moko-violet">→</span>
        <span>(27+47)</span>
        <span>+13</span>
      </>
    ),
    rounding: (
      <>
        <span className="text-lg">88+17</span>
        <span className="text-moko-violet">→</span>
        <span>(87+13)</span>
        <span className="text-emerald-600">=100</span>
      </>
    ),
    'symbol-move': (
      <>
        <span>56+24-18</span>
        <span className="text-moko-violet">→</span>
        <span>56-18+24</span>
      </>
    ),
  };
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-black">
      {VIEWS[topicId] ?? <span className="text-gray-400">思维图</span>}
    </div>
  );
}

function Chip({
  text,
  tone,
  delay,
}: {
  text: string;
  tone: 'violet' | 'green' | 'orange' | 'blue';
  delay: number;
}) {
  const CLS: Record<string, string> = {
    violet: 'bg-moko-purple/10 border-moko-purple/30 text-moko-violet',
    green: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    orange: 'bg-orange-50 border-orange-300 text-orange-600',
    blue: 'bg-sky-50 border-sky-300 text-sky-600',
  };
  return (
    <span
      className={`inline-block rounded-xl border-2 px-2.5 py-1 text-sm sm:text-base font-black ${CLS[tone]}`}
      style={pop(delay)}
    >
      {text}
    </span>
  );
}
