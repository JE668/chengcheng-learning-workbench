'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { CHARACTERS } from '@/lib/study-data/characters';
import { TRACE_CHARS } from '@/lib/study-data/texts';

import { speakZh } from '@/lib/speak';
import { trackActivity } from '@/lib/activity';
import { ClayCard, ClayButton } from '@/components/design-system';

const CHAR_INFO = new Map(CHARACTERS.map((c) => [c.char, c]));

export default function TracePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const char = TRACE_CHARS[idx];
  const info = CHAR_INFO.get(char);

  const size = 320; // logical canvas size

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = size;
      ctx.clearRect(0, 0, s, s);
      // 米字格背景
      ctx.strokeStyle = '#f3c6d6';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, s - 12, s - 12);
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(s / 2, 6);
      ctx.lineTo(s / 2, s - 6);
      ctx.moveTo(6, s / 2);
      ctx.lineTo(s - 6, s / 2);
      // 对角线
      ctx.moveTo(6, 6);
      ctx.lineTo(s - 6, s - 6);
      ctx.moveTo(s - 6, 6);
      ctx.lineTo(6, s - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      // 描红范字（浅灰）
      ctx.fillStyle = '#d9d9d9';
      ctx.font = `bold ${s * 0.62}px "Kaiti SC","KaiTi","STKaiti",serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, s / 2, s / 2 + s * 0.02);
    },
    [char]
  );

  const redraw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx);
  }, [drawGrid]);

  // 初次挂载 + 切字时重绘
  useEffect(() => {
    redraw();
    setDone(false);
  }, [redraw, idx]);

  // 高分屏适配
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    redraw();
  }, [redraw]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * size,
      y: ((e.clientY - rect.top) / rect.height) * size,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.strokeStyle = '#e8456b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const onUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => redraw();
  const read = () => speakZh(char, 0.7);
  const readPhrase = () => info?.phrase && speakZh(info.phrase, 0.75);

  const prev = () => setIdx((i) => (i - 1 + TRACE_CHARS.length) % TRACE_CHARS.length);
  const next = () => {
    setDone(true);
    trackActivity('trace');
    setTimeout(() => setIdx((i) => (i + 1) % TRACE_CHARS.length), 350);
  };

  return (
    <div className="max-w-3xl mx-auto fade-up">
      <Link href="/study" className="text-moko-violet font-black no-underline">
        ‹ 返回学习城堡
      </Link>
      <h1 className="page-title mt-2 mb-1">描红跟写 ✍️</h1>
      <p className="text-gray-600 mb-5">
        沿着灰色范字一笔一画描红，写完点「下一个」换字。共 {TRACE_CHARS.length} 个字可以练。
      </p>

      <ClayCard theme="violet" className="p-6 flex flex-col items-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            style={{ width: size, height: size, touchAction: 'none' }}
            className="rounded-2xl bg-white cursor-crosshair"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          />
          {done && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-6xl animate-bounce">🌸</span>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <div className="text-5xl font-black text-moko-violet">{char}</div>
          {info && (
            <div className="text-gray-600 mt-1">
              {info.meaning} · 共 {info.strokeCount} 画
            </div>
          )}
          {info?.phrase && <div className="text-sm text-gray-400 mt-1">词语：{info.phrase}</div>}
        </div>

        <div className="flex flex-wrap gap-3 justify-center mt-5">
          <ClayButton variant="brand" size="lg" onClick={read}>
            🔊 听读音
          </ClayButton>
          <ClayButton variant="cyan" size="lg" onClick={readPhrase}>
            📖 听词语
          </ClayButton>
          <ClayButton variant="outline" size="lg" onClick={clear}>
            🧽 重写
          </ClayButton>
        </div>

        <div className="flex items-center gap-6 mt-6">
          <ClayButton variant="gold" size="xl" onClick={prev}>
            ‹
          </ClayButton>
          <span className="text-gray-500 font-black">
            {idx + 1} / {TRACE_CHARS.length}
          </span>
          <ClayButton variant="pink" size="xl" onClick={next}>
            ›
          </ClayButton>
        </div>
      </ClayCard>

      <ClayCard className="mt-6 p-5">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 描红小窍门</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>用指尖或鼠标顺着灰色字慢慢写，笔顺和范字一样才漂亮。</li>
          <li>写之前先听两遍读音，记住这个字怎么读、什么意思。</li>
          <li>写歪了没关系，点「重写」再来一次就好。</li>
        </ul>
      </ClayCard>
    </div>
  );
}
