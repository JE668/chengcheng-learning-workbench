'use client';

// ⚠️ 直接从具体子模块导入，不要走 `@/lib/study-data` barrel（barrel 的 export *
// 会把全部 ~110KB 数据打进 chunk，见拆分前的 ChineseModules 原注释）。

import { useRef, useState, useEffect } from 'react';
import { TRACE_CHARS } from '@/lib/study-data/texts';
import { speakZh } from '@/lib/speak';

function TracingCard({ char }: { char: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    drawTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  function drawTemplate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#ffe4ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 0);
    ctx.lineTo(rect.width / 2, rect.height);
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.font = 'bold 140px ui-rounded, Hiragino Maru Gothic ProN, sans-serif';
    ctx.fillStyle = 'rgba(255, 93, 160, 0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, rect.width / 2, rect.height / 2 + 8);
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#FF5DA0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  function end() {
    setDrawing(false);
  }
  function clear() {
    drawTemplate();
  }

  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20">
      <div className="text-center text-sm text-gray-500 mb-2">用手指或鼠标跟着写「{char}」</div>
      <canvas
        ref={canvasRef}
        className="w-full h-48 rounded-xl bg-pink-50 touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={clear}
          className="flex-1 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm"
        >
          🧼 擦除重练
        </button>
        <button
          onClick={() => speakZh(char)}
          className="flex-1 py-2 rounded-full bg-moko-pink text-white font-bold text-sm"
        >
          🔊 读字
        </button>
      </div>
    </div>
  );
}

export function TraceModule() {
  const [traceChar, setTraceChar] = useState('人');
  const traceChars = TRACE_CHARS;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {traceChars.map((c) => (
          <button
            key={c}
            onClick={() => setTraceChar(c)}
            className={`w-10 h-10 rounded-full font-black text-lg transition ${
              traceChar === c
                ? 'bg-moko-rose text-white'
                : 'bg-white text-moko-rose border-2 border-moko-rose'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <TracingCard char={traceChar} />
    </div>
  );
}

