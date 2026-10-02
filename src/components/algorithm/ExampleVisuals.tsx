'use client';

import { useEffect, useState } from 'react';
import type { ExampleVisual } from '@/lib/algorithm/types';

/**
 * 例题「思维可视化」组件库
 *
 * 每个速算技巧配课本标准的呈现图式，而不是统一套竖式：
 *  - ten-frame    十格阵（凑十法：搬豆子凑满 10）
 *  - arc-split    弧线分解图（课本标准写法：拆小数、弧线连回大数凑十）
 *  - number-bond  拆数树（破十法/平十法：15 = 10 + 5）
 *  - dot-take     点点图（10 − 8：划掉豆子数剩下）
 *  - number-line  数轴连减（平十法：17 −7→ 10 −2→ 8）
 *  - swap-pair    交换卡（交换律：两数对调，和不变）
 *  - brace-group  好朋友抱团 / 添括号（结合律 / 添括号）
 *  - paren-flip   开括号变号（减法去括号变号 / 加法去括号不变号）
 *  - hundred-pair 好朋友数凑百（凑整法：十位凑 9、个位凑 10）
 *  - sign-move    带符号搬家（混合运算：符号跟着数字走）
 *  - calc-strip   计算过程条（各主题的纯计算步骤）
 *
 * 所有动画用 CSS keyframes（见 ExampleVisualStyle），unlocked=false 时
 * 显示「未揭晓」状态，unlocked 变为 true 时播放揭晓动画。
 */

// ============================================================================
// 全局 keyframes（由 ExampleDemo 渲染一次）
// ============================================================================

