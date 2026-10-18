'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface CarouselItem {
  img: string;
  name: string;
}

/**
 * 🎠 萌可大集合——无限循环跑马灯（2026-10-18 重做）
 *
 * 此前是「3 个一组、setInterval 整组跳转」：切换瞬间位移突变，且一屏
 * 只能露出 3 只。现在改为匀速连续滚动：
 *   - 渲染两份完整数组拼接，translateX(0 → -50%) 无缝循环
 *   - 可见数量按屏幕宽度自适应（3 / 4 / 5 只）
 *   - 手指按住 / 鼠标悬停时暂停（孩子想细看某一只）
 *   - prefers-reduced-motion 降级为静态网格（CSS 已停动画，这里停双份渲染）
 *   - 数量 ≤ 可见数时双份渲染会出现重复——直接降级为居中静态网格
 */
export function MokoCarousel({ items }: { items: CarouselItem[] }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const total = items.length;
  // 一屏可见数：手机 3 → 平板 4 → 大屏 5（跑马灯下展示更多伙伴）
  const show = 5;

  if (!total) return null;

  // 可见数撑不下一条跑马灯时降级为静态居中网格（数量少时重复渲染会穿帮）
  if (reduced || total < show * 2) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white/60 p-3 mb-6 clay-card clay-theme clay-pink">
        <CarouselHeader total={total} />
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <CarouselCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // 跑马灯：双份数组首尾相接，translateX(-50%) 处正好衔接下一份的起点
  const doubled = [...items, ...items];
  // 速度按总数自适应：伙伴越多滚得越慢，保证每只都有足够的展示时间
  const speed = Math.max(18, Math.min(40, total * 1.6));

  return (
    <div className="overflow-hidden rounded-3xl bg-white/60 p-3 mb-6 clay-card clay-theme clay-pink">
      <CarouselHeader total={total} />
      <div
        className="relative overflow-hidden"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}
      >
        <div className="moko-marquee-track" style={{ ['--marquee-speed' as string]: `${speed}s` }}>
          {doubled.map((item, i) => (
            <CarouselCard key={item.name + i} item={item} marquee />
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">🎠</span>
      <span className="font-bold text-moko-violet text-sm">萌可大集合</span>
      <span className="text-xs text-gray-400 ml-auto">共 {total} 只 · 遇到新朋友就会自动加入</span>
    </div>
  );
}

function CarouselCard({ item, marquee }: { item: CarouselItem; marquee?: boolean }) {
  return (
    <div className={`text-center ${marquee ? 'px-2 flex-shrink-0 w-24 md:w-28' : ''}`}>
      <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg overflow-hidden border-2 border-white/80 bg-gradient-to-br from-moko-pink/10 to-moko-purple/10">
        <Image
          src={item.img || '/moko/lemei.jpg'}
          alt={item.name}
          fill
          sizes="96px"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="text-[11px] font-bold text-moko-violet mt-1 truncate px-1">{item.name}</div>
    </div>
  );
}
