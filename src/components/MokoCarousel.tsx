'use client';

import { useState, useEffect } from 'react';

interface CarouselItem {
  img: string;
  name: string;
}

export function MokoCarousel({ items }: { items: CarouselItem[] }) {
  const [idx, setIdx] = useState(0);
  const show = 3; // 同时显示 3 只
  const total = items.length;

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  if (!total) return null;

  const visible: CarouselItem[] = [];
  for (let i = 0; i < show; i++) {
    visible.push(items[(idx + i) % total]);
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white/60 shadow-lg border-2 border-moko-pink/20 p-3 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎠</span>
        <span className="font-bold text-moko-violet text-sm">萌可大集合</span>
        <span className="text-xs text-gray-400 ml-auto">共 {total} 只 · 遇到新朋友就会自动加入</span>
      </div>
      <div className="flex gap-3 overflow-hidden transition-all duration-500">
        {visible.map((item, i) => (
          <div
            key={item.name + i}
            className="flex-shrink-0 w-1/3 text-center animate-fadeIn"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg overflow-hidden border-2 border-white/80 bg-gradient-to-br from-moko-pink/10 to-moko-purple/10">
              <img
                src={item.img}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-[11px] font-bold text-moko-violet mt-1 truncate">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}