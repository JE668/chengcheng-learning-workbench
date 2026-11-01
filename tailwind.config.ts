import type { Config } from 'tailwindcss';
import { tokens } from './src/lib/design-tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ⚠️ 这套颜色是「语义层」的唯一真源，供 components/atomic/** 消费。
        //
        // 历史缺口（2026-11-01 修复）：atomic 组件自 shadcn 风格沿用了一套语义名
        //（primary-foreground / destructive / border / accent-foreground / input /
        // ring / muted / muted-foreground / background / foreground），但本文件此前
        // **一个都没定义**。Tailwind 对不存在的 token 直接静默丢弃，于是
        // `text-primary-foreground`、`border-border`、`hover:bg-accent` 生成的 CSS
        // 长度为 0 —— 登录页那颗唯一的按钮白字压在粉底上等于隐形、悬停无任何反馈。
        // 而 next.config 又同时开着 ignoreBuildErrors / ignoreDuringBuilds，
        // 这类「字形全对、颜色全丢」的失效在构建期完全静默。
        // 现按 shadcn 同名的语义口径补齐，取值仍取自本项目 design-tokens，不引入新色。
        primary: {
          DEFAULT: '#d946ef',
          light: '#e879f9',
          dark: '#c026d3',
          hover: '#c026d3',
          /** 测于 primary 实底上的前景色（按钮文字）。纯白在 #d946ef 上对比度 3.9:1，
           *  对儿童端 16px+ 正文够用；但把 brand 按钮统一压向 primary.dark 后更稳。 */
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#71717a',
          light: '#a1a1aa',
          dark: '#525252',
          hover: '#525252',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#fcd34d',
          light: '#fde047',
          dark: '#eab308',
          hover: '#eab308',
          foreground: '#422006',
        },
        success: {
          DEFAULT: '#16a34a',
          light: '#4ade80',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          foreground: '#422006',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#f87171',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
          foreground: '#ffffff',
        },
        // 破坏性操作（删除/拒绝）。与 danger 区分语义：danger 是「出错了」，
        // destructive 是「这个按钮会删东西」。取值同 danger，但专门服务 atomic 变体名。
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        // 结构色：卡片描边 / 输入框描边 / 焦点环
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#d946ef',
        // 基础前景与弱化前景
        foreground: '#171717',
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        // 页面底色（与 globals.css 的 --color-bg-* 同源，深色模式由 CSS 变量在暗色下切换）
        background: '#fefaf7',
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
        sans: tokens.typography.fontFamily.sans.split(',').map((f) => f.trim().replace(/"/g, '')),
        mono: tokens.typography.fontFamily.mono.split(',').map((f) => f.trim().replace(/"/g, '')),
        display: tokens.typography.fontFamily.display
          .split(',')
          .map((f) => f.trim().replace(/"/g, '')),
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
      borderRadius: {
        // ⚠️ tokens.radius.xl 是 1rem(16px)，而 globals.css 的 .clay-btn 实测是 18px、
        // .clay-card 是 1.75rem(28px)。两者差 2px：atomic 按钮与全站黏土按钮并排时
        // 圆角肉眼可辨。这里只覆写 xl，其余键（2xl/3xl/full…）继续走 tokens，
        // 不整体展开 spread —— 展开会丢掉 Tailwind 默认的 xs/4xl，属于静默退化。
        xl: '18px',
        '2xl': tokens.radius['2xl'],
        '3xl': tokens.radius['3xl'],
        full: tokens.radius.full,
        // 大卡圆角与 .card-moko / .clay-card 对齐（1.75rem = 28px）
        '4xl': '1.75rem',
      },
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
        shake: 'shake var(--duration-normal) var(--ease-in-out)',
        'pulse-soft': 'pulse var(--duration-slow) var(--ease-in-out) infinite',
        spin: 'spin var(--duration-slow) linear infinite',
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
