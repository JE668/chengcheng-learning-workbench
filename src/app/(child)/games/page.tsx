import MokoCard from '@/components/MokoCard';
import { games, mokoChars } from '@/lib/moko';

export default function GamesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-2">萌可游戏乐园 🎮</h1>
      <p className="text-gray-600 mb-6">完成学习后来玩游戏吧！游戏也有积分奖励哦~</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((g) => (
          <MokoCard
            key={g.id}
            href={`/games/${g.id}`}
            title={g.title}
            desc={`${g.desc} · ${g.difficulty}`}
            img={mokoChars[g.mokoKey]?.img || '/moko/lemei.jpg'}
            color="bg-gradient-to-br from-moko-purple to-moko-violet"
          />
        ))}
      </div>
    </div>
  );
}
