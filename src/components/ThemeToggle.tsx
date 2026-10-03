'use client';

import { useEffect, useState } from 'react';

/**
 * 暗色模式切换按钮
 * 仅家长端使用（孩子端保持明亮活泼的主题）
 * 存储到 localStorage，下次访问自动应用
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('ccwb-theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('ccwb-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  if (!mounted) return null;

  // 纯 CSS 实现：按下缩放用 active:scale-90，图标旋转用 transform + transition
  // （尊重「减少动态效果」：motion-reduce:transition-none）
  return (
    <button
      onClick={toggle}
      aria-label="切换暗色模式"
      className="p-2 rounded-xl hover:bg-white/10 transition tap active:scale-90 motion-reduce:transition-none"
    >
      <span
        className="text-xl block transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
