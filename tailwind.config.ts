import type { Config } from 'tailwindcss';
import { tokens } from './src/lib/design-tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 语义化色彩映射 - 使用新的 design tokens
        primary: {
          DEFAULT: '#d946ef',
          light: '#e879f9',
          dark: '#c026d3',
          hover: '#c026d3',
        },
        secondary: {
          DEFAULT: '#71717a',
          light: '#a1a1aa',
          dark: '#525252',
          hover: '#525252',
        },
        accent: {
          DEFAULT: '#fcd34d',
          light: '#fde047',
          dark: '#eab308',
          hover: '#eab308',
        },
        success: {
          DEFAULT: '#16a34a',
          light: '#4ade80',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#f87171',
        },
        info: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
        },
        // 保留原有 moko 色彩作为别名（兼容现有代码）
        moko: {
          pink: '#ff6fa5',
          rose: '#ff6fa5',
          violet: '#a78bfa',
          blue: '#38bdf8',
          cyan: '#4ade80',
          yellow: '#fcd34d',
          gold: '#fcd34d',
          mint: '#4ade80',
          purple: '#a78bfa',
          cream: '#fefaf7',
        },
      },
      fontFamily: {
        sans: tokens.typography.fontFamily.sans.split(',').map(f => f.trim().replace(/"/g, '')),
        mono: tokens.typography.fontFamily.mono.split(',').map(f => f.trim().replace(/"/g, '')),
        display: tokens.typography.fontFamily.display.split(',').map(f => f.trim().replace(/"/g, '')),
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        glow: '0 0 20px -4px currentColor',
        card: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
        float: '0 12px 24px -4px rgb(0 0 0 / 0.12)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-out) forwards',
        'fade-out': 'fadeOut var(--duration-normal) var(--ease-in) forwards',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-out) forwards',
        'slide-down': 'slideDown var(--duration-normal) var(--ease-out) forwards',
        'scale-in': 'scaleIn var(--duration-fast) var(--ease-out) forwards',
        'scale-out': 'scaleOut var(--duration-fast) var(--ease-in) forwards',
        'bounce-in': 'bounceIn var(--duration-slow) var(--easing-bounce) forwards',
        'shake': 'shake var(--duration-normal) var(--ease-in-out)',
        'pulse-soft': 'pulse var(--duration-slow) var(--ease-in-out) infinite',
        'spin': 'spin var(--duration-slow) linear infinite',
        'page-enter': 'slideUp var(--duration-normal) var(--ease-out) forwards',
        'page-exit': 'fadeOut var(--duration-fast) var(--ease-in) forwards',
        'card-hover': 'cardHover var(--duration-normal) var(--ease-out) forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        cardHover: {
          '0%': { boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)' },
          '100%': { boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)', transform: 'translateY(-2px)' },
        },
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      zIndex: {
        hide: '-1',
        base: '0',
        dropdown: '1000',
        sticky: '1100',
        modal: '1300',
        popover: '1400',
        tooltip: '1500',
        toast: '1700',
      },
    },
  },
  plugins: [],
};
export default config;