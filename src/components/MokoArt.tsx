/* ============================================================
   程程学习工作台 — 原创萌可主题吉祥物插画（SVG）
   说明：以下为原创矢量吉祥物，风格契合「奇妙萌可」主题配色，
   并非任何第三方 IP 的复刻，可安全用于界面与打印奖状。
   ============================================================ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 💗 爱心萌可（语文学科吉祥物，原创） ---------- */
export function HeartMoko({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="爱心萌可">
      <defs>
        <radialGradient id="hm-body" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffd6ea" />
          <stop offset="55%" stopColor="#ff7ab8" />
          <stop offset="100%" stopColor="#ef4294" />
        </radialGradient>
      </defs>
      {/* 触角 + 爱心 */}
      <path d="M60 40 C60 28 60 22 60 16" stroke="#ef4294" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 6c-7-10-24-3-15 9 5 6 15 13 15 13s10-7 15-13c9-12-8-19-15-9z" fill="#ff3d8b" />
      <path d="M60 9c-4-6-13-2-8 5 3 4 8 8 8 8s5-4 8-8c5-7-4-11-8-5z" fill="#ff7ab8" opacity="0.6" />
      {/* 手臂 */}
      <ellipse cx="20" cy="70" rx="10" ry="7" fill="#ff7ab8" transform="rotate(-20 20 70)" />
      <ellipse cx="100" cy="70" rx="10" ry="7" fill="#ff7ab8" transform="rotate(20 100 70)" />
      {/* 身体 */}
      <ellipse cx="60" cy="68" rx="40" ry="37" fill="url(#hm-body)" />
      <ellipse cx="44" cy="52" rx="15" ry="11" fill="#ffffff" opacity="0.4" />
      {/* 腮红 */}
      <circle cx="40" cy="76" r="8" fill="#ff9ec7" opacity="0.85" />
      <circle cx="80" cy="76" r="8" fill="#ff9ec7" opacity="0.85" />
      {/* 眼睛 */}
      <circle cx="47" cy="60" r="9" fill="#3a2b3d" />
      <circle cx="73" cy="60" r="9" fill="#3a2b3d" />
      <circle cx="50" cy="56" r="3.2" fill="#fff" />
      <circle cx="76" cy="56" r="3.2" fill="#fff" />
      {/* 微笑 */}
      <path d="M48 78 Q60 90 72 78" stroke="#3a2b3d" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      {/* 脚 */}
      <ellipse cx="46" cy="104" rx="10" ry="6.5" fill="#ef4294" />
      <ellipse cx="74" cy="104" rx="10" ry="6.5" fill="#ef4294" />
    </svg>
  );
}

/* ---------- ⭐ 星光萌可（阳光/希望吉祥物，原创） ---------- */
export function StarMoko({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="星光萌可">
      <defs>
        <radialGradient id="sm-body" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="55%" stopColor="#ffd24d" />
          <stop offset="100%" stopColor="#f5a623" />
        </radialGradient>
      </defs>
      {/* 触角 + 星星 */}
      <path d="M60 40 C60 28 60 22 60 16" stroke="#f5a623" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 4l4.4 9.4 10 .9-7.6 6.7 2.3 10-9.1-5.4-9.1 5.4 2.3-10-7.6-6.7 10-.9z" fill="#ffb300" />
      <path d="M60 7l2.6 5.6 6 .5-4.5 4 1.4 6-5.5-3.2-5.5 3.2 1.4-6-4.5-4 6-.5z" fill="#ffe08a" opacity="0.7" />
      {/* 手臂 */}
      <ellipse cx="20" cy="70" rx="10" ry="7" fill="#ffd24d" transform="rotate(-20 20 70)" />
      <ellipse cx="100" cy="70" rx="10" ry="7" fill="#ffd24d" transform="rotate(20 100 70)" />
      {/* 身体 */}
      <ellipse cx="60" cy="68" rx="40" ry="37" fill="url(#sm-body)" />
      <ellipse cx="44" cy="52" rx="15" ry="11" fill="#ffffff" opacity="0.45" />
      {/* 腮红 */}
      <circle cx="40" cy="76" r="8" fill="#ffb385" opacity="0.8" />
      <circle cx="80" cy="76" r="8" fill="#ffb385" opacity="0.8" />
      {/* 眼睛 */}
      <circle cx="47" cy="60" r="9" fill="#5a3b1a" />
      <circle cx="73" cy="60" r="9" fill="#5a3b1a" />
      <circle cx="50" cy="56" r="3.2" fill="#fff" />
      <circle cx="76" cy="56" r="3.2" fill="#fff" />
      {/* 微笑 */}
      <path d="M48 78 Q60 90 72 78" stroke="#5a3b1a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      {/* 脚 */}
      <ellipse cx="46" cy="104" rx="10" ry="6.5" fill="#f5a623" />
      <ellipse cx="74" cy="104" rx="10" ry="6.5" fill="#f5a623" />
    </svg>
  );
}

