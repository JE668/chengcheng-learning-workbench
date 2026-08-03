'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MY_DAY } from '@/lib/study-data';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function MyDayModule() {
  const { record } = useModuleProgress('chinese', 'my-day');
  const [active, setActive] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const scrambled = useMemo(() => shuffle(MY_DAY.map((_, i) => i)), []);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);

  function read(i: number) {
    setActive(i);
    speakZh(MY_DAY[i].text, 0.8);
    setTimeout(() => setActive((a) => (a === i ? null : a)), 1200);
  }

  // 排序游戏：按时间从早到晚点
  function tapOrder(origIdx: number) {
    if (done || order.includes(origIdx)) return;
    const expected = MY_DAY.filter((_, i) => !order.includes(i)).sort((a, b) => toMin(a.time) - toMin(b.time))[0];
    if (origIdx === MY_DAY.indexOf(expected)) {
      const next = [...order, origIdx];
      setOrder(next);
      speakZh(MY_DAY[origIdx].text, 0.8);
      if (next.length === MY_DAY.length) {
        setDone(true);
        praise();
        record(3);
      }
    } else {
      setWrong(origIdx);
      speakZh('还没到这个时间，先找更早的～', 0.85);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(null), 1200);
    }
  }

  function resetGame() {
    setOrder([]);
    setDone(false);
    setWrong(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-blue to-moko-cyan text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🕒🌞</div>
        <h2 className="text-2xl font-black">我的一天</h2>
        <p className="text-sm opacity-90 mt-1">正正萌可：点一点，听听程程每一天都在做什么；再帮它们排排队！</p>
      </div>

      {/* 时间线 */}
      <div className="rounded-3xl p-5 bg-white shadow-xl border-2 border-moko-blue/20">
        <h3 className="text-lg font-black text-moko-blue mb-3">📅 程程的一天（点一点听一听）</h3>
        <ol className="relative border-l-4 border-moko-blue/30 ml-3 space-y-3">
          {MY_DAY.map((d, i) => (
            <li key={i} className="ml-4">
              <span className="absolute -left-[18px] flex items-center justify-center w-7 h-7 bg-white rounded-full border-2 border-moko-blue shadow text-sm">{d.emoji}</span>
              <button
                onClick={() => read(i)}
                className={`w-full text-left rounded-2xl px-4 py-2 transition ${
                  active === i ? 'bg-moko-blue text-white shadow' : 'bg-moko-blue/5 hover:bg-moko-blue/10'
                }`}
              >
                <span className="font-black text-moko-blue mr-2">{active === i ? '🔊' : '🕐'} {d.time}</span>
                <span className={active === i ? 'text-white' : 'text-gray-700'}>{d.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* 排序游戏 */}
      <div className="rounded-3xl p-5 bg-white shadow-xl border-2 border-moko-cyan/20">
        <h3 className="text-lg font-black text-moko-cyan mb-1">🔢 给一天排排队</h3>
        <p className="text-sm text-gray-500 mb-3">从最早的事开始，按时间顺序点一点！</p>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-black text-moko-cyan">你排好了一整天，时间观念真好！</p>
            <button onClick={resetGame} className="mt-3 px-6 py-2 rounded-full bg-moko-cyan text-white font-bold text-sm active:scale-95 transition">
              🔄 再排一次
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {scrambled.map((origIdx) => {
                const used = order.includes(origIdx);
                const isWrong = wrong === origIdx;
                return (
                  <button
                    key={origIdx}
                    disabled={used}
                    onClick={() => tapOrder(origIdx)}
                    className={`py-3 rounded-2xl font-bold shadow active:scale-95 transition text-sm ${
                      used
                        ? 'bg-green-100 text-green-700'
                        : isWrong
                          ? 'bg-red-100 text-red-600 border-2 border-red-400'
                          : 'bg-white text-moko-blue border-2 border-moko-blue/40'
                    }`}
                  >
                    {MY_DAY[origIdx].emoji} {MY_DAY[origIdx].text}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">已排好 {order.length} / {MY_DAY.length} 件</p>
          </>
        )}
      </div>
    </div>
  );
}
