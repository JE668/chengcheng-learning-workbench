import type { ReactNode } from 'react';

/**
 * 模块封面插画（纯 SVG，完全离线，无二进制资源）。
 * 由「学科主色渐变 + 装饰点缀 + 主题 SVG 图形 + 大 emoji」组合而成，
 * 既能作为卡片封面，也能作为详情页头图（banner 变体）。
 */

// 各主色对应的柔和渐变（与 bg-moko-* 视觉一致）
const GRADIENT: Record<string, string> = {
  'bg-moko-pink': 'linear-gradient(135deg, #FFAFC9 0%, #FF6FA5 100%)',
  'bg-moko-rose': 'linear-gradient(135deg, #FFC2D4 0%, #FF7A9C 100%)',
  'bg-moko-purple': 'linear-gradient(135deg, #C9B8FD 0%, #A78BFA 100%)',
  'bg-moko-blue': 'linear-gradient(135deg, #8FD6FC 0%, #38BDF8 100%)',
  'bg-moko-cyan': 'linear-gradient(135deg, #6FE9D8 0%, #2DD4BF 100%)',
  'bg-moko-mint': 'linear-gradient(135deg, #AEF3D2 0%, #6EE7B7 100%)',
  'bg-moko-yellow': 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)',
  'bg-moko-violet': 'linear-gradient(135deg, #AAB4FD 0%, #818CF8 100%)',
};

const DEFAULT_GRAD: Record<string, string> = {
  chinese: GRADIENT['bg-moko-pink'],
  math: GRADIENT['bg-moko-blue'],
  english: GRADIENT['bg-moko-yellow'],
};

/* ----------------------------- 主题图形 ----------------------------- */
type MotifFn = () => ReactNode;

const MOTIFS: Record<string, MotifFn> = {
  book: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M50 28 C42 18 22 18 12 22 L12 78 C22 74 42 74 50 80 C58 74 78 74 88 78 L88 22 C78 18 58 18 50 28 Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M50 28 V80" />
    </svg>
  ),
  brush: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none">
      <g transform="rotate(40 50 50)">
        <rect x="44" y="14" width="12" height="50" rx="6" fill="currentColor" fillOpacity="0.25" />
        <path d="M44 64 L56 64 L50 86 Z" fill="currentColor" fillOpacity="0.45" />
      </g>
    </svg>
  ),
  clock: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      <circle cx="50" cy="50" r="34" fill="currentColor" fillOpacity="0.18" />
      <line x1="50" y1="50" x2="50" y2="28" />
      <line x1="50" y1="50" x2="66" y2="56" />
      <circle cx="50" cy="50" r="4" fill="currentColor" />
    </svg>
  ),
  scale: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 20 V70" />
      <path d="M24 30 H76" />
      <path d="M24 30 L14 52 H34 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M76 30 L66 52 H86 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M38 76 H62 L58 68 H42 Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      <rect x="20" y="26" width="60" height="58" rx="9" fill="currentColor" fillOpacity="0.18" />
      <line x1="20" y1="40" x2="80" y2="40" strokeWidth="4" />
      <line x1="33" y1="16" x2="33" y2="32" />
      <line x1="67" y1="16" x2="67" y2="32" />
      <circle cx="34" cy="57" r="3" fill="currentColor" />
      <circle cx="50" cy="57" r="3" fill="currentColor" />
      <circle cx="66" cy="57" r="3" fill="currentColor" />
    </svg>
  ),
  abc: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fontFamily="sans-serif" fontWeight="800">
      <text x="26" y="62" fontSize="40" fill="currentColor" fillOpacity="0.38" textAnchor="middle">A</text>
      <text x="50" y="62" fontSize="40" fill="currentColor" fillOpacity="0.32" textAnchor="middle">B</text>
      <text x="74" y="62" fontSize="40" fill="currentColor" fillOpacity="0.26" textAnchor="middle">C</text>
    </svg>
  ),
  blocks: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="4">
      <rect x="20" y="46" width="26" height="26" rx="5" fill="currentColor" fillOpacity="0.3" />
      <rect x="54" y="46" width="26" height="26" rx="5" fill="currentColor" fillOpacity="0.18" />
      <rect x="37" y="20" width="26" height="26" rx="5" fill="currentColor" fillOpacity="0.42" />
    </svg>
  ),
  bag: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      <rect x="26" y="34" width="48" height="50" rx="14" fill="currentColor" fillOpacity="0.22" />
      <path d="M36 40 Q50 22 64 40" />
      <rect x="40" y="54" width="20" height="18" rx="6" />
      <path d="M38 30 Q38 16 50 16 Q62 16 62 30" />
    </svg>
  ),
  star: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
      <path d="M50 16 L61 42 L88 44 L67 63 L74 90 L50 74 L26 90 L33 63 L12 44 L39 42 Z" fill="currentColor" fillOpacity="0.32" />
    </svg>
  ),
  sound: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 40 H34 L52 26 V74 L34 60 H22 Z" fill="currentColor" fillOpacity="0.35" />
      <path d="M60 38 Q70 50 60 62" />
      <path d="M68 30 Q84 50 68 70" />
    </svg>
  ),
  puzzle: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round">
      <path d="M34 18 H66 V32 C66 38 60 38 60 44 C60 50 66 50 66 56 V82 H34 V68 C34 62 28 62 28 56 C28 50 34 50 34 44 V18 Z" fill="currentColor" fillOpacity="0.22" />
    </svg>
  ),
  shape: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round">
      <circle cx="35" cy="37" r="16" fill="currentColor" fillOpacity="0.3" />
      <rect x="53" y="21" width="30" height="30" rx="4" fill="currentColor" fillOpacity="0.16" />
      <path d="M27 80 L50 44 L73 80 Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  magnifier: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      <circle cx="44" cy="44" r="22" fill="currentColor" fillOpacity="0.18" />
      <line x1="60" y1="60" x2="80" y2="80" strokeWidth="7" />
    </svg>
  ),
  ruler: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      <rect x="18" y="42" width="64" height="16" rx="3" fill="currentColor" fillOpacity="0.2" />
      <line x1="32" y1="42" x2="32" y2="50" />
      <line x1="44" y1="42" x2="44" y2="54" />
      <line x1="56" y1="42" x2="56" y2="50" />
      <line x1="68" y1="42" x2="68" y2="54" />
    </svg>
  ),
  numbers: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fontFamily="sans-serif" fontWeight="800">
      <text x="28" y="64" fontSize="40" fill="currentColor" fillOpacity="0.38" textAnchor="middle">1</text>
      <text x="50" y="64" fontSize="40" fill="currentColor" fillOpacity="0.3" textAnchor="middle">2</text>
      <text x="72" y="64" fontSize="40" fill="currentColor" fillOpacity="0.22" textAnchor="middle">3</text>
    </svg>
  ),
  pinyin: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="4" fontFamily="sans-serif" fontWeight="800">
      <rect x="16" y="36" width="26" height="30" rx="6" fill="currentColor" fillOpacity="0.25" />
      <rect x="58" y="36" width="26" height="30" rx="6" fill="currentColor" fillOpacity="0.25" />
      <text x="29" y="60" fontSize="22" fill="currentColor" textAnchor="middle">b</text>
      <text x="71" y="60" fontSize="22" fill="currentColor" textAnchor="middle">a</text>
      <text x="50" y="58" fontSize="22" fill="currentColor" textAnchor="middle">+</text>
    </svg>
  ),
};

