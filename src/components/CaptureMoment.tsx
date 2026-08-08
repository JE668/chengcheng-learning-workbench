'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';

/**
 * 捕捉演出弹层 —— 把「捕捉到萌可」从一行 toast 升级成一场小仪式。
 *
 * 流程（phase 状态机驱动，配合 Tailwind transition / CSS keyframes）：
 *   0 聚光 → 1 绽放(立绘弹入) → 2 定格(光晕脉动) → 3 语音+台词 → 交互
 * 挂载后自动播放该萌可的口头禅(说话感)，制造「它活过来了」的代入感。
 */
export interface CapturePayload {
  name: string;
  img: string;
  emoji: string;
  line?: string; // 萌可口头禅（用于语音 + 台词气泡）
}

const STEP_MS = 650;

export function CaptureMoment({ data, onClose }: { data: CapturePayload; onClose: () => void }) {
  const [phase, setPhase] = useState(0);

  // phase 状态机推进（演出完成后停在最终交互态）
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 350)); // 聚光 → 绽放
    timers.push(setTimeout(() => setPhase(2), 350 + STEP_MS)); // 绽放 → 定格
    timers.push(setTimeout(() => setPhase(3), 350 + STEP_MS * 2)); // 定格 → 语音/台词
    timers.push(setTimeout(() => setPhase(4), 350 + STEP_MS * 2 + 900)); // 语音后进入可交互
    return () => timers.forEach(clearTimeout);
  }, []);

  const showLight = phase >= 1;
  const showMoko = phase >= 2;
  const showName = phase >= 3;
  const showLine = phase >= 3;
  const interactive = phase >= 4;

  // 聚光一出现就播萌可口头禅配音，让声音与演出同步开始（仅一次防重复）
  const voicedRef = useRef(false);
  useEffect(() => {
    if (showLight && data.line && !voicedRef.current) {
      voicedRef.current = true;
      speakZh(data.line, 0.9);
    }
  }, [showLight, data.line]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" />

      {/* 演出舞台 */}
      <div className="relative flex flex-col items-center px-6 text-center">
        {/* 聚光 / 闪光光晕 */}
        <div
          className={`pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-all duration-500 ${
            showLight ? 'w-[420px] h-[420px] animate-[ray_1.4s_ease-out_infinite]' : 'w-0 h-0'
          }`}
          style={{
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(255,214,120,0.55) 0%, rgba(253,164,175,0.35) 45%, transparent 70%)',
          }}
        />

        {/* 萌可立绘：外层柔和浮动 + 内层精灵球弹出入场 + 背后的捕捉光晕环 */}
        <div
          className={`transition-opacity duration-500 ${showMoko ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="relative">
            {/* 捕捉光晕环（box-shadow 金色脉动） */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full moko-capture-glow"
              style={{ opacity: showMoko ? 1 : 0, transition: 'opacity .5s' }}
            />
            {/* 立绘（mokoPop 弹入） */}
            <div
              className="w-52 h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-8 border-white/90 shadow-2xl"
              style={{
                animation: showMoko ? 'mokoPop .7s cubic-bezier(.34,1.56,.64,1)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.img} alt={data.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* 名字 */}
        <h2
          className={`mt-6 text-3xl md:text-4xl font-black text-white drop-shadow-lg transition-all duration-500 ${
            showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          ✨ {data.name}
        </h2>

        {/* 台词气泡 */}
        <div
          className={`mt-4 max-w-sm rounded-3xl bg-white/95 px-5 py-3 shadow-xl transition-all duration-500 ${
            showLine ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <p className="text-gray-700 font-bold leading-relaxed">
            {data.line ? `「${data.line}」` : '和我一起，陪你慢慢长大～'}
          </p>
        </div>

        {/* 操作 */}
        <div
          className={`mt-6 flex gap-3 transition-all duration-500 ${
            interactive ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          <Link
            href="/castle"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black shadow hover:scale-105 transition"
          >
            🏰 入住城堡
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full bg-white/25 text-white font-black shadow hover:scale-105 transition"
          >
            再逛逛 ›
          </button>
        </div>
      </div>
    </div>
  );
}