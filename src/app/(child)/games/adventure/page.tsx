'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { games, mokoChars } from '@/lib/moko';

// 解锁阶梯：前 3 个常开，之后每关需 +5 繁荣度
function requiredProsperity(index: number): number {
  return index <= 2 ? 0 : (index - 2) * 5;
}

export default function AdventurePage() {
  const [prosperity, setProsperity] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/castle/state')
      .then((r) => r.json())
      .then((j) => setProsperity(j.prosperity || 0))
      .catch(() => setProsperity(0))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/games" className="text-moko-violet font-bold hover:underline">‹ 游戏乐园</Link>
      </div>
      <h1 className="page-title mb-2">🗺️ 萌可冒险地图</h1>
      <p className="text-gray-600 mb-6">
        沿着萌可小路一路闯关！城堡越繁荣，解锁的关卡越多。当前繁荣度：
        <span className="font-black text-moko-rose"> {loaded ? prosperity : '…'}</span>
      </p>

      <div className="relative">
        {/* 蜿蜒小路 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-dashed bg-moko-purple/20" style={{ borderLeft: '3px dashed rgba(168,85,247,0.35)' }} />
        <div className="space-y-6">
          {games.map((g, i) => {
            const need = requiredProsperity(i);
            const unlocked = prosperity >= need;
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div key={g.id} className={`relative flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
                <div className={`w-[78%] sm:w-[60%] rounded-3xl p-4 shadow-xl border-2 ${unlocked ? 'bg-white border-moko-purple/30' : 'bg-gray-100 border-gray-200 opacity-80'}`}>
                  <div className="flex items-center gap-3">
                    <img src={mokoChars[g.mokoKey]?.img || '/moko/lemei.jpg'} alt={g.title} className={`w-16 h-16 rounded-2xl object-cover border-2 border-white shadow ${unlocked ? '' : 'grayscale'}`} />
                    <div className="flex-1">
                      <div className="font-black text-moko-violet text-lg">第 {i + 1} 关 · {g.title}</div>
                      <div className="text-xs text-gray-500">{g.desc}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{g.difficulty}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    {unlocked ? (
                      <Link href={`/games/${g.id}`} className="block text-center py-2 rounded-full bg-gradient-to-r from-moko-purple to-moko-violet text-white font-black text-sm active:scale-95 transition">
                        ▶ 开始闯关
                      </Link>
                    ) : (
                      <div className="text-center py-2 rounded-full bg-gray-200 text-gray-500 font-bold text-sm">
                        🔒 需繁荣度 {need}
                      </div>
                    )}
                  </div>
                </div>
                {/* 路标圆点 */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'right-0 -mr-3' : 'left-0 -ml-3'} z-10 w-6 h-6 rounded-full border-4 border-white shadow ${unlocked ? 'bg-moko-pink' : 'bg-gray-300'}`} style={{ [side === 'left' ? 'right' : 'left']: '-12px' }} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">多完成今日三科打卡、多玩已解锁的游戏，城堡会更繁荣，解锁更多关卡～</p>
    </div>
  );
}
