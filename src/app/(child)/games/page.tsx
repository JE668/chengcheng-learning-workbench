import Link from 'next/link';
import MokoCard from '@/components/MokoCard';
import { games, mokoChars } from '@/lib/moko';
import { getGameBest } from '@/lib/game-difficulty';

export default function GamesPage() {
  // 预计算每个游戏的个人最佳成绩（在服务端渲染时一次性计算）
  const gameBests = new Map<string, number>();
  if (typeof window === 'undefined') {
    // SSR 阶段：game-difficulty 用内存存储，首次为 0
    for (const g of games) gameBests.set(g.id, 0);
  } else {
    for (const g of games) gameBests.set(g.id, getGameBest(g.id));
  }
  // 更稳健的方式：在客户端用 useEffect 获取，但 SSR 先给 0
  // 实际最佳成绩会在客户端 hydration 后通过 MokoCard 显示

  return (
    <div className="max-w-4xl mx-auto fade-up">
      <h1 className="page-title mb-2">萌可游戏乐园 🎮</h1>
      <p className="text-gray-600 mb-4">完成学习后来玩游戏吧！游戏也有积分奖励哦~</p>
      <Link href="/games/adventure" className="block mb-6 rounded-2xl p-4 bg-gradient-to-r from-moko-purple to-moko-violet text-white shadow-lg hover:scale-[1.02] transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black">🗺️ 萌可冒险地图</div>
            <div className="text-sm opacity-90">沿路闯关，城堡越繁荣解锁越多关卡！</div>
          </div>
          <div className="text-3xl">➡️</div>
        </div>
      </Link>
      <Link href="/story" className="block mb-6 rounded-2xl p-4 bg-gradient-to-r from-moko-gold to-moko-yellow text-white shadow-lg hover:scale-[1.02] transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black">📜 萌可剧情 · 捕捉萌可</div>
            <div className="text-sm opacity-90">跟着乐美公主的故事，一集一集把萌可接回城堡！</div>
          </div>
          <div className="text-3xl">➡️</div>
        </div>
      </Link>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((g) => (
          <MokoCard
            key={g.id}
            href={`/games/${g.id}`}
            title={g.title}
            desc={`${g.desc} · ${g.difficulty}`}
            img={mokoChars[g.mokoKey]?.img || '/moko/lemei.jpg'}
            color="bg-gradient-to-br from-moko-purple to-moko-violet"
            badge={getGameBest(g.id) > 0 ? `🏆 ${getGameBest(g.id)}` : undefined}
          />
        ))}
      </div>
    </div>
  );
}