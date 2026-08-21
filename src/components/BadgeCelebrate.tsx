'use client';

import { useState, useEffect } from 'react';

interface Props {
  /** 徽章列表（name, emoji） */
  badges: { name: string; emoji: string }[];
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 🎉 新徽章获得庆祝弹窗。
 * 传入本次新获得的徽章列表，显示五彩纸屑 + 徽章展示。
 * 自动在 3 秒后可关闭，或点击任意处关闭。
 */
export function BadgeCelebrate({ badges, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 略微延迟出现，让页面先加载
    const t1 = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t1);
  }, []);

  if (!badges.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
    >
      {/* 五彩纸屑粒子 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: Math.random() * 100 + '%',
              top: '-5%',
              animationDelay: Math.random() * 1.5 + 's',
              animationDuration: (1.5 + Math.random() * 2) + 's',
              background: ['#FF6B8A', '#C084FC', '#22D3EE', '#FBBF24', '#34D399', '#FB923C'][i % 6],
              width: 8 + Math.random() * 8 + 'px',
              height: 8 + Math.random() * 8 + 'px',
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* 弹窗主体 */}
      <div
        className={`relative bg-white rounded-3xl p-8 max-w-sm w-[90vw] text-center shadow-2xl transition-all duration-300 ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-2 celebrate-pop">🎉</div>
        <h2 className="text-2xl font-black text-moko-violet mb-1">太棒啦！</h2>
        <p className="text-gray-500 text-sm mb-5">你获得了新的成就徽章！</p>

        <div className="flex flex-wrap justify-center gap-4 mb-5">
          {badges.map((b, i) => (
            <div
              key={b.name}
              className="celebrate-pop flex flex-col items-center"
              style={{ animationDelay: 0.2 + i * 0.15 + 's' }}
            >
              <div className="w-16 h-16 rounded-full bg-moko-gold/20 flex items-center justify-center text-3xl border-2 border-moko-gold/40">
                {b.emoji}
              </div>
              <span className="text-xs font-bold text-gray-700 mt-1.5 max-w-[80px] text-center leading-tight">
                {b.name}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="px-8 py-2.5 rounded-full bg-moko-gold text-white font-black text-sm shadow hover:scale-105 transition"
        >
          继续加油！
        </button>
      </div>
    </div>
  );
}
