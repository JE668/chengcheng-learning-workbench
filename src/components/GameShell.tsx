'use client';

import { useState } from 'react';
import { mokoChars } from '@/lib/moko';

export default function GameShell({
  gameId,
  title,
  mokoKey,
  children,
  onScore,
}: {
  gameId: string;
  title: string;
  mokoKey: string;
  children: (props: { onFinish: (score: number) => void; started: boolean }) => React.ReactNode;
  onScore?: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('');
  const moko = mokoChars[mokoKey] || mokoChars.lemei;

  async function handleFinish(finalScore: number) {
    setScore(finalScore);
    setFinished(true);
    setStarted(false);
    try {
      const res = await fetch('/api/tasks/game-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, score: finalScore }),
      });
      const data = await res.json();
      setMsg(data.message || `获得 ${finalScore} 积分！`);
      onScore?.();
    } catch {
      setMsg(`游戏结束！获得 ${finalScore} 积分（本次仅本地记录）`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <img src={moko.img} alt={moko.name} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-moko-pink shadow object-cover" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-moko-violet">{title}</h1>
            <p className="text-gray-600 font-medium">{moko.name}：{moko.line}</p>
          </div>
        </div>
      </div>

      {!started && !finished && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-700 mb-6">准备好接受挑战了吗？完成后可以获得积分哦！</p>
          <button onClick={() => setStarted(true)} className="px-10 py-4 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-full shadow-lg hover:scale-105 transition">
            开始游戏 ▶
          </button>
        </div>
      )}

      {started && children({ onFinish: handleFinish, started })}

      {finished && (
        <div className="text-center bg-white rounded-3xl shadow-xl p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-moko-violet mb-2">挑战完成！</h2>
          <p className="text-xl text-moko-rose font-bold mb-4">{msg || `获得 ${score} 积分！`}</p>
          <button onClick={() => { setFinished(false); setStarted(true); setScore(0); setMsg(''); }} className="px-8 py-3 bg-moko-blue text-white rounded-full font-bold shadow hover:scale-105 transition">
            再玩一次
          </button>
        </div>
      )}
    </div>
  );
}
