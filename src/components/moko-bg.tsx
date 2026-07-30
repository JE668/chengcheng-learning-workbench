'use client';

import { useEffect, useState } from 'react';

const FRIENDS = [
  { src: '/moko/heartping.jpg', alt: '爱心萌可', size: 120, top: '6%', left: '4%', delay: '0s' },
  { src: '/moko/courageping.jpg', alt: '正正萌可', size: 110, top: '16%', right: '6%', delay: '1.2s' },
  { src: '/moko/singping.jpg', alt: '唱唱萌可', size: 105, bottom: '24%', left: '6%', delay: '2.1s' },
  { src: '/moko/gemsping.jpg', alt: '宝石萌可', size: 100, bottom: '10%', right: '8%', delay: '0.8s' },
  { src: '/moko/sweetsping.jpg', alt: '甜心萌可', size: 95, top: '44%', left: '2%', delay: '1.6s' },
  { src: '/moko/lemei.jpg', alt: '乐美', size: 100, bottom: '6%', left: '28%', delay: '1.1s' },
];

export function MokoGroupBg() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden dashboard-bg">
      {FRIENDS.map((f, i) => (
          <img
          key={i}
          src={f.src}
          alt={f.alt}
          width={f.size}
          height={f.size}
          loading="lazy"
          decoding="async"
          className="absolute rounded-full object-cover opacity-[0.12] grayscale-[0.1] blur-[0.5px] float-moko"
          style={{
            width: f.size,
            height: f.size,
            top: f.top,
            left: f.left,
            right: f.right,
            bottom: f.bottom,
            animationDelay: f.delay,
            opacity: mounted ? undefined : 0,
            transition: 'opacity 1s ease',
          }}
        />
      ))}
    </div>
  );
}