/* ---------- 👑 乐美公主（引导吉祥物，原创） ---------- */
export function PrincessMoko({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} role="img" aria-label="乐美公主">
      <defs>
        <radialGradient id="pm-hair" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff9ed6" />
          <stop offset="100%" stopColor="#c44bd6" />
        </radialGradient>
        <linearGradient id="pm-dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9b6ff" />
          <stop offset="100%" stopColor="#8b6cf0" />
        </linearGradient>
      </defs>
      {/* 魔法杖（爱心） */}
      <line x1="96" y1="64" x2="108" y2="44" stroke="#caa24a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M108 40c-3.5-5-12-1.5-7.5 4.5 2.5 3 7.5 6.5 7.5 6.5s5-3.5 7.5-6.5c4.5-6-4-9.5-7.5-4.5z" fill="#ff5da0" />
      {/* 头发后层 */}
      <path d="M22 54 Q22 110 60 116 Q98 110 98 54 Q98 30 60 28 Q22 30 22 54z" fill="url(#pm-hair)" />
      {/* 脸 */}
      <ellipse cx="60" cy="58" rx="26" ry="27" fill="#ffe2cf" />
      {/* 刘海 */}
      <path d="M34 56 Q34 34 60 33 Q86 34 86 56 Q78 46 60 47 Q42 46 34 56z" fill="url(#pm-hair)" />
      {/* 皇冠 */}
      <path d="M42 30 L48 16 L56 27 L60 12 L64 27 L72 16 L78 30 Z" fill="#ffd24d" stroke="#e0a829" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="60" cy="14" r="2.6" fill="#ff5da0" />
      {/* 腮红 */}
      <circle cx="46" cy="64" r="5.5" fill="#ff9ec7" opacity="0.8" />
      <circle cx="74" cy="64" r="5.5" fill="#ff9ec7" opacity="0.8" />
      {/* 眼睛 */}
      <circle cx="51" cy="56" r="5.5" fill="#5a3b1a" />
      <circle cx="69" cy="56" r="5.5" fill="#5a3b1a" />
      <circle cx="52.6" cy="54" r="1.8" fill="#fff" />
      <circle cx="70.6" cy="54" r="1.8" fill="#fff" />
      {/* 微笑 */}
      <path d="M52 68 Q60 76 68 68" stroke="#a85a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* 裙子 */}
      <path d="M40 80 Q60 88 80 80 L92 118 Q60 126 28 118 Z" fill="url(#pm-dress)" />
      <path d="M40 80 Q60 88 80 80 L80 86 Q60 92 40 86 Z" fill="#ffffff" opacity="0.5" />
      {/* 衣领 */}
      <path d="M50 78 Q60 84 70 78 L70 82 Q60 88 50 82 Z" fill="#ffffff" />
    </svg>
  );
}

/* ---------- 🏅 奖状奖章（原创） ---------- */
export function CertSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="学习之星奖章">
      <defs>
        <radialGradient id="seal-bg" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fff0b8" />
          <stop offset="60%" stopColor="#ffcf3f" />
          <stop offset="100%" stopColor="#f0a819" />
        </radialGradient>
      </defs>
      {/* 飘带 */}
      <path d="M44 78 L36 112 L52 100 L60 112 L68 100 L84 112 L76 78 Z" fill="#ff5da0" />
      {/* 外圈 */}
      <circle cx="60" cy="54" r="40" fill="url(#seal-bg)" stroke="#e0a829" strokeWidth="3" />
      <circle cx="60" cy="54" r="31" fill="none" stroke="#fff7e0" strokeWidth="3" strokeDasharray="4 5" />
      {/* 星星 */}
      <path d="M60 28l7.6 16.3 17.6 1.9-13.2 12.2 3.9 17.5L60 83.6 44.1 92.9l3.9-17.5L34.8 46.2l17.6-1.9z" fill="#fff" />
      <path d="M60 34l5.7 12.3 13.3 1.4-10 9.2 3 13.2L60 80.4 47.7 87l3-13.2-10-9.2 13.3-1.4z" fill="#ff8a3d" opacity="0.9" />
    </svg>
  );
}

export { shuffle };
