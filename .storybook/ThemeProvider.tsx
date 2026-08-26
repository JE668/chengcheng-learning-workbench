'use client';

import { useEffect, useMemo } from 'react';
import { useGlobals } from '@storybook/manager-api';

/**
 * Storybook 主题提供器
 * 根据 globals.theme 切换文档模式
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [globals] = useGlobals();
  const theme = globals?.theme ?? 'light';

  const themeClass = useMemo(() => {
    switch (theme) {
      case 'dark':
        return 'dark';
      case 'moko':
        return 'moko-theme';
      default:
        return '';
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'moko-theme');
    if (themeClass) root.classList.add(themeClass);
  }, [themeClass]);

  return <>{children}</>;
}