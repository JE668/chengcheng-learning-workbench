'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PINYIN_AOE,
  PINYIN_SIMPLE,
  CHARACTERS_L1,
  POEMS,
  type PinyinItem,
  type CharacterItem,
  type PoemItem,
} from '@/lib/study-data';

function speak(text: string, rate = 0.85) {
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = rate;
  u.pitch = 1.1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ---------- 拼音卡片 ---------- */
function PinyinCard({ item }: { item: PinyinItem }) {
  const [show, setShow] = useState(false);
  return (
    <button
      onClick={() => {
        setShow(true);
        speak(item.pinyin);
      }}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-pink to-moko-rose text-white shadow-lg active:scale-95 transition text-center"
    >
      <div className="text-4xl font-black mb-1">{item.pinyin}</div>
      <div className="text-sm opacity-90">{show ? item.examples.join(' · ') : '点我读一读'}</div>
    </button>
  );
}

/* ---------- 汉字卡片 ---------- */
function CharacterCard({ item }: { item: CharacterItem }) {
  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20 text-center">
      <div className="text-5xl font-black text-moko-rose mb-2">{item.char}</div>
      <div className="text-sm text-gray-600">{item.meaning}</div>
      <div className="text-xs text-gray-400 mt-1">{item.strokeCount} 画 · {item.phrase}</div>
      <button
        onClick={() => speak(`${item.char}，${item.meaning}。${item.phrase}`)}
        className="mt-2 text-xs px-3 py-1 rounded-full bg-moko-pink text-white font-bold"
      >
        🔊 读一读
      </button>
    </div>
  );
}

/* ---------- 古诗卡片 ---------- */
function PoemCard({ item }: { item: PoemItem }) {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-purple/20 to-moko-pink/20 shadow-lg border-2 border-moko-purple/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black text-moko-violet">{item.title}</h3>
        <span className="text-xs text-gray-500">{item.author}</span>
      </div>
      <p className="text-lg leading-loose text-gray-700 font-medium">
        {item.lines.map((l, i) => (
          <span key={i}>{l}{i < item.lines.length - 1 ? <br /> : null}</span>
        ))}
      </p>
      <button
        onClick={() => speak(item.lines.join(''))}
        className="mt-3 btn-magic bg-moko-purple text-white text-sm"
      >
        🔊 朗读古诗
      </button>
    </div>
  );
}

/* ---------- 描红 Canvas ---------- */
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

    // 背景格
    ctx.strokeStyle = '#ffe4ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 0);
    ctx.lineTo(rect.width / 2, rect.height);
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();

    // 范字（浅粉色）
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
        <button onClick={clear} className="flex-1 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
          🧼 擦除重练
        </button>
        <button onClick={() => speak(char)} className="flex-1 py-2 rounded-full bg-moko-pink text-white font-bold text-sm">
          🔊 读字
        </button>
      </div>
    </div>
  );
}

export default function ChineseStudyPage() {
  const [traceChar, setTraceChar] = useState('人');
  const traceChars = ['人', '口', '日', '月', '水', '火', '大', '小', '上', '下'];

  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-rose mb-2">📖 语文小天地</h1>
      <p className="text-gray-600 mb-6">拼音、识字、古诗、描红，和爱心萌可一起学语文～</p>

      {/* 拼音 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🔤 单韵母 & 声母</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PINYIN_AOE.map((p) => (
            <PinyinCard key={p.pinyin} item={p} />
          ))}
        </div>
      </section>

      {/* 两拼音节 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🧩 两拼音节</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {PINYIN_SIMPLE.map((p) => (
            <PinyinCard key={p.pinyin} item={p} />
          ))}
        </div>
      </section>

      {/* 识字 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">✏️ 人教版一年级识字</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CHARACTERS_L1.map((c) => (
            <CharacterCard key={c.char} item={c} />
          ))}
        </div>
      </section>

      {/* 古诗 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🌙 古诗词</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {POEMS.map((p) => (
            <PoemCard key={p.title} item={p} />
          ))}
        </div>
      </section>

      {/* 描红 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">✍️ 描红练习</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {traceChars.map((c) => (
            <button
              key={c}
              onClick={() => setTraceChar(c)}
              className={`w-10 h-10 rounded-full font-black text-lg transition ${
                traceChar === c ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <TracingCard char={traceChar} />
      </section>
    </div>
  );
}
