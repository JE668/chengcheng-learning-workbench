'use client';

import { useEffect, useRef, useState } from 'react';
import type { CharacterJson } from 'hanzi-writer';

/**
 * 🖌 笔顺动画（⑥号内容升级 2026-10-21）
 *
 * 一年级刚需：笔顺规范。识字卡上「笔顺」按钮 → 全屏遮罩逐画动画。
 * - 笔顺数据放在 public/hanzi/*.json，按字按需加载，不进 JS bundle；
 *   Service Worker 对 /hanzi/ 使用 Cache First，二次访问离线可用。
 * - hanzi-writer 渲染（MIT）：strokes SVG path + medians 引导线
 * - 字无数据时入口自动隐藏（数据覆盖 299/299，防御旧库新字）
 * - 许可合规：字型 APL/Arphic，见 docs/ARPHICPL.txt
 */
export default function StrokePlayer({ char, onClose }: { char: string; onClose: () => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [writerInst, setWriterInst] = useState<{
    animateCharacter: (opts?: { onComplete?: () => void }) => void;
  } | null>(null);
  // 2026-11-10 第三轮审查：补加载三态（对齐 chinesenew/StrokeOrderModule 的既有写法）。
  // 此前 charDataLoader 失败（离线首装/弱网/SW 返回 503 兜底）会让 hanzi-writer
  // unhandled rejection，UI 停留在空盒子、「再看一遍」点了也没反应——孩子无感知。
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import('hanzi-writer');
      const HanziWriter = mod.default;
      if (cancelled || !elRef.current) return;
      elRef.current.innerHTML = '';
      const writer = HanziWriter.create(elRef.current, char, {
        width: 280,
        height: 280,
        padding: 8,
        strokeColor: '#d63384', // moko-rose 主调
        radicalColor: '#f7678f',
        showOutline: true,
        charDataLoader: () =>
          fetch(`/hanzi/${encodeURIComponent(char)}.json`).then(async (response) => {
            if (!response.ok) throw new Error(`no stroke data for ${char}`);
            return (await response.json()) as CharacterJson;
          }),
        onLoadCharDataSuccess: () => {
          if (!cancelled) setLoadState('ready');
        },
        onLoadCharDataError: () => {
          // 不留在 'loading'：明确告诉孩子「数据没到」，而不是无限等待
          if (!cancelled) setLoadState('error');
        },
      });
      if (cancelled) return;
      setWriterInst(writer);
      writer.animateCharacter();
    })();
    return () => {
      cancelled = true;
    };
  }, [char]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-gradient-to-b from-[#fff5f0]/97 to-[#ffe8dc]/97 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="max-w-md w-full text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-black text-moko-rose tracking-widest">🖌 笔顺动画</div>
        <div className="text-6xl font-black text-moko-rose mb-1">{char}</div>
        {/* hanzi-writer 挂载点：280×280 逐画动画 */}
        <div className="relative mx-auto w-[280px] h-[280px] rounded-3xl bg-white clay-card clay-theme clay-pink flex items-center justify-center overflow-hidden">
          <div ref={elRef} />
          {loadState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              ✍️ 笔画加载中…
            </div>
          )}
          {loadState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 text-sm px-4">
              <span>😢 笔画数据加载失败</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {loadState === 'error'
            ? '网络不太好，关闭后重新打开试试～'
            : '看清楚每一笔的顺序，再跟着写一写～'}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => writerInst?.animateCharacter()}
            disabled={loadState !== 'ready'}
            className="px-6 py-2.5 rounded-full bg-moko-rose text-white font-black clay-btn clay-theme clay-rose transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 再看一遍
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-gray-200 text-gray-600 font-bold transition active:scale-95"
          >
            ✕ 关闭
          </button>
        </div>
      </div>
    </div>
  );
}
