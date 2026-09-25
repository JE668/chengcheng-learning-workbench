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
  // 折叠状态：点击时钟可隐藏，点击小按钮恢复
  const [collapsed, setCollapsed] = useState(false);
  // 从 localStorage 读取折叠偏好
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('clock-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('clock-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const tick = () => setNow(fmt(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || !now) return null;

  // 折叠状态：只显示一个小按钮
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-3 right-3 z-40 w-8 h-8 rounded-full bg-white/85 backdrop-blur shadow-lg border border-moko-purple/20 flex items-center justify-center text-sm hover:scale-110 transition select-none"
        aria-label="显示时钟"
        title="点击显示时钟"
      >
        🕐
      </button>
    );
  }

  return (
    <div
      className="fixed top-3 right-3 z-40 text-right bg-white/85 backdrop-blur rounded-2xl px-3 py-1.5 shadow-lg border border-moko-purple/20 leading-tight select-none"
      aria-label="当前时间"
    >
      <div className="flex items-center justify-end gap-2">
        <div className="text-sm font-black text-moko-violet tabular-nums">{now.time}</div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-moko-rose text-xs transition"
          aria-label="隐藏时钟"
          title="点击隐藏时钟"
        >
          ✕
        </button>
      </div>
      <div className="text-[10px] text-gray-500">{now.date}</div>
    </div>
  );
}
