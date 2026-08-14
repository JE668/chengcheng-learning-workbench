'use client';

import { useState, useEffect } from 'react';
import {
  STROKES,
  RADICALS,
  STROKE_RULES,
  TEXT_CHAR_LESSONS,
  SPLITS,
  type TextCharLesson,
  type TextCharItem,
} from '@/lib/study-data';
import { RAZ_BOOKS, type RazBook } from '@/lib/raz-books';
import { speakZh, speakEn } from '@/lib/speak';
import PdfViewer from '@/components/PdfViewer';
import { mediaUrl } from '@/lib/media';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   语文 · 笔画与偏旁
   ============================================================ */
function StrokeCard({ stroke, name, example, dir }: { stroke: string; name: string; example: string; dir: string }) {
  return (
    <button
      onClick={() => speakZh(`${name}，${example.replace(/\s+/g, '')}。${dir}`)}
      className="rounded-2xl p-3 bg-white shadow-lg border-2 border-moko-pink/20 text-center active:scale-95 transition"
    >
      <div className="text-4xl font-black text-moko-rose mb-1">{stroke}</div>
      <div className="text-sm font-bold text-gray-700">{name}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{example}</div>
      <div className="text-[10px] text-moko-rose/70 mt-0.5">{dir}</div>
    </button>
  );
}

function RadicalCard({ radical, name, examples }: { radical: string; name: string; examples: string[] }) {
  return (
    <button
      onClick={() => speakZh(`${name}，${examples.join('')}`)}
      className="rounded-2xl p-3 bg-white shadow-lg border-2 border-moko-purple/20 text-center active:scale-95 transition"
    >
      <div className="text-3xl font-black text-moko-violet mb-1">{radical}</div>
      <div className="text-sm font-bold text-gray-700">{name}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{examples.join(' ')}</div>
    </button>
  );
}

