'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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

  return (
    <motion.button
      onClick={toggle}
      aria-label="切换暗色模式"
      className="p-2 rounded-xl hover:bg-white/10 transition tap"
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        className="text-xl block"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  );
}
