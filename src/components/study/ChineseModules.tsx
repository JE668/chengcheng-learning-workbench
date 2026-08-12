'use client';

import { useRef, useState, useEffect } from 'react';
import {
  CHARACTERS,
  CHARACTER_CATEGORIES,
  POEMS,
  TEXTBOOK_CHARACTERS,
  TRACE_CHARS,
  textbookCharsUpTo,
  type CharacterItem,
  type PoemItem,
  type TextbookChar,
} from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';

/* ---------- 识字（按类别） ---------- */
function CharacterCard({ item }: { item: CharacterItem }) {
  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20 text-center">
      <div className="text-xs text-moko-rose/70 font-bold tracking-wide">{item.pinyin}</div>
      <div className="text-5xl font-black text-moko-rose mb-2">{item.char}</div>
      <div className="text-sm text-gray-600">{item.meaning}</div>
      <div className="text-xs text-gray-400 mt-1">{item.strokeCount} 画 · {item.phrase}</div>
      <button
        onClick={() => speakZh(`${item.char}，${item.meaning}。${item.phrase}`)}
        className="mt-2 text-xs px-3 py-1 rounded-full bg-moko-pink text-white font-bold"
      >
        🔊 读一读
      </button>
    </div>
  );
}

export function CharacterModule() {
  return (
    <div className="space-y-8">
      {CHARACTER_CATEGORIES.map((cat) => {
        const items = CHARACTERS.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat}>
            <h2 className="section-title mb-3">✏️ {cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((c) => (
                <CharacterCard key={c.char} item={c} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------- 古诗 ---------- */
function PoemCard({ item }: { item: PoemItem }) {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-purple/20 to-moko-pink/20 shadow-lg border-2 border-moko-purple/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">{item.title}</h3>
        <span className="text-xs text-gray-500">{item.author}</span>
      </div>
      <p className="text-lg leading-loose text-gray-700 font-medium">
        {item.lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < item.lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
      <button onClick={() => speakZh(item.lines.join(''))} className="mt-3 btn btn-violet text-sm">
        🔊 朗读古诗
      </button>
    </div>
  );
}

export function PoemModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {POEMS.map((p) => (
        <PoemCard key={p.title} item={p} />
      ))}
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
        <button onClick={clear} className="flex-1 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
          🧼 擦除重练
        </button>
        <button onClick={() => speakZh(char)} className="flex-1 py-2 rounded-full bg-moko-pink text-white font-bold text-sm">
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
              traceChar === c ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose'
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

/* ---------- 识字闯关（难度自适应） ---------- */
type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

/**
 * 题库跟着课本生字表走（与识字课文、家长听写同源）：
 * 入门只考前两单元（天地人 / 数字 / 自然 / 人体），进阶到第七单元，挑战覆盖全册。
 */
const LEVEL_POOL: Record<DiffLevel, TextbookChar[]> = {
  easy: textbookCharsUpTo(2),
  medium: textbookCharsUpTo(7),
  hard: TEXTBOOK_CHARACTERS,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CharQ {
  mode: 'char2mean' | 'mean2char';
  target: TextbookChar;
  options: string[];
  answer: string;
}

function buildQuestion(level: DiffLevel): CharQ {
  const pool = LEVEL_POOL[level];
  const target = pool[Math.floor(Math.random() * pool.length)];
  if (level === 'hard') {
    const distractors = shuffle(pool.filter((c) => c.char !== target.char))
      .slice(0, 3)
      .map((c) => c.char);
    return { mode: 'mean2char', target, options: shuffle([target.char, ...distractors]), answer: target.char };
  }
  // 释义可能撞车（比如两个字都写「小孩」），撞车的选项会让孩子答对被判错，先过滤掉
  const distractors = shuffle(pool.filter((c) => c.meaning !== target.meaning))
    .slice(0, 3)
    .map((c) => c.meaning);
  return { mode: 'char2mean', target, options: shuffle([target.meaning, ...distractors]), answer: target.meaning };
}

export function CharacterQuizModule() {
  const [level, setLevel] = useState<DiffLevel>('easy');
  const [q, setQ] = useState<CharQ>(() => buildQuestion('easy'));
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const logM = useMistakeLogger();

  useEffect(() => {
    const saved = localStorage.getItem('chineseDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQ(buildQuestion(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chineseDiffLevel', level);
  }, [level]);

  function nextRound(newLevel: DiffLevel) {
    setLevel(newLevel);
    setPicked(null);
    setQ(buildQuestion(newLevel));
  }

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const ok = opt === q.answer;
    speakZh(ok ? '答对啦！' : `不对哦，${q.target.char} 是 ${q.target.meaning}`);
    let nl = level;
    if (ok) {
      const nr = streak.right + 1;
      setStreak({ right: nr, wrong: 0 });
      if (nr >= 3 && level !== 'hard') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
    } else {
      const nw = streak.wrong + 1;
      setStreak({ right: 0, wrong: nw });
      if (nw >= 2 && level !== 'easy') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1];
      logM({
        subject: '语文',
        kind: '识字',
        prompt: `${q.target.char} 是什么意思？`,
        answer: q.target.meaning,
        wrong: opt,
        chapter: q.target.unit, // 带上课本单元，家长端错题本能看出是哪一单元没过关
      });
    }
    setTimeout(() => nextRound(nl), ok ? 1400 : 1700);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">难度：{meta.emoji} {meta.label}</span>
        <span className="text-xs opacity-90">连对 {streak.right} · 自动调整中</span>
      </div>
      <div className="text-center mb-4">
        {q.mode === 'char2mean' ? (
          <>
            <div className="text-sm font-bold opacity-90">{q.target.pinyin}</div>
            <div className="text-6xl font-black mb-1">{q.target.char}</div>
            <button
              onClick={() => speakZh(q.target.char)}
              className="text-xs px-3 py-1 rounded-full bg-white/30 font-bold active:scale-95 transition"
            >
              🔊 读一读
            </button>
            <div className="text-sm mt-2 opacity-95">这个字是什么意思？</div>
          </>
        ) : (
          <div className="text-base font-bold">哪个字的意思是「{q.target.meaning}」？</div>
        )}
        <div className="text-[11px] mt-2 opacity-80">
          课本第 {q.target.chapter} 单元 · {q.target.unit}
        </div>
      </div>
      <div className={`grid gap-2 ${q.mode === 'mean2char' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          let cls = 'bg-white text-moko-rose border-2 border-moko-rose';
          if (picked) {
            if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
            else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
            else cls = 'bg-white text-moko-rose border-2 border-moko-rose opacity-60';
          }
          return (
            <button
              key={opt}
              disabled={!!picked}
              onClick={() => choose(opt)}
              className={`py-3 rounded-xl font-black shadow active:scale-95 transition disabled:cursor-default ${
                q.mode === 'mean2char' ? 'text-3xl' : 'text-lg'
              } ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
