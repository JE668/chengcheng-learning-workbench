'use client';

import { useEffect, useState } from 'react';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

interface Now {
  date: string;
  time: string;
}

function fmt(d: Date): Now {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, '0');
  const sec = d.getSeconds().toString().padStart(2, '0');
  const ap = h < 12 ? '上午' : '下午';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return {
    date: `${y}年${m}月${day}日 星期${WEEK[d.getDay()]}`,
    time: `${ap} ${h12}:${min}:${sec}`,
  };
}

export default function Clock() {
  const [now, setNow] = useState<Now | null>(null);

  useEffect(() => {
    const tick = () => setNow(fmt(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div
      className="fixed top-3 right-3 z-40 text-right bg-white/85 backdrop-blur rounded-2xl px-3 py-1.5 shadow-lg border border-moko-purple/20 leading-tight select-none"
      aria-label="当前时间"
    >
      <div className="text-sm font-black text-moko-violet tabular-nums">{now.time}</div>
      <div className="text-[10px] text-gray-500">{now.date}</div>
    </div>
  );
}
