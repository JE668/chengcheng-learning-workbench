/** Design System Tokens - 统一设计语言
 * 单一事实来源，避免硬编码，支持亮/暗模式切换
 */

// ============================================================================
// 颜色系统 - 语义化命名，支持亮/暗模式
// ============================================================================

export const colors = {
  // 品牌色 - 萌可专属色系（支持亮/暗模式）
  brand: {
    love: { light: '#ff6fa5', dark: '#ff8fc9' },      // 爱心萌可 - 粉色
    wisdom: { light: '#a78bfa', dark: '#c0aaff' },    // 睿智萌可 - 紫色
    brave: { light: '#38bdf8', dark: '#7dd3fc' },     // 勇气萌可 - 蓝色
    joy: { light: '#fcd34d', dark: '#fde047' },       // 唱唱萌可 - 黄色
    nature: { light: '#4ade80', dark: '#86efac' },    // 自然萌可 - 绿色
    magic: { light: '#f472b6', dark: '#f9a8d4' },     // 魔法萌可 - 粉紫
  },

  // 语义色 - 基于用途命名，自动适配亮/暗模式
  semantic: {
    primary: { light: '#d946ef', dark: '#e879f9' },      // 主要操作
    secondary: { light: '#71717a', dark: '#a1a1aa' },    // 次要操作
    success: { light: '#16a34a', dark: '#4ade80' },      // 成功状态
    warning: { light: '#f59e0b', dark: '#fbbf24' },      // 警告状态
    danger: { light: '#dc2626', dark: '#f87171' },       // 危险/错误
    info: { light: '#2563eb', dark: '#60a5fa' },         // 信息提示
  },

  // 中性色 - 灰度系统
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // 背景色
  background: {
    primary: { light: '#fefaf7', dark: '#1a1a2e' },
    secondary: { light: '#fff8f0', dark: '#24243e' },
    tertiary: { light: '#fff0e0', dark: '#2d2d44' },
    inverse: { light: '#1a1a2e', dark: '#fefaf7' },
  },

  // 文本色
  text: {
    primary: { light: '#171717', dark: '#fafafa' },
    secondary: { light: '#525252', dark: '#a3a3a3' },
    tertiary: { light: '#737373', dark: '#737373' },
    inverse: { light: '#ffffff', dark: '#171717' },
    disabled: { light: '#a3a3a3', dark: '#525252' },
    link: { light: '#d946ef', dark: '#e879f9' },
  },

  // 边框色
  border: {
    light: { light: '#e5e5e5', dark: '#404040' },
    medium: { light: '#d4d4d4', dark: '#525252' },
    strong: { light: '#a3a3a3', dark: '#737373' },
    focus: { light: '#d946ef', dark: '#e879f9' },
    error: { light: '#dc2626', dark: '#f87171' },
  },

  // 萌可专属渐变
  gradients: {
    love: 'linear-gradient(135deg, #ffafc9 0%, #ff6fa5 100%)',
    wisdom: 'linear-gradient(135deg, #c9b8fd 0%, #a78bfa 100%)',
    brave: 'linear-gradient(135deg, #8fd6fc 0%, #38bdf8 100%)',
    joy: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
    nature: 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)',
    magic: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
  },
} as const;

// ============================================================================
// 间距系统 - 基于 4px 基准网格
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const;

// ============================================================================
// 圆角系统
// ============================================================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

// ============================================================================
// 阴影系统
// ============================================================================

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // 萌可特色阴影
  glow: '0 0 20px -4px currentColor',
  card: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
  float: '0 12px 24px -4px rgb(0 0 0 / 0.12)',
  modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// ============================================================================
// 字体系统
// ============================================================================

export const typography = {
  fontFamily: {
    sans: '"Noto Sans SC", "Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    display: '"Noto Sans SC", "Inter", system-ui, sans-serif',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ============================================================================
// 过渡动画系统
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================================================
// 断点系统
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-Index 层级
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1700,
} as const;

// ============================================================================
// 辅助函数
// ============================================================================

/** 获取主题色值 */
export function getColor(path: string, theme: 'light' | 'dark' = 'light'): string {
  const keys = path.split('.');
  let value: any = colors;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return '';
  }
  if (typeof value === 'object' && 'light' in value && 'dark' in value) {
    return value[theme];
  }
  return value;
}

/** 获取语义色值 */
export function getSemanticColor(name: keyof typeof colors.semantic, theme: 'light' | 'dark' = 'light'): string {
  return colors.semantic[name][theme];
}

/** 获取品牌色值 */
export function getBrandColor(name: keyof typeof colors.brand, theme: 'light' | 'dark' = 'light'): string {
  return colors.brand[name][theme];
}

// ============================================================================
// 统一导出 tokens 对象（兼容现有代码）
// ============================================================================

export const tokens = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  transitions,
  breakpoints,
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
    toast: 1700,
  },
} as const;

export default tokens;