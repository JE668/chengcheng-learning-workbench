'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 学习首页的复习本入口：显示待复习数量
export default function ReviewBadge() {
  const [due, setDue] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/mistakes')
      .then((r) => r.json())
      .then((d) => setDue(d.total ?? 0))
      .catch(() => setDue(0));
  }, []);

  return (
    <Link
      href="/study/review"
      className="block rounded-2xl p-4 bg-gradient-to-r from-moko-purple to-moko-violet text-white shadow-lg hover:scale-[1.02] transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-black">📝 我的复习本</div>
          <div className="text-sm opacity-90">
            {due === null
              ? '加载中…'
              : due > 0
                ? `今天有 ${due} 个要复习，加油！`
                : '暂时没有要复习的，真棒！'}
          </div>
        </div>
        <div className="text-3xl">➡️</div>
      </div>
    </Link>
  );
}
