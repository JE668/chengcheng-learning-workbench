'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { CHAR_UNIT_OPTIONS, STROKE_ORDER_CHARS, strokeOrderByChapter } from '@/lib/study-data/units';
import { speakZh } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

function StrokeOrderCard({
  item,
  learned,
  onLearned,
}: {
  item: { char: string; py: string; mean: string };
  learned?: boolean;
  onLearned?: () => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  // 笔顺数据加载状态：hanzi-writer 的 create 是同步返回的，字形数据异步拉取；
  // 数据没到位时点「写一写/笔顺」无任何反应——所以显式追踪加载态，失败时给提示。
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    const el = elRef.current;
    setLoadState('loading');
    import('hanzi-writer').then((mod: any) => {
      const HW = mod.default ?? mod;
      if (!active || !el) return;
      el.innerHTML = '';
      writerRef.current = HW.create(el, item.char, {
        width: 220,
        height: 220,
        padding: 10,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#FF5DA0',
        radicalColor: '#ef4444',
        outlineColor: '#fbcfe8',
        // 关键修复：默认会去 cdn.jsdelivr.net 拉笔画数据，国内网络经常超时，
        // 表现为「点笔顺按钮没反应」。改为加载 public/hanzi/ 下的同源静态文件
        //（由 scripts/prepare-hanzi-data.mjs 从 hanzi-writer-data 包生成，全册生字都覆盖）。
        charDataLoader: (char: string) =>
          fetch(`/hanzi/${encodeURIComponent(char)}.json`).then((r) => {
            if (!r.ok) throw new Error(`no stroke data for ${char}`);
            return r.json();
          }),
        onLoadCharDataSuccess: () => {
          if (active) setLoadState('ready');
        },
        onLoadCharDataError: () => {
          if (active) setLoadState('error');
        },
      });
    });
    return () => {
      active = false;
      if (el) el.innerHTML = '';
      writerRef.current = null;
    };
  }, [item.char]);

  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20 text-center">
      <div className="relative mx-auto w-[220px] h-[220px]">
        <div ref={elRef} className="w-full h-full" />
        {loadState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            ✍️ 笔画加载中…
          </div>
        )}
        {loadState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm px-4">
            😢「{item.char}」的笔画数据加载失败，请刷新重试
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-moko-rose mt-1">
        {item.char} <span className="text-sm text-gray-400">{item.py}</span>
      </div>
      <div className="text-sm text-gray-500 mb-3">{item.mean}</div>
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          onClick={() => loadState === 'ready' && writerRef.current?.animateCharacter()}
          disabled={loadState !== 'ready'}
          className="px-3 py-1 rounded-full bg-moko-pink text-white font-bold text-xs active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶️ 写一写
        </button>
        <button
          onClick={() => loadState === 'ready' && writerRef.current?.loopCharacterAnimation()}
          disabled={loadState !== 'ready'}
          className="px-3 py-1 rounded-full bg-moko-rose text-white font-bold text-xs active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          👀 笔顺
        </button>
        <button
          onClick={() => speakZh(item.char)}
          className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-xs active:scale-95 transition"
        >
          🔊 读字
        </button>
        <button
          onClick={() => onLearned?.()}
          className={`px-3 py-1 rounded-full font-bold text-xs active:scale-95 transition ${learned ? 'bg-green-500 text-white' : 'bg-moko-blue/80 text-white'}`}
        >
          {learned ? '✅ 已学会' : '✓ 我会写啦'}
        </button>
      </div>
    </div>
  );
}

export function StrokeOrderModule() {
  const [chapter, setChapter] = useState(0); // 0 = 全册
  const [idx, setIdx] = useState(0);
  const [learned, setLearned] = useState<string[]>([]);
  const { record } = useModuleProgress('chinese', 'strokes-order');
  const chars = useMemo(() => strokeOrderByChapter(chapter), [chapter]);
  const item = chars[idx % chars.length];
  function learn(char: string) {
    if (learned.includes(char)) return;
    const next = [...learned, char];
    setLearned(next);
    record(Math.min(3, Math.ceil(next.length / 7)));
  }
  function pickChapter(c: number) {
    setChapter(c);
    setIdx(0);
  }
  return (
    <div className="space-y-4">
      {/* 按课本单元挑字：和识字课文、家长听写用的是同一份生字表 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => pickChapter(0)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
            chapter === 0
              ? 'bg-moko-rose text-white'
              : 'bg-white text-moko-rose border-2 border-moko-rose/40'
          }`}
        >
          📚 全册 {STROKE_ORDER_CHARS.length} 字
        </button>
        {CHAR_UNIT_OPTIONS.filter((u) => u.count > 0).map((u) => (
          <button
            key={u.chapter}
            onClick={() => pickChapter(u.chapter)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
              chapter === u.chapter
                ? 'bg-moko-rose text-white'
                : 'bg-white text-moko-rose border-2 border-moko-rose/40'
            }`}
          >
            {u.emoji} 第{u.chapter}单元 {u.count}
          </button>
        ))}
      </div>
      <StrokeOrderCard
        item={item}
        learned={learned.includes(item.char)}
        onLearned={() => learn(item.char)}
      />
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIdx((i) => i - 1 + chars.length)}
          className="px-5 py-2 rounded-full bg-moko-pink/20 text-moko-rose font-bold text-sm active:scale-95 transition"
        >
          ‹ 上一个
        </button>
        <span className="text-xs text-gray-400 font-bold">
          {(idx % chars.length) + 1} / {chars.length}
        </span>
        <button
          onClick={() => setIdx((i) => i + 1)}
          className="px-5 py-2 rounded-full bg-moko-pink/20 text-moko-rose font-bold text-sm active:scale-95 transition"
        >
          下一个 ›
        </button>
      </div>
      <div className="rounded-2xl p-4 bg-white shadow border-2 border-moko-pink/10 text-center text-sm text-gray-500">
        记住每一笔的先后顺序，写字会更漂亮哦～
      </div>
    </div>
  );
}

/* ========================================================================
 * 课文阅读理解
 * ===================================================================== */