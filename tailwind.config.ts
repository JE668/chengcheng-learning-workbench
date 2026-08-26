import type { Config } from 'tailwindcss';
import { tokens } from './src/lib/design-tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 语义化色彩映射
        primary: {
          DEFAULT: tokens.colors.brand.pink,
          light: tokens.colors.brand.pinkLight,
          dark: tokens.colors.brand.pinkDark,
          hover: tokens.colors.brand.pinkDark,
        },
        secondary: {
          DEFAULT: tokens.colors.brand.violet,
          light: tokens.colors.brand.violetLight,
          dark: tokens.colors.brand.violetDark,
          hover: tokens.colors.brand.violetDark,
        },
        accent: {
          DEFAULT: tokens.colors.brand.gold,
          light: tokens.colors.brand.goldLight,
          dark: tokens.colors.brand.goldDark,
          hover: tokens.colors.brand.goldDark,
        },
        success: {
          DEFAULT: tokens.colors.semantic.success,
          light: tokens.colors.semantic.successLight,
        },
        warning: {
          DEFAULT: tokens.colors.semantic.warning,
          light: tokens.colors.semantic.warningLight,
        },
        danger: {
          DEFAULT: tokens.colors.semantic.danger,
          light: tokens.colors.semantic.dangerLight,
        },
        info: {
          DEFAULT: tokens.colors.semantic.info,
          light: tokens.colors.semantic.infoLight,
        },
        surface: {
          DEFAULT: tokens.colors.semantic.surface,
          hover: tokens.colors.semantic.surfaceHover,
          pressed: tokens.colors.semantic.surfacePressed,
          elevated: tokens.colors.semantic.surfaceElevated,
        },
        text: {
          DEFAULT: tokens.colors.semantic.text,
          secondary: tokens.colors.semantic.textSecondary,
          tertiary: tokens.colors.semantic.textTertiary,
          inverse: tokens.colors.semantic.textInverse,
          link: tokens.colors.semantic.textLink,
        },
        border: {
          DEFAULT: tokens.colors.semantic.border,
          strong: tokens.colors.semantic.borderStrong,
          focus: tokens.colors.semantic.borderFocus,
        },
        overlay: {
          DEFAULT: tokens.colors.semantic.overlay,
          strong: tokens.colors.semantic.overlayStrong,
        },
        // 保留原有 moko 色彩作为别名
        moko: {
          pink: tokens.colors.brand.pink,
          rose: tokens.colors.brand.rose,
          violet: tokens.colors.brand.violet,
          blue: tokens.colors.brand.blue,
          cyan: tokens.colors.brand.cyan,
          yellow: tokens.colors.brand.yellow,
          gold: tokens.colors.brand.gold,
          mint: tokens.colors.brand.mint,
          purple: tokens.colors.brand.purple,
                      cream: tokens.colors.moko.cream,
        },
      },
      fontFamily: {
        sans: tokens.typography.fontFamily.sans.split(',').map(f => f.trim().replace(/"/g, '')),
        mono: tokens.typography.fontFamily.mono.split(',').map(f => f.trim().replace(/"/g, '')),
        display: tokens.typography.fontFamily.display.split(',').map(f => f.trim().replace(/"/g, '')),
      },
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      letterSpacing: tokens.typography.letterSpacing,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      animation: {
        // 基础动画
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-out) forwards',
        'fade-out': 'fadeOut var(--duration-normal) var(--ease-in) forwards',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-out) forwards',
        'slide-down': 'slideDown var(--duration-normal) var(--ease-out) forwards',
        'scale-in': 'scaleIn var(--duration-fast) var(--ease-out) forwards',
        'scale-out': 'scaleOut var(--duration-fast) var(--ease-in) forwards',
        'bounce-in': 'bounceIn var(--duration-slower) var(--bounce) forwards',
        'shake': 'shake var(--duration-normal) var(--ease-in-out)',
        'pulse-soft': 'pulse var(--duration-slower) var(--ease-in-out) infinite',
        'spin': 'spin var(--duration-slow) linear infinite',
        // 页面过渡
        'page-enter': 'slideUp var(--duration-normal) var(--ease-out) forwards',
        'page-exit': 'fadeOut var(--duration-fast) var(--ease-in) forwards',
        // 卡片悬停
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
          '0%': { boxShadow: tokens.shadows.card },
          '100%': { boxShadow: tokens.shadows.cardHover, transform: 'translateY(-2px)' },
        },
      },
      transitionDuration: tokens.animation.duration,
      transitionTimingFunction: tokens.animation.easing,
      zIndex: tokens.zIndex,
    },
  },
  plugins: [],
};
export default config;
