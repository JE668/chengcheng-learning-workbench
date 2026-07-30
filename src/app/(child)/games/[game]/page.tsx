'use client';

import { useParams } from 'next/navigation';
import GameShell from '@/components/GameShell';
import { games } from '@/lib/moko';
import PinyinEliminate from '@/components/games/PinyinEliminate';
import CharacterMatch from '@/components/games/CharacterMatch';
import MathChallenge from '@/components/games/MathChallenge';
import CompareBalance from '@/components/games/CompareBalance';
import WordMatch from '@/components/games/WordMatch';
import LetterAdventure from '@/components/games/LetterAdventure';
import AngleMagic from '@/components/games/AngleMagic';
import CountChallenge from '@/components/games/CountChallenge';

const gameMap: Record<string, React.FC<{ onFinish: (score: number) => void }>> = {
  'pinyin-eliminate': PinyinEliminate,
  'character-match': CharacterMatch,
  'math-challenge': MathChallenge,
  'compare-balance': CompareBalance,
  'word-match': WordMatch,
  'letter-adventure': LetterAdventure,
  'angle-magic': AngleMagic,
  'count-challenge': CountChallenge,
};

export default function GamePage() {
  const { game } = useParams<{ game: string }>();
  const info = games.find((g) => g.id === game);
  const Component = gameMap[game];
  if (!info || !Component) return <div className="text-center py-20 text-gray-500">游戏不存在</div>;

  return (
    <GameShell gameId={info.id} title={info.title} mokoKey={info.mokoKey} levels={info.levels}>
      {({ onFinish, level }) => <Component onFinish={onFinish} level={level} />}
    </GameShell>
  );
}
