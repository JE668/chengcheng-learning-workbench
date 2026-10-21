'use client';

import { useEffect, useRef, useState } from 'react';
import { STROKES_DATA } from '@/lib/study-data/strokes-data.generated';
import type { CharacterJson } from 'hanzi-writer';

/**
 * 🖌 笔顺动画（⑥号内容升级 2026-10-21）
 *
 * 一年级刚需：笔顺规范。识字卡上「笔顺」按钮 → 全屏遮罩逐画动画。
 * - 数据构建期内置（strokes-data.generated.ts，299 字，566KB 打进
 *   lazy chunk）——零网络请求，弱网/断网与 TTS 同级免疫
 * - hanzi-writer 渲染（MIT）：strokes SVG path + medians 引导线
 * - 字无数据时入口自动隐藏（数据覆盖 299/299，防御旧库新字）
 * - 许可合规：字型 APL/Arphic，见 docs/ARPHICPL.txt
 */
export function hasStrokes(ch: string): boolean {
  return Boolean(STROKES_DATA[ch]);
}

export default function StrokePlayer({ char, onClose }: { char: string; onClose: () => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [writerInst, setWriterInst] = useState<{ animateCharacter: (opts?: { onComplete?: () => void }) => void } | null>(null);

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
        charDataLoader: (_c: string, onLoad: (d: CharacterJson) => void) => {
          onLoad(STROKES_DATA[char] as CharacterJson);
        },
      });
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
        <div className="mx-auto w-[280px] h-[280px] rounded-3xl bg-white clay-card clay-theme clay-pink flex items-center justify-center overflow-hidden">
          <div ref={elRef} />
        </div>
        <div className="text-xs text-gray-400">看清楚每一笔的顺序，再跟着写一写～</div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => writerInst?.animateCharacter()}
            className="px-6 py-2.5 rounded-full bg-moko-rose text-white font-black clay-btn clay-theme clay-rose transition"
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