export function ExampleVisualStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes exPop { 0% {opacity:0; transform:scale(.2)} 60% {opacity:1; transform:scale(1.12)} 100% {opacity:1; transform:scale(1)} }
          @keyframes exFadeUp { 0% {opacity:0; transform:translateY(8px)} 100% {opacity:1; transform:translateY(0)} }
          @keyframes exDissolve { to { opacity:0; transform: scale(.2) rotate(30deg); } }
          @keyframes exFlipOut { to { transform: rotateY(90deg); opacity:.2 } }
          @keyframes exFlipIn { from { transform: rotateY(-90deg); opacity:.2 } to { transform: rotateY(0); opacity:1 } }
          @keyframes exPulseSoft { 0%,100% { opacity:.45 } 50% { opacity:1 } }
          @keyframes exGlowRing { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0) } 50% { box-shadow: 0 0 0 7px rgba(16,185,129,.22) } }
          @keyframes exShake { 0%,100% { transform:translateX(0) } 15% { transform:translateX(-6px) } 30% { transform:translateX(5px) } 45% { transform:translateX(-4px) } 60% { transform:translateX(3px) } 75% { transform:translateX(-2px) } }
        `,
      }}
    />
  );
}

// ── 动画工具 ─────────────────────────────────────────────────

const pop = (delay = 0): React.CSSProperties => ({
  animation: 'exPop .55s cubic-bezier(.34,1.56,.64,1) both',
  animationDelay: `${delay}s`,
});

const fadeUp = (delay = 0): React.CSSProperties => ({
  animation: 'exFadeUp .4s ease-out both',
  animationDelay: `${delay}s`,
});

/** SVG 路径「画出」动画（配合 pathLength=1） */
const draw = (unlocked: boolean, delay = 0, dur = 0.8): React.CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: unlocked ? 0 : 1,
  transition: `stroke-dashoffset ${dur}s ease ${delay}s`,
});

// ── 基础元件 ─────────────────────────────────────────────────

type Tone = 'gray' | 'violet' | 'pink' | 'orange' | 'blue' | 'green' | 'rose';

const TONE_CLS: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-300',
  violet: 'bg-moko-purple/15 text-moko-violet border-moko-purple/40',
  pink: 'bg-pink-100 text-pink-600 border-pink-300',
  orange: 'bg-orange-100 text-orange-600 border-orange-300',
  blue: 'bg-sky-100 text-sky-600 border-sky-300',
  green: 'bg-emerald-100 text-emerald-600 border-emerald-300',
  rose: 'bg-rose-100 text-rose-600 border-rose-300',
};

function Tile({
  n,
  tone = 'gray',
  size = 'md',
  style,
  pulse = false,
}: {
  n: string | number;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  pulse?: boolean;
}) {
  const sizeCls =
    size === 'lg'
      ? 'w-14 h-14 text-2xl rounded-2xl'
      : size === 'sm'
        ? 'w-9 h-9 text-lg rounded-xl'
        : 'w-11 h-11 text-xl rounded-xl';
  return (
    <span
      className={`inline-flex items-center justify-center border-2 font-black select-none ${sizeCls} ${TONE_CLS[tone]}`}
      style={{ ...(pulse ? { animation: 'exPulseSoft 1.4s ease-in-out infinite' } : {}), ...style }}
    >
      {n}
    </span>
  );
}

/** 虚线「?」占位块（等待揭晓） */
function GhostTile({ size = 'md', style }: { size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties }) {
  const sizeCls =
    size === 'lg'
      ? 'w-14 h-14 text-2xl rounded-2xl'
      : size === 'sm'
        ? 'w-9 h-9 text-lg rounded-xl'
        : 'w-11 h-11 text-xl rounded-xl';
  return (
    <span
      className={`inline-flex items-center justify-center border-2 border-dashed border-orange-300 bg-orange-50 text-orange-400 font-black select-none ${sizeCls}`}
      style={{ animation: 'exPulseSoft 1.6s ease-in-out infinite', ...style }}
    >
      ?
    </span>
  );
}

function OpMark({ o, style }: { o: string; style?: React.CSSProperties }) {
  return (
    <span className="text-2xl font-black text-moko-purple select-none" style={style}>
      {o}
    </span>
  );
}

/** 步骤算式 chip（用于 flow / 结论） */
function StepChip({ text, delay = 0, tone = 'violet' }: { text: string; delay?: number; tone?: 'violet' | 'green' }) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
      : 'bg-moko-purple/10 border-moko-purple/30 text-moko-violet';
  return (
    <span className={`inline-block rounded-xl border-2 px-3 py-1.5 text-base font-black ${cls}`} style={pop(delay)}>
      {text}
    </span>
  );
}

// ============================================================================
// 1. 十格阵（凑十法）：从 b 搬 10-a 颗豆子，把 a 凑满 10
// ============================================================================

function TenFrameVisual({ a, b, unlocked }: { a: number; b: number; unlocked: boolean }) {
  const need = 10 - a; // 需要搬的颗数
  const dotCls = 'w-4 h-4 rounded-full';
  const cellCls = 'w-6 h-6 rounded-md border border-moko-purple/20 bg-white flex items-center justify-center';

  return (
    <div className="flex flex-col items-center gap-3" role="img" aria-label={`十格阵：${a} 加 ${b}，搬 ${need} 颗凑成 10`}>
      <div className="flex items-center gap-2">
        {/* 左框：a 颗 + 空位 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`grid grid-cols-5 gap-1 rounded-2xl border-2 p-1.5 transition-colors ${
              unlocked ? 'border-emerald-400 bg-emerald-50' : 'border-moko-purple/30 bg-moko-purple/5'
            }`}
            style={unlocked ? { animation: 'exGlowRing 1.6s ease-in-out infinite' } : {}}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const filled = i < a;
              const movedIn = unlocked && i >= a && i < a + need;
              return (
                <div key={i} className={cellCls}>
                  {filled && <span className={`${dotCls} bg-pink-400`} />}
                  {movedIn && <span className={`${dotCls} bg-sky-400`} style={pop(0.8)} />}
                  {!filled && !movedIn && (
                    <span className="w-4 h-4 rounded-full border-2 border-dashed border-orange-300" style={{ animation: 'exPulseSoft 1.4s ease-in-out infinite' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs font-black text-gray-500">
            {unlocked ? <span className="text-emerald-600" style={fadeUp(1)}>凑成 10 啦 ✨</span> : `${a} 颗，空 ${need} 格`}
          </div>
        </div>

        {/* 搬家箭头 */}
        <svg width="36" height="52" viewBox="0 0 36 52" className="flex-shrink-0" aria-hidden>
          <defs>
            <marker id="exTenArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="#f97316" />
            </marker>
          </defs>
          <path
            d="M 32 40 C 32 14, 6 14, 6 34"
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#exTenArrow)"
            pathLength={1}
            style={draw(unlocked, 0.2, 0.6)}
          />
        </svg>

        {/* 右框：b 颗，搬走的变虚影 */}
        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-5 gap-1 rounded-2xl border-2 border-sky-300 bg-sky-50 p-1.5">
            {Array.from({ length: Math.max(10, b) }, (_, i) => {
              const has = i < b;
              const movedOut = unlocked && i < need;
              return (
                <div key={i} className={cellCls}>
                  {has && (
                    <span
                      className={`${dotCls} ${movedOut ? 'border-2 border-dashed border-sky-300 bg-transparent' : 'bg-sky-400'}`}
                      style={movedOut ? { transition: 'all .4s ease .7s' } : {}}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs font-black text-gray-500">
            {unlocked ? `${b} − ${need} = ${b - need} 颗` : `${b} 颗`}
          </div>
        </div>
      </div>

      {/* 算式 chips */}
      {unlocked ? (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StepChip text={`${a} + ${need} = 10`} delay={1.1} />
          <StepChip text={`10 + ${b - need} = ${a + b}`} delay={1.7} tone="green" />
        </div>
      ) : (
        <div className="text-sm font-black text-gray-400">答对上面的小问题，萌可就搬豆子给你看 ✨</div>
      )}
    </div>
  );
}

// ============================================================================
// 2. 弧线分解图（课本标准写法）：a + b，b 拆成 b1、b2，弧线把 b1 送回 a 凑十
// ============================================================================

function ArcSplitVisual({ a, b, unlocked }: { a: number; b: number; unlocked: boolean }) {
  const b1 = 10 - a;
  const b2 = b - b1;
  return (
    <div className="relative mx-auto w-[320px] max-w-full h-[185px]" role="img" aria-label={`弧线分解图：${a} 加 ${b}，把 ${b} 拆成 ${b1} 和 ${b2}`}>
      {/* 顶部算式 */}
      <div className="absolute" style={{ left: 22, top: 14 }}><Tile n={a} tone="pink" size="lg" /></div>
      <div className="absolute" style={{ left: 86, top: 26 }}><OpMark o="+" /></div>
      <div className="absolute" style={{ left: 118, top: 14 }}><Tile n={b} tone="blue" size="lg" /></div>
      <div className="absolute" style={{ left: 184, top: 26 }}><OpMark o="=" /></div>
      <div className="absolute" style={{ left: 216, top: 14 }}>
        {unlocked ? <Tile n={a + b} tone="green" size="lg" style={pop(1.4)} /> : <GhostTile size="lg" />}
      </div>

      {/* 拆分弧线与两个子数 */}
      <svg className="absolute inset-0" width="320" height="185" viewBox="0 0 320 185" aria-hidden>
        {/* b → b1、b2 的两条分叉线 */}
        <path d="M 146 72 Q 134 92 120 108" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.15, 0.4)} />
        <path d="M 146 72 Q 160 92 176 108" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.15, 0.4)} />
        {/* 凑十弧：b1 绕回 a */}
        <defs>
          <marker id="exArcArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" fill="#f97316" />
          </marker>
        </defs>
        <path
          d="M 104 138 C 56 152, 34 118, 44 78"
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          strokeDasharray={unlocked ? 'none' : 1}
          strokeLinecap="round"
          markerEnd="url(#exArcArrow)"
          pathLength={1}
          style={draw(unlocked, 0.7, 0.7)}
        />
      </svg>

      <div className="absolute" style={{ left: 96, top: 108 }}>
        {unlocked ? <Tile n={b1} tone="orange" style={pop(0.45)} /> : <GhostTile style={fadeUp(0)} />}
      </div>
      <div className="absolute" style={{ left: 156, top: 108 }}>
        {unlocked ? <Tile n={b2} tone="blue" style={pop(0.6)} /> : <GhostTile />}
      </div>
      <div className="absolute text-orange-500 text-xs font-black" style={{ left: 66, top: 156 }}>
        {unlocked && <span style={fadeUp(1.1)}>👆 {b1} 去帮 {a} 凑成 10</span>}
      </div>
    </div>
  );
}

// ============================================================================
// 3. 拆数树：whole 拆成 p1、p2
// ============================================================================

function NumberBondVisual({ whole, parts, unlocked }: { whole: number; parts: [number, number]; unlocked: boolean }) {
  const [p1, p2] = parts;
  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`拆数树：${whole} 拆成 ${p1} 和 ${p2}`}>
      <div className="relative w-[320px] max-w-full h-[160px]">
        <div className="absolute" style={{ left: 130, top: 8 }}><Tile n={whole} tone="violet" size="lg" /></div>
        <svg className="absolute inset-0" width="320" height="160" viewBox="0 0 320 160" aria-hidden>
          <path d="M 160 66 Q 160 92 112 102" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.1, 0.4)} />
          <path d="M 160 66 Q 160 92 208 102" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.1, 0.4)} />
        </svg>
        <div className="absolute" style={{ left: 86, top: 100 }}>
          {unlocked ? <Tile n={p1} tone="orange" style={pop(0.5)} /> : <GhostTile />}
        </div>
        <div className="absolute" style={{ left: 182, top: 100 }}>
          {unlocked ? <Tile n={p2} tone="blue" style={pop(0.65)} /> : <GhostTile />}
        </div>
        <div className="absolute text-gray-400 text-sm font-black" style={{ left: 153, top: 116 }}>和</div>
      </div>
      {unlocked && <StepChip text={`${whole} = ${p1} + ${p2}`} delay={0.9} />}
    </div>
  );
}

// ============================================================================
// 4. 点点图：total 颗豆划掉 take 颗
// ============================================================================

function DotTakeVisual({ total, take, unlocked }: { total: number; take: number; unlocked: boolean }) {
  const left = total - take;
  return (
    <div className="flex flex-col items-center gap-3" role="img" aria-label={`点点图：${total} 减 ${take} 剩 ${left}`}>
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[300px]">
        {Array.from({ length: total }, (_, i) => {
          const crossed = i < take;
          return (
            <span key={i} className="relative w-7 h-7 flex items-center justify-center">
              <span
                className={`w-5 h-5 rounded-full transition-colors duration-300 ${
                  unlocked && crossed ? 'bg-gray-300' : unlocked ? 'bg-emerald-400' : crossed ? 'bg-rose-300' : 'bg-moko-purple/60'
                }`}
                style={{ transitionDelay: unlocked ? `${crossed ? i * 0.1 : 0.3 + take * 0.1}s` : '0s' }}
              />
              {unlocked && crossed && (
                <span className="absolute inset-0 flex items-center justify-center text-rose-500 font-black text-lg" style={pop(0.15 + i * 0.1)}>
                  ✕
                </span>
              )}
            </span>
          );
        })}
      </div>
      {unlocked ? (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StepChip text={`${total} − ${take} = ${left}`} delay={0.4 + take * 0.1} tone="green" />
          <span className="text-sm font-black text-emerald-600" style={fadeUp(0.7 + take * 0.1)}>还剩 {left} 颗！</span>
        </div>
      ) : (
        <div className="text-sm font-black text-gray-400">数一数：{total} 颗豆，划掉 {take} 颗，还剩几颗？</div>
      )}
    </div>
  );
}

// ============================================================================
// 5. 数轴连减（平十法）：from 往回跳 jumps
// ============================================================================

function NumberLineVisual({ from, jumps, unlocked }: { from: number; jumps: number[]; unlocked: boolean }) {
  // 落点序列
  const stops: number[] = [from];
  jumps.forEach((j) => stops.push(stops[stops.length - 1] - j));
  const final = stops[stops.length - 1];
  const minTick = Math.max(0, final - 1);
  const maxTick = from;
  const span = Math.max(1, maxTick - minTick);
  const W = 320;
  const x = (v: number) => 26 + ((v - minTick) / span) * (W - 52);

  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`数轴：从 ${from} 分 ${jumps.length} 步减到 ${final}`}>
      <div className="relative w-[320px] max-w-full h-[150px]">
        <svg className="absolute inset-0" width="320" height="150" viewBox="0 0 320 150" aria-hidden>
          <defs>
            <marker id="exNlArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="#a78bfa" />
            </marker>
          </defs>
          {/* 轴线与刻度 */}
          <line x1="16" y1="98" x2="304" y2="98" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" />
          {Array.from({ length: span + 1 }, (_, i) => {
            const v = minTick + i;
            const key = v === 10 || v === from || v === final;
            return (
              <g key={v}>
                <line x1={x(v)} y1="92" x2={x(v)} y2="104" stroke={key ? '#a78bfa' : '#d1d5db'} strokeWidth={key ? 3 : 2} />
                <text x={x(v)} y="122" textAnchor="middle" fontSize={key ? 13 : 10} fontWeight={900} fill={key ? '#7c5cd6' : '#9ca3af'}>
                  {v}
                </text>
              </g>
            );
          })}
          {/* 跳格弧线 */}
          {jumps.map((j, i) => {
            const p0 = stops[i];
            const p1 = stops[i + 1];
            const x0 = x(p0);
            const x1 = x(p1);
            const mid = (x0 + x1) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${x0} 84 Q ${mid} ${58 - i * 4} ${x1} 84`}
                  fill="none"
                  stroke={i === 0 ? '#a78bfa' : '#38bdf8'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  markerEnd="url(#exNlArrow)"
                  pathLength={1}
                  style={draw(unlocked, 0.3 + i * 0.9, 0.7)}
                />
                {unlocked && (
                  <text x={mid} y={52 - i * 4} textAnchor="middle" fontSize="12" fontWeight={900} fill={i === 0 ? '#7c5cd6' : '#0284c7'} style={fadeUp(0.8 + i * 0.9)}>
                    −{j}
                  </text>
                )}
              </g>
            );
          })}
          {/* 起点 */}
          <circle cx={x(from)} cy="86" r="7" fill="#ff6fa5" stroke="#fff" strokeWidth="2.5" />
          {/* 终点（揭晓后高亮） */}
          {unlocked && <circle cx={x(final)} cy="86" r="8" fill="#10b981" stroke="#fff" strokeWidth="2.5" style={pop(0.5 + jumps.length * 0.9)} />}
        </svg>
        <div className="absolute text-[11px] font-black text-pink-500" style={{ left: x(from) - 14, top: 30 }}>出发</div>
        {unlocked && (
          <div className="absolute" style={{ left: x(final) - 26, top: 2 }}>
            <span className="rounded-full bg-emerald-500 text-white text-sm font-black px-2.5 py-0.5" style={pop(0.7 + jumps.length * 0.9)}>
              = {final}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. 交换卡（交换律）：两张卡对调位置，和不变
// ============================================================================

function SwapPairVisual({ a, b, unlocked }: { a: number; b: number; unlocked: boolean }) {
  const sum = a + b;
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`交换律：${a} 加 ${b} 交换成 ${b} 加 ${a}`}>
      <div className="relative w-[320px] max-w-full h-[130px]">
        {/* ⇄ 徽章 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0">
          {unlocked ? (
            <span className="inline-block rounded-full bg-moko-purple text-white text-sm font-black px-3 py-1" style={pop(0.1)}>
              ⇄ 交换位置
            </span>
          ) : (
            <span className="inline-block rounded-full bg-gray-100 text-gray-400 text-sm font-black px-3 py-1">⇄</span>
          )}
        </div>
        {/* 卡片 */}
        <div
          className="absolute top-10 transition-all duration-700"
          style={{ left: 56, transform: unlocked ? 'translateX(120px) rotate(4deg)' : 'none', transitionTimingFunction: 'cubic-bezier(.68,-0.3,.27,1.3)' }}
        >
          <Tile n={a} tone="pink" size="lg" />
        </div>
        <div
          className="absolute top-10 z-10 transition-all duration-700"
          style={{ left: 176, transform: unlocked ? 'translateX(-120px) rotate(-4deg)' : 'none', transitionTimingFunction: 'cubic-bezier(.68,-0.3,.27,1.3)', transitionDelay: unlocked ? '0.08s' : '0s' }}
        >
          <Tile n={b} tone="blue" size="lg" />
        </div>
        <div className="absolute" style={{ left: 151, top: 52 }}><OpMark o="+" /></div>
      </div>
      {unlocked && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StepChip text={`${a} + ${b} = ${b} + ${a}`} delay={0.7} />
          <StepChip text={`= ${sum}`} delay={1.1} tone="green" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. 好朋友抱团（结合律 heart / 添括号 bracket）
// ============================================================================

function BraceGroupVisual({
  nums,
  group,
  mode,
  unlocked,
}: {
  nums: [number, number, number];
  group: [number, number];
  mode: 'heart' | 'bracket';
  unlocked: boolean;
}) {
  const lefts = [56, 136, 216]; // 卡片 x 位置（宽 56，居中留出括号空间）
  const tops = 56;
  const [g0, g1] = group;
  const sum = nums[g0] + nums[g1];
  const x0 = lefts[g0] + 28; // 卡片中心（宽 56 的一半）
  const x1 = lefts[g1] + 28;

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`好朋友抱团：${nums[g0]} 和 ${nums[g1]} 先算`}>
      <div className="relative w-[320px] max-w-full h-[150px]">
        <svg className="absolute inset-0" width="320" height="150" viewBox="0 0 320 150" aria-hidden>
          {mode === 'heart' && (
            <path
              d={`M ${x0} ${tops - 6} Q ${(x0 + x1) / 2} ${tops - 52} ${x1} ${tops - 6}`}
              fill="none"
              stroke="#f472b6"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
              pathLength={1}
              style={draw(unlocked, 0.2, 0.7)}
            />
          )}
        </svg>

        {/* 括号模式：左右大括号长出来 */}
        {mode === 'bracket' && unlocked && (
          <>
            <span className="absolute text-6xl font-black text-moko-violet" style={{ left: lefts[g0] - 28, top: tops - 10, ...pop(0.2) }}>(</span>
            <span className="absolute text-6xl font-black text-moko-violet" style={{ left: lefts[g1] + 64, top: tops - 10, ...pop(0.2) }}>)</span>
          </>
        )}

        {nums.map((n, i) => {
          const isFriend = i === g0 || i === g1;
          return (
            <div key={i} className="absolute" style={{ left: lefts[i], top: tops }}>
              <div
                className={`rounded-2xl transition-shadow ${unlocked && isFriend ? 'ring-4 ring-pink-300' : ''}`}
                style={unlocked && isFriend ? { transitionDelay: '0.5s' } : {}}
              >
                <Tile n={n} tone={isFriend ? (unlocked ? 'pink' : 'violet') : 'gray'} size="lg" pulse={!unlocked && isFriend} />
              </div>
            </div>
          );
        })}
        <div className="absolute" style={{ left: 124, top: tops + 16 }}><OpMark o="+" /></div>
        <div className="absolute" style={{ left: 204, top: tops + 16 }}><OpMark o="+" /></div>

        {/* 爱心 / 标签 */}
        {mode === 'heart' && unlocked && (
          <span className="absolute text-2xl" style={{ left: (x0 + x1) / 2 - 12, top: tops - 46, ...pop(0.6) }}>💞</span>
        )}
      </div>

      {unlocked ? (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {mode === 'bracket' && <span className="text-sm font-black text-moko-violet" style={fadeUp(0.4)}>🎀 添上括号！</span>}
          <StepChip text={`${nums[g0]} + ${nums[g1]} = ${sum}`} delay={0.6} tone="green" />
        </div>
      ) : (
        <div className="text-sm font-black text-gray-400">哪两个数是好朋友？答对上面的小问题看看～</div>
      )}
    </div>
  );
}

// ============================================================================
// 8. 开括号变号（去括号）：括号溶解，里面的符号翻跟头
// ============================================================================

function ParenFlipVisual({
  before,
  after,
  flip,
  unlocked,
}: {
  before: string[];
  after: string[];
  flip: boolean;
  unlocked: boolean;
}) {
  const [phase, setPhase] = useState<'before' | 'flipping' | 'after'>('before');
  useEffect(() => {
    if (!unlocked) {
      setPhase('before');
      return;
    }
    setPhase('flipping');
    const t = setTimeout(() => setPhase('after'), 420);
    return () => clearTimeout(t);
  }, [unlocked]);

  const isSign = (t: string) => t === '+' || t === '−' || t === '-';
  const openIdx = before.indexOf('(');
  const closeIdx = before.indexOf(')');
  const innerSignIdx = before.findIndex((t, i) => i > openIdx && i < closeIdx && isSign(t));
  // 约定：after 中「从括号里翻出来的符号」是最后一个符号 token
  let changedAfterIdx = -1;
  after.forEach((t, i) => {
    if (isSign(t)) changedAfterIdx = i;
  });

  const tokenCls = (t: string) =>
    t === '(' || t === ')'
      ? 'w-7 h-11 text-3xl text-moko-purple font-black inline-flex items-center justify-center select-none'
      : isSign(t)
        ? 'w-9 h-9 text-xl rounded-xl bg-moko-purple/15 text-moko-violet border-2 border-moko-purple/40 font-black inline-flex items-center justify-center select-none'
        : 'w-11 h-11 text-xl rounded-xl bg-gray-100 text-gray-700 border-2 border-gray-300 font-black inline-flex items-center justify-center select-none';

  return (
    <div className="flex flex-col items-center gap-3" role="img" aria-label={`开括号：${before.join(' ')} 变成 ${after.join(' ')}`}>
      {/* 变换区 */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap min-h-[52px]">
        {phase !== 'after'
          ? before.map((t, i) => {
              const isBracket = i === openIdx || i === closeIdx;
              const isInnerSign = i === innerSignIdx;
              return (
                <span
                  key={i}
                  className={tokenCls(t)}
                  style={
                    isBracket && unlocked
                      ? { animation: 'exDissolve .4s ease .1s both' }
                      : isInnerSign && phase === 'flipping'
                        ? { animation: 'exFlipOut .2s ease-in both' }
                        : {}
                  }
                >
                  {t}
                </span>
              );
            })
          : after.map((t, i) => {
              const isChanged = i === changedAfterIdx;
              const changedCls = isChanged && flip ? 'bg-rose-100 text-rose-600 border-rose-300' : '';
              return (
                <span
                  key={i}
                  className={`${tokenCls(t)} ${changedCls}`}
                  style={isChanged ? { animation: 'exFlipIn .35s ease-out both' } : {}}
                >
                  {t}
                </span>
              );
            })}
      </div>

      {/* 结论徽章 + 变号后算式 */}
      {phase === 'after' && (
        <div className="flex flex-col items-center gap-2">
          <span
            className={`rounded-full text-sm font-black px-3 py-1 ${flip ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}
            style={pop(0.1)}
          >
            {flip ? '🔄 减号前开括号，符号翻跟头变号！' : '✓ 加号前开括号，不变号直接拆'}
          </span>
          <span className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-1.5 text-lg font-black text-emerald-700" style={pop(0.3)}>
            {after.join(' ')}
          </span>
        </div>
      )}
      {!unlocked && (
        <div className="text-sm font-black text-gray-400">
          {flip ? '括号前面是减号…里面的符号会发生什么？' : '括号前面是加号…里面的符号会变吗？'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 9. 好朋友数凑百（凑整法）：十位凑 9、个位凑 10
// ============================================================================

function HundredPairVisual({ a, b, unlocked }: { a: number; b: number; unlocked: boolean }) {
  const aT = Math.floor(a / 10);
  const aO = a % 10;
  const bT = Math.floor(b / 10);
  const bO = b % 10;

  const DigitBox = ({ n, tone, style }: { n: number; tone: Tone; style?: React.CSSProperties }) => (
    <span className={`w-10 h-14 rounded-xl border-2 text-2xl font-black inline-flex items-center justify-center select-none ${TONE_CLS[tone]}`} style={style}>
      {n}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`好朋友数：${a} 加 ${b} 凑成 100`}>
      <div className="relative w-[320px] max-w-full h-[175px]">
        <svg className="absolute inset-0" width="320" height="175" viewBox="0 0 320 175" aria-hidden>
          {/* 十位弧：上方 */}
          <path d="M 76 44 Q 136 12 196 44" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.2, 0.6)} />
          {/* 个位弧：下方 */}
          <path d="M 118 92 Q 178 126 238 92" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" pathLength={1} style={draw(unlocked, 0.7, 0.6)} />
        </svg>

        {/* 卡片 A：拆成十位 + 个位 */}
        <div className="absolute flex gap-1" style={{ left: 36, top: 44 }}>
          <DigitBox n={aT} tone="violet" />
          <DigitBox n={aO} tone="blue" />
        </div>
        {/* 卡片 B */}
        <div className="absolute flex gap-1" style={{ left: 196, top: 44 }}>
          <DigitBox n={bT} tone="violet" />
          <DigitBox n={bO} tone="blue" />
        </div>
        <div className="absolute" style={{ left: 151, top: 58 }}><OpMark o="+" /></div>

        {/* 弧标签 */}
        {unlocked && (
          <>
            <span className="absolute rounded-full bg-moko-purple/15 text-moko-violet text-xs font-black px-2 py-0.5" style={{ left: 116, top: 4, ...pop(0.6) }}>
              {aT} + {bT} = 9 💜 十位
            </span>
            <span className="absolute rounded-full bg-sky-100 text-sky-600 text-xs font-black px-2 py-0.5" style={{ left: 150, top: 122, ...pop(1.1) }}>
              {aO} + {bO} = 10 💙 个位
            </span>
            <span className="absolute text-xl" style={{ left: 152, top: 22, ...pop(1.4) }}>💞</span>
          </>
        )}
      </div>

      {unlocked && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StepChip text={`${aT * 10} + ${bT * 10} = ${(aT + bT) * 10}`} delay={1.3} />
          <StepChip text={`${(aT + bT) * 10} + ${aO + bO} = 100 💯`} delay={1.7} tone="green" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 10. 带符号搬家：数字背着符号小背包换位置
// ============================================================================

function SignMoveVisual({
  tokens,
  moveFrom,
  unlocked,
}: {
  tokens: { sign: '+' | '-'; n: number }[];
  moveFrom: number;
  unlocked: boolean;
}) {
  const CARD_W = 80;
  const STRIDE = 106;
  const lefts = tokens.map((_, i) => 12 + i * STRIDE);
  // 目标顺序：把 moveFrom 移到最后
  const finalOrder = tokens.map((_, i) => i).filter((i) => i !== moveFrom).concat(moveFrom);

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label="带符号搬家">
      <div className="relative w-[320px] max-w-full h-[130px]">
        {/* 搬家轨迹 */}
        <svg className="absolute inset-0" width="320" height="130" viewBox="0 0 320 130" aria-hidden>
          <defs>
            <marker id="exSmArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="#f43f5e" />
            </marker>
          </defs>
          <path
            d={`M ${lefts[moveFrom] + 40} 96 Q ${(lefts[moveFrom] + lefts[tokens.length - 1]) / 2 + 40} 124 ${lefts[tokens.length - 1] + 40} 96`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
            markerEnd="url(#exSmArrow)"
            pathLength={1}
            style={draw(unlocked, 0.15, 0.7)}
          />
        </svg>

        {tokens.map((t, i) => {
          const targetPos = finalOrder.indexOf(i);
          const dx = (targetPos - i) * STRIDE;
          const moving = i === moveFrom;
          return (
            <div
              key={i}
              className="absolute transition-all duration-700"
              style={{
                left: lefts[i],
                top: 26,
                width: CARD_W,
                transform: unlocked ? `translateX(${dx}px)${moving ? ' rotate(3deg)' : ''}` : 'none',
                transitionTimingFunction: 'cubic-bezier(.68,-0.3,.27,1.3)',
                transitionDelay: unlocked ? (moving ? '0.15s' : '0s') : '0s',
                zIndex: moving ? 10 : 1,
              }}
            >
              <div className={`relative rounded-2xl border-2 bg-white flex items-center justify-center h-16 ${moving && unlocked ? 'border-rose-400 shadow-lg' : 'border-gray-200'}`}>
                {/* 符号小背包 */}
                <span
                  className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full text-white text-base font-black flex items-center justify-center border-2 border-white shadow ${
                    t.sign === '-' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={moving && unlocked ? { animation: 'exPulseSoft 1s ease-in-out infinite' } : {}}
                  title="符号跟着数字一起搬家"
                >
                  {t.sign === '-' ? '−' : '+'}
                </span>
                <span className="text-2xl font-black text-gray-700">{t.n}</span>
                {moving && !unlocked && (
                  <span className="absolute -bottom-2 right-1 text-lg" style={{ animation: 'exPulseSoft 1.4s ease-in-out infinite' }}>🚛</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unlocked && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StepChip
            text={finalOrder.map((i, idx) => {
              const t = tokens[i];
              if (idx === 0) return `${t.n}`;
              return t.sign === '-' ? `− ${t.n}` : `+ ${t.n}`;
            }).join(' ')}
            delay={0.9}
          />
          <span className="text-sm font-black text-rose-500" style={fadeUp(1.1)}>符号背包一起搬走啦！</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 11. 计算过程条：算式 chips 逐条亮起
// ============================================================================

function CalcStripVisual({ steps, unlocked }: { steps: string[]; unlocked: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`计算过程：${steps.join('，')}`}>
      {steps.map((s, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2 transition-colors duration-300 ${
            unlocked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-50'
          }`}
          style={{ transitionDelay: unlocked ? `${i * 0.45}s` : '0s' }}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${unlocked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            {i + 1}
          </span>
          <span className={`text-xl font-black ${unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>{s}</span>
          {unlocked && <span style={pop(i * 0.45 + 0.25)}>✅</span>}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 分发器
// ============================================================================

export function ExampleVisualView({ visual, unlocked }: { visual: ExampleVisual; unlocked: boolean }) {
  switch (visual.kind) {
    case 'ten-frame':
      return <TenFrameVisual a={visual.a} b={visual.b} unlocked={unlocked} />;
    case 'arc-split':
      return <ArcSplitVisual a={visual.a} b={visual.b} unlocked={unlocked} />;
    case 'number-bond':
      return <NumberBondVisual whole={visual.whole} parts={visual.parts} unlocked={unlocked} />;
    case 'dot-take':
      return <DotTakeVisual total={visual.total} take={visual.take} unlocked={unlocked} />;
    case 'number-line':
      return <NumberLineVisual from={visual.from} jumps={visual.jumps} unlocked={unlocked} />;
    case 'swap-pair':
      return <SwapPairVisual a={visual.a} b={visual.b} unlocked={unlocked} />;
    case 'brace-group':
      return <BraceGroupVisual nums={visual.nums} group={visual.group} mode={visual.mode} unlocked={unlocked} />;
    case 'paren-flip':
      return <ParenFlipVisual before={visual.before} after={visual.after} flip={visual.flip} unlocked={unlocked} />;
    case 'hundred-pair':
      return <HundredPairVisual a={visual.a} b={visual.b} unlocked={unlocked} />;
    case 'sign-move':
      return <SignMoveVisual tokens={visual.tokens} moveFrom={visual.moveFrom} unlocked={unlocked} />;
    case 'calc-strip':
      return <CalcStripVisual steps={visual.steps} unlocked={unlocked} />;
    default:
      return null;
  }
}
