import Link from 'next/link';
import MokoCard from '@/components/MokoCard';
import GameBestBadge from '@/components/GameBestBadge';
import { games, mokoChars } from '@/lib/moko';

export default function GamesPage() {
  // 本页是服务端组件，而最佳成绩存在 localStorage（客户端专属，见 lib/game-difficulty.ts）。
  // 原实现在这里调用 getGameBest()，该函数开头 `if (typeof window === 'undefined') return 0`
  // 会让 SSR 恒得 0 → badge 恒为 undefined → **角标永远不显示**。
  // （原页面里的 gameBests Map 从头到尾没被读取，是一段死代码。）
  //
  // 正确做法：把读取放进客户端组件 GameBestBadge，由它在水合完成后渲染，
  // 这样 SSR 与客户端首帧一致（无 hydration mismatch），随后补上角标。
  return (
    <div className="max-w-4xl mx-auto fade-up">
      <h1 className="page-title mb-2">萌可游戏乐园 🎮</h1>
      <p className="text-gray-600 mb-4">完成学习后来玩游戏吧！游戏也有积分奖励哦~</p>
      <Link
        href="/games/adventure"
        className="block mb-6 rounded-2xl p-4 bg-gradient-to-r from-moko-purple to-moko-violet text-white shadow-lg hover:scale-[1.02] transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black">🗺️ 萌可冒险地图</div>
            <div className="text-sm opacity-90">沿路闯关，城堡越繁荣解锁越多关卡！</div>
          </div>
          <div className="text-3xl">➡️</div>
        </div>
      </Link>
      <Link
        href="/story"
        className="block mb-6 rounded-2xl p-4 bg-gradient-to-r from-moko-gold to-moko-yellow text-white shadow-lg hover:scale-[1.02] transition"
      >
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
            badge={<GameBestBadge gameId={g.id} />}
          />
        ))}
      </div>
    </div>
  );
}
