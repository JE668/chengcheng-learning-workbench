'use client';

import { useState, useEffect, useRef } from 'react';
import { speakZh } from '@/lib/speak';

interface EyeSection {
  name: string;
  emoji: string;
  where: string;
  how: string;
}

// 中小学标准眼保健操四节（2008 版）：穴位 + 手法
const SECTIONS: EyeSection[] = [
  {
    name: '第一节 · 按揉攒竹穴',
    emoji: '👀',
    where: '眉头凹陷处（攒竹穴）',
    how: '双手大拇指指腹，轻轻按揉眉上的凹陷处，其余四指自然放松，跟着节奏一按一松。',
  },
  {
    name: '第二节 · 按压睛明穴',
    emoji: '👃',
    where: '鼻梁根部两侧（睛明穴）',
    how: '双手食指指腹，按住鼻梁根部靠近内眼角的穴位，有节奏地向下按、向上挤。',
  },
  {
    name: '第三节 · 按揉四白穴',
    emoji: '😊',
    where: '眼眶正下方（四白穴）',
    how: '双手食指指腹，按揉眼眶下方的凹陷处，顺时针轻轻揉动，酸酸胀胀就对了。',
  },
  {
    name: '第四节 · 按太阳穴 · 轮刮眼眶',
    emoji: '🌞',
    where: '太阳穴 + 上下眼眶',
    how: '大拇指按住太阳穴，食指弯曲，从内向外轮刮上眼眶，再从内向外轮刮下眼眶。',
  },
];

const SECONDS = 16; // 每节约 16 秒（8 个八拍）

export default function EyeCareModule() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(SECONDS);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          // 本节结束
          if (step >= SECTIONS.length - 1) {
            setRunning(false);
            setDone(true);
            return SECONDS;
          }
          const next = step + 1;
          setStep(next);
          speakZh(SECTIONS[next].name);
          return SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  function start() {
    setDone(false);
    setStep(0);
    setSecs(SECONDS);
    speakZh(SECTIONS[0].name);
    setRunning(true);
  }

  function restart() {
    setRunning(false);
    setDone(false);
    setStep(0);
    setSecs(SECONDS);
  }

  const cur = SECTIONS[step];
  const progress = ((SECONDS - secs) / SECONDS) * 100;

  return (
    <div className="rounded-3xl p-6 shadow-xl border-2 border-moko-mint/30 bg-white">
      {/* 进度圆点 */}
      <div className="flex justify-center gap-2 mb-4">
        {SECTIONS.map((s, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition ${i < step || done ? 'bg-moko-mint' : i === step && running ? 'bg-moko-cyan animate-pulse' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {done ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-3">🌟</div>
          <h3 className="text-2xl font-black text-moko-violet mb-2">四节都做完啦！</h3>
          <p className="text-gray-600 mb-5">眼睛放松一下，看看远处绿绿的树吧～</p>
          <button onClick={restart} className="rounded-2xl px-6 py-3 bg-moko-mint text-white font-black shadow hover:scale-105 transition">
            🔄 再做一次
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="text-6xl mb-2">{cur.emoji}</div>
            <h3 className="text-xl font-black text-moko-violet mb-1">{cur.name}</h3>
            <p className="text-sm text-gray-500 mb-3">📍 {cur.where}</p>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-4">{cur.how}</p>
          </div>

          {/* 倒计时进度 */}
          <div className="max-w-xs mx-auto mb-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>第 {step + 1} / {SECTIONS.length} 节</span>
              <span>{running ? `${secs} 秒` : '准备好了吗？'}</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-moko-mint to-moko-cyan transition-all" style={{ width: `${running ? progress : 0}%` }} />
            </div>
          </div>

          <div className="flex justify-center">
            {!running ? (
              <button onClick={start} className="rounded-2xl px-8 py-3 bg-moko-violet text-white font-black shadow hover:scale-105 transition">
                ▶️ 开始做眼保健操
              </button>
            ) : (
              <button onClick={() => setRunning(false)} className="rounded-2xl px-8 py-3 bg-gray-300 text-gray-700 font-black shadow hover:scale-105 transition">
                ⏸ 暂停
              </button>
            )}
          </div>
          {running && (
            <p className="text-center text-xs text-gray-400 mt-3">闭眼放松，跟着节奏轻轻按揉，做完这一节自动进入下一节 💆</p>
          )}
        </>
      )}
    </div>
  );
}