const MOTIF_MAP: Record<string, string> = {
  // 语文
  pinyin: 'pinyin', lessons: 'book', characters: 'book', strokes: 'brush', texts: 'book',
  textchars: 'book', poems: 'book', trace: 'brush', quiz: 'star', pinyin_blend: 'pinyin',
  strokes_order: 'brush', reading: 'book', sentence: 'sound', school_prep: 'bag',
  // 数学
  count: 'numbers', compare: 'scale', position: 'magnifier', shape: 'shape', solid: 'shape',
  split: 'blocks', '1120': 'numbers', calc: 'blocks', carry: 'blocks', clock: 'clock',
  angle: 'ruler', pattern: 'puzzle', word_problem: 'blocks', ordinal: 'star', clock_half: 'clock',
  compare_more: 'scale', calendar: 'calendar',
  // 英语
  letters: 'abc', units: 'book', words: 'abc', listen: 'sound', speak: 'sound',
  phonics: 'abc', sentences: 'sound',
};

function motifFor(subject: string, moduleKey: string): string {
  return MOTIF_MAP[moduleKey] ?? DEFAULT_SUBJECT_MOTIF[subject] ?? 'book';
}

const DEFAULT_SUBJECT_MOTIF: Record<string, string> = {
  chinese: 'book',
  math: 'blocks',
  english: 'abc',
};

export function ModuleCover({
  subject,
  moduleKey,
  emoji,
  color = 'bg-moko-blue',
  variant = 'card',
}: {
  subject: string;
  moduleKey: string;
  emoji: string;
  color?: string;
  variant?: 'card' | 'banner';
}) {
  const grad = GRADIENT[color] ?? DEFAULT_GRAD[subject] ?? DEFAULT_GRAD.chinese;
  const motif = motifFor(subject, moduleKey);
  const motifNode = MOTIFS[motif]?.() ?? MOTIFS.book();
  const height = variant === 'banner' ? 'h-40' : 'h-28';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl w-full ${height} shadow-inner`}
      style={{ background: grad }}
    >
      {/* 装饰点缀 */}
      <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-white/25" aria-hidden />
      <div className="absolute top-7 right-9 w-2 h-2 rounded-full bg-white/20" aria-hidden />
      <div className="absolute bottom-6 right-12 w-4 h-4 rounded-full bg-white/15" aria-hidden />
      <div className="absolute bottom-9 left-6 text-white/25 text-lg leading-none" aria-hidden>✦</div>
      {/* 主题图形（右下角，淡色） */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 text-white/25">
        {motifNode}
      </div>
      {/* 大 emoji 主角 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={variant === 'banner' ? 'text-7xl drop-shadow-md' : 'text-5xl sm:text-6xl drop-shadow-md'}>
          {emoji}
        </span>
      </div>
    </div>
  );
}