export function StrokeRadicalModule() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-black text-moko-rose mb-1">📏 笔顺规则口诀</h2>
        <p className="text-sm text-gray-500 mb-3">记住口诀，写字就不容易写错顺序啦～</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {STROKE_RULES.map((r) => (
            <div key={r.name} className="rounded-2xl p-3 bg-white shadow-lg border-2 border-moko-rose/20 text-center">
              <div className="text-2xl mb-1">{r.emoji}</div>
              <div className="font-bold text-moko-rose text-sm">{r.name}</div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">{r.rhyme}</div>
              <div className="text-xs text-gray-400 mt-1">例字：{r.examples.join(' ')}</div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-black text-moko-rose mb-1">✍️ 基本笔画</h2>
        <p className="text-sm text-gray-500 mb-3">点一点，听一听每一笔怎么写～</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {STROKES.map((s) => (
            <StrokeCard key={s.name} {...s} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="section-title mb-1">🧩 常用偏旁部首</h2>
        <p className="text-sm text-gray-500 mb-3">认识偏旁，认字更快哦！</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {RADICALS.map((r) => (
            <RadicalCard key={r.name} {...r} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   语文 · 课文生字（一年级上册课文 1~14）
   ============================================================ */
function TextCharCard({ item }: { item: TextCharItem }) {
  return (
    <button
      onClick={() => speakZh(`${item.char}，${item.phrase}`)}
      className="rounded-xl px-3 py-2 bg-moko-pink/10 border-2 border-moko-pink/30 text-center active:scale-95 transition"
    >
      <div className="text-2xl font-black text-moko-rose">{item.char}</div>
      <div className="text-[10px] text-gray-500">{item.phrase}</div>
    </button>
  );
}

export function TextCharModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {TEXT_CHAR_LESSONS.map((lesson: TextCharLesson) => (
        <div key={lesson.title} className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{lesson.emoji}</span>
            <h3 className="text-lg font-black text-moko-rose">{lesson.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lesson.items.map((it) => (
              <TextCharCard key={it.char + it.phrase} item={it} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   数学 · 分与合（2~10）
   ============================================================ */
interface SplitQ {
  known: number;
  ans: number;
  opts: number[];
}

function makeSplitQ(num: number): SplitQ {
  const s = SPLITS.find((x) => x.num === num)!;
  const pair = s.pairs[Math.floor(Math.random() * s.pairs.length)];
  const showFirst = Math.random() > 0.5;
  const known = showFirst ? pair[0] : pair[1];
  const ans = showFirst ? pair[1] : pair[0];
  const pool = Array.from({ length: num + 1 }, (_, i) => i);
  const opts = shuffle(pool.filter((o) => o !== known)).slice(0, 3);
  if (!opts.includes(ans)) opts[Math.floor(Math.random() * opts.length)] = ans;
  return { known, ans, opts: shuffle(opts) };
}

export function SplitModule() {
  const [num, setNum] = useState(5);
  const split = SPLITS.find((s) => s.num === num)!;
  const [q, setQ] = useState<SplitQ>(() => makeSplitQ(5));
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setQ(makeSplitQ(num));
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num]);

  function choose(o: number) {
    if (picked !== null) return;
    setPicked(o);
    const ok = o === q.ans;
    speakZh(ok ? '答对啦！' : `应该是 ${q.ans}`);
    if (ok) {
      setTimeout(() => setQ(makeSplitQ(num)), 1300);
      setPicked(null);
    } else {
      setTimeout(() => setPicked(null), 1500);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SPLITS.map((s) => (
          <button
            key={s.num}
            onClick={() => setNum(s.num)}
            className={`w-11 h-11 rounded-full font-black text-lg transition active:scale-95 ${
              num === s.num ? 'bg-moko-blue text-white shadow' : 'bg-white text-moko-blue border-2 border-moko-blue'
            }`}
          >
            {s.num}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/20">
        <h3 className="text-lg font-black text-moko-blue mb-3">🌟 {num} 的分与合</h3>
        <div className="flex flex-wrap gap-2">
          {split.pairs.map(([a, b], i) => (
            <button
              key={i}
              onClick={() => speakZh(`${num} 可以分成 ${a} 和 ${b}`)}
              className="px-3 py-2 rounded-xl bg-moko-blue/10 border-2 border-moko-blue/30 font-bold text-moko-blue text-lg active:scale-95 transition"
            >
              {num} = {a} + {b}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">点一点，听「{num} 可以分成几和几」。</p>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-cyan to-sky-300 text-white shadow-lg">
        <div className="text-center text-xl font-black mb-1">正正萌可分糖果 🍬</div>
        <p className="text-center text-sm opacity-90 mb-4">
          把 {num} 颗糖果分成 {q.known} 和 几？
        </p>
        <div className="flex justify-center gap-3">
          {q.opts.map((o) => {
            const isAnswer = o === q.ans;
            const isPicked = o === picked;
            let cls = 'bg-white text-moko-cyan border-2 border-white';
            if (picked !== null) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = 'bg-white text-moko-cyan border-2 border-white opacity-60';
            }
            return (
              <button
                key={o}
                disabled={picked !== null}
                onClick={() => choose(o)}
                className={`w-16 h-16 rounded-2xl font-black text-3xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   英语 · RAZ AA 点读绘本（真实 PDF 绘本 + 动画视频）
   ============================================================ */
function ReaderCard({ book }: { book: RazBook }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl shadow-lg border-2 border-white/40 overflow-hidden bg-moko-yellow text-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition"
      >
        <span className="text-3xl">{book.hasPdf ? '📖' : '🎬'}</span>
        <span className="flex-1">
          <span className="block text-lg font-black">
            {book.id} · {book.title}
          </span>
          <span className="block text-xs opacity-90">
            RAZ AA · {book.hasPdf ? '绘本 + 动画' : '动画'}
          </span>
        </span>
        <span className="text-2xl">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 bg-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => speakEn(book.title)}
              className="flex-1 py-2 rounded-full bg-white text-moko-violet font-bold text-sm active:scale-95 transition"
            >
              🔊 读标题
            </button>
            {book.hasPdf && (
              <a
                href={mediaUrl(`/raz/books/${book.id}.pdf`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2 rounded-full bg-white text-moko-violet font-bold text-sm active:scale-95 transition"
              >
                ↗ 新窗口读绘本
              </a>
            )}
          </div>
          <div className="max-w-2xl mx-auto">
            <video
              src={mediaUrl(`/raz/videos/${book.id}.mp4`)}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[55vh] object-contain rounded-xl bg-black"
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
          {book.hasPdf && (
            <div className="w-full max-h-[60vh] sm:max-h-[70vh] overflow-auto rounded-xl bg-white">
              <PdfViewer url={mediaUrl(`/raz/books/${book.id}.pdf`)} className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RazReaderModule() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        🎵 唱唱萌可带你读 RAZ AA 绘本～点开一本书，先看动画听发音，再翻绘本跟读；点「读标题」听单词发音！
      </p>
      {RAZ_BOOKS.map((b) => (
        <ReaderCard key={b.id} book={b} />
      ))}
    </div>
  );
}
