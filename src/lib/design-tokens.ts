/** Design System Tokens - 统一设计语言 */

export const tokens = {
  /** 色彩系统 */
  colors: {
    // 品牌色
    brand: {
      pink: '#FF6B9D',
      pinkLight: '#FFB3D1',
      pinkDark: '#E85585',
      violet: '#7B68EE',
      violetLight: '#B1A9F0',
      violetDark: '#5A4DD8',
      gold: '#FFD700',
      goldLight: '#FFE55C',
      goldDark: '#E6C200',
      rose: '#FF4D6A',
      roseLight: '#FF8FA3',
      cyan: '#00D4D4',
      cyanLight: '#66EBEB',
      yellow: '#FFEB3B',
      mint: '#00E6A0',
      blue: '#4A90E2',
      purple: '#9B59B6',
    },

    // 语义色
    semantic: {
      primary: 'var(--color-brand-pink)',
      primaryHover: 'var(--color-brand-pinkDark)',
      primaryLight: 'var(--color-brand-pinkLight)',
      secondary: 'var(--color-brand-violet)',
      secondaryHover: 'var(--color-brand-violetDark)',
      accent: 'var(--color-brand-gold)',
      accentHover: 'var(--color-brand-goldDark)',

      success: '#22C55E',
      successLight: '#86EFAC',
      warning: '#F59E0B',
      warningLight: '#FDE68A',
      danger: '#EF4444',
      dangerLight: '#FCA5A5',
      info: '#3B82F6',
      infoLight: '#93C5FD',

      surface: 'var(--color-surface)',
      surfaceHover: 'var(--color-surface-hover)',
      surfacePressed: 'var(--color-surface-pressed)',
      surfaceElevated: 'var(--color-surface-elevated)',

      text: 'var(--color-text)',
      textSecondary: 'var(--color-text-secondary)',
      textTertiary: 'var(--color-text-tertiary)',
      textInverse: 'var(--color-text-inverse)',
      textLink: 'var(--color-brand-violet)',

      border: 'var(--color-border)',
      borderStrong: 'var(--color-border-strong)',
      borderFocus: 'var(--color-brand-pink)',

      overlay: 'rgba(0, 0, 0, 0.4)',
      overlayStrong: 'rgba(0, 0, 0, 0.6)',
    },

    // 萌可专属色（用于角色标识）
    moko: {
      love: '#FF6B9D',      // 爱心萌可
      courage: '#FF8C42',   // 勇气萌可/正正
      sing: '#9B59B6',      // 唱唱萌可
      smart: '#4A90E2',     // 智慧萌可
      happy: '#FFD700',     // 开心萌可
      magic: '#00D4D4',     // 魔法萌可
      trouble: '#EF4444',   // 捣蛋萌可
      cream: '#FFF7ED',     // 背景奶油色
    },
  },

  /** 间距系统 */
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  /** 圆角系统 */
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  /** 阴影系统 */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    // 萌可特色阴影
    moko: '0 8px 24px -8px rgba(255, 107, 157, 0.3)',
    mokoHover: '0 12px 32px -8px rgba(255, 107, 157, 0.4)',
    card: '0 4px 12px rgba(0, 0, 0, 0.08)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },

  /** 字体系统 */
  typography: {
    fontFamily: {
      sans: '"Noto Sans SC", "Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      display: '"Nunito", "Noto Sans SC", system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },

  /** 动画系统 */
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    // 常用动画组合
    presets: {
      fadeIn: { opacity: [0, 1] },
      fadeOut: { opacity: [1, 0] },
      slideUp: { transform: ['translateY(10px)', 'translateY(0)'], opacity: [0, 1] },
      slideDown: { transform: ['translateY(-10px)', 'translateY(0)'], opacity: [0, 1] },
      scaleIn: { transform: ['scale(0.95)', 'scale(1)'], opacity: [0, 1] },
      scaleOut: { transform: ['scale(1)', 'scale(0.95)'], opacity: [1, 0] },
      bounceIn: { transform: ['scale(0.3)', 'scale(1.05)', 'scale(1)'], opacity: [0, 1, 1] },
      shake: { transform: ['translateX(0)', 'translateX(-5px)', 'translateX(5px)', 'translateX(-5px)', 'translateX(0)'] },
      pulse: { transform: ['scale(1)', 'scale(1.05)', 'scale(1)'] },
      spin: { transform: ['rotate(0deg)', 'rotate(360deg)'] },
    },
  },

  /** 断点系统 */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /** Z-Index 层级 */
  zIndex: {
    hide: '-1',
    base: '0',
    dropdown: '100',
    sticky: '200',
    fixed: '300',
    modalBackdrop: '400',
    modal: '500',
    popover: '600',
    tooltip: '700',
    toast: '800',
    max: '9999',
  },

  /** 尺寸系统 */
  sizes: {
    // 图标
    icon: {
      xs: '0.75rem',   // 12px
      sm: '1rem',      // 16px
      md: '1.25rem',   // 20px
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
      '2xl': '3rem',   // 48px
    },
    // 头像
    avatar: {
      xs: '1.5rem',    // 24px
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
      xl: '4rem',      // 64px
      '2xl': '6rem',   // 96px
    },
    // 按钮
    button: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
      xl: '3.5rem',    // 56px
    },
    // 输入框
    input: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
  },
} as const;

/** 类型导出 */
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors.semantic;
export type SpacingToken = keyof typeof tokens.spacing;
export type RadiusToken = keyof typeof tokens.borderRadius;
export type ShadowToken = keyof typeof tokens.shadows;
export type FontSizeToken = keyof typeof tokens.typography.fontSize;
export type DurationToken = keyof typeof tokens.animation.duration;
export type EasingToken = keyof typeof tokens.animation.easing;
export type BreakpointToken = keyof typeof tokens.breakpoints;
export type ZIndexToken = keyof typeof tokens.zIndex;