'use client';

import { useEffect, useState, useCallback, type CSSProperties } from 'react';

interface StarBurstProps {
  /** 3=礼花+彩带, 2=拍拍手, 1=闪烁 */
  stars: number;
  /** 自动播放 */
  auto?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

const COLORS = ['#fcd34d', '#f472b6', '#38bdf8', '#4ade80', '#a78bfa', '#fb923c'];

/**
 * 统一星星结算动效组件（**纯 CSS**，不再依赖 framer-motion）
 * 3 星：礼花 + 全屏彩带；2 星：拍拍手；1 星：简单闪烁
 *
 * 改造说明：原先每个粒子/彩带都是一个 motion 组件（3 星时多达 40+30 个），
 * 现在换成「一条 CSS 关键帧 + 用 CSS 自定义属性（--bx/--by/--cr）传参」，
 * JS 只在渲染时生成一次随机参数。关键帧见 globals.css 的 burstOut / starConfetti。
 *
 * 有意取舍：失去了 AnimatePresence 的**出场**淡出（直接卸载）。观感影响很小，
 * 换取的是把 framer-motion 从首屏公共块里彻底移除。
 */
export function StarBurst({ stars, auto = true, onClose }: StarBurstProps) {
  const [show, setShow] = useState(auto && stars > 0);

  useEffect(() => {
    if (auto) {
      setShow(stars > 0);
    }
    // 当 auto=false 时，由父组件控制 show（通过条件渲染）
    // 组件被渲染时就显示
    else if (stars > 0) {
      setShow(true);
    }
  }, [auto, stars]);

  const handleClose = useCallback(() => {
    setShow(false);
    onClose?.();
  }, [onClose]);

  // 自动生成粒子（参数只算一次，动画由 CSS 完成）
  const particleCount = stars >= 3 ? 40 : stars >= 2 ? 20 : 10;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const distance = stars >= 3 ? 120 + Math.random() * 80 : 80 + Math.random() * 40;
    return {
      id: i,
      bx: Math.cos(angle) * distance,
      by: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.3,
    };
  });

  const confetti =
    stars >= 3
      ? Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 1.5,
          duration: 2 + Math.random() * 2,
          color: COLORS[i % COLORS.length],
          size: 8 + Math.random() * 12,
          rotate: Math.random() * 360,
        }))
      : [];

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* 背景遮罩 */}
      {stars >= 3 && (
        <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={handleClose} />
      )}

      {/* 礼花粒子 */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="burst-piece absolute rounded-full"
          style={
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: '0 0 ' + p.size + 'px ' + p.color,
              '--bx': p.bx + 'px',
              '--by': p.by + 'px',
              '--bdur': '1.2s',
              animationDelay: p.delay + 's',
            } as CSSProperties
          }
        />
      ))}

      {/* 全屏彩带（3 星） */}
      {confetti.map((c) => (
        <div
          key={'confetti-' + c.id}
          className="confetti-piece absolute"
          style={
            {
              left: c.x + '%',
              top: '-20px',
              width: c.size,
              height: c.size * 1.5,
              backgroundColor: c.color,
              borderRadius: 2,
              '--cr': c.rotate + 'deg',
              animationDelay: c.delay + 's',
              animationDuration: c.duration + 's',
            } as CSSProperties
          }
        />
      ))}

      {/* 星星主体 */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className="pop-in text-5xl sm:text-6xl"
              style={{ animationDelay: 0.1 + i * 0.15 + 's', opacity: i < stars ? 1 : 0.3 }}
            >
              ⭐
            </span>
          ))}
        </div>
        <h2
          className="reveal-up text-3xl sm:text-4xl font-black text-white drop-shadow-lg mb-2"
          style={{ animationDelay: '0.5s' }}
        >
          {stars >= 3 ? '完美！🎉' : stars >= 2 ? '很棒！👏' : '继续加油！💪'}
        </h2>
        <p className="reveal-up text-white/80 font-bold text-sm" style={{ animationDelay: '0.7s' }}>
          {stars >= 3 ? '所有星星都点亮了！' : stars >= 2 ? '离满星只差一步啦' : '再来一次就能拿更多星'}
        </p>
      </div>
    </div>
  );
}
