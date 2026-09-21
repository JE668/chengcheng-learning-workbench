'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
 * 统一星星结算动效组件
 * 3 星：礼花 + 全屏彩带
 * 2 星：拍拍手动画
 * 1 星：简单闪烁
 */
export function StarBurst({ stars, auto = true, onClose }: StarBurstProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (auto && stars > 0) setShow(true);
  }, [auto, stars]);

  const handleClose = useCallback(() => {
    setShow(false);
    onClose?.();
  }, [onClose]);

  // 自动生成粒子
  const particles = Array.from({ length: stars >= 3 ? 40 : stars >= 2 ? 20 : 10 }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / (stars >= 3 ? 40 : stars >= 2 ? 20 : 10) + Math.random() * 0.5,
    distance: stars >= 3 ? 120 + Math.random() * 80 : 80 + Math.random() * 40,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.3,
  }));

  const confetti = stars >= 3
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 背景遮罩 */}
          {stars >= 3 && (
            <motion.div
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* 礼花粒子 */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size}px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: [1, 1, 0],
                scale: [0, 1.2, 0.8],
              }}
              transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          {/* 全屏彩带（3 星） */}
          {confetti.map((c) => (
            <motion.div
              key={`confetti-${c.id}`}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: '-20px',
                width: c.size,
                height: c.size * 1.5,
                backgroundColor: c.color,
                borderRadius: 2,
              }}
              initial={{ y: -50, opacity: 0, rotate: c.rotate }}
              animate={{ y: '120vh', opacity: [0, 1, 1, 0], rotate: c.rotate + 720 }}
              transition={{ duration: c.duration, delay: c.delay, ease: 'linear' }}
            />
          ))}

          {/* 星星主体 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="text-5xl sm:text-6xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: i < stars ? 1 : 0.5, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 + i * 0.15 }}
                  style={{ opacity: i < stars ? 1 : 0.3 }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
            <motion.h2
              className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg mb-2"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
            >
              {stars >= 3 ? '完美！🎉' : stars >= 2 ? '很棒！👏' : '继续加油！💪'}
            </motion.h2>
            <motion.p
              className="text-white/80 font-bold text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {stars >= 3 ? '所有星星都点亮了！' : stars >= 2 ? '离满星只差一步啦' : '再来一次就能拿更多星'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
