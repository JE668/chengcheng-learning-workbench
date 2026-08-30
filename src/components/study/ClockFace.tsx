'use client';

/**
 * 可复用的钟表组件（整时 + 半点）
 * 用于：学习模块、每日一练钟表题
 */
export function ClockFace({ hour, half = false }: { hour: number; half?: boolean }) {
  const cx = 60;
  const cy = 60;

  const hand = (angleDeg: number, len: number, width: number, color: string) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return (
      <line
        x1={cx}
        y1={cy}
        x2={cx + len * Math.cos(a)}
        y2={cy + len * Math.sin(a)}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return (
      <line
        key={i}
        x1={cx + 52 * Math.cos(a)}
        y1={cy + 52 * Math.sin(a)}
        x2={cx + 46 * Math.cos(a)}
        y2={cy + 46 * Math.sin(a)}
        stroke="#94a3b8"
        strokeWidth={2}
      />
    );
  });

  return (
    <svg viewBox="0 0 120 120" className="w-44 h-44 mx-auto">
      <circle cx={cx} cy={cy} r={54} fill="#fff" stroke="#cbd5e1" strokeWidth={3} />
      {ticks}
      {/* 分针：整时指向 12，半点指向 6 */}
      {half ? hand(180, 40, 4, '#334155') : hand(0, 38, 4, '#334155')}
      {/* 时针：整时指向 hour，半点在 hour 与 hour+1 之间 */}
      {half ? hand(hour * 30 + 15, 26, 6, '#ef4444') : hand(hour * 30, 26, 6, '#ef4444')}
      <circle cx={cx} cy={cy} r={4} fill="#334155" />
    </svg>
  );
}
