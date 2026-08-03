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
import MakeTen from '@/components/games/MakeTen';
import ToneDetective from '@/components/games/ToneDetective';
import WordChain from '@/components/games/WordChain';
import Schulte from '@/components/games/Schulte';
import PinyinSpell from '@/components/games/PinyinSpell';
import SpotDifference from '@/components/games/SpotDifference';
import SoundMemory from '@/components/games/SoundMemory';

const gameMap: Record<string, React.FC<{ onFinish: (score: number) => void; level?: number }>> = {
  'pinyin-eliminate': PinyinEliminate,
  'character-match': CharacterMatch,
  'math-challenge': MathChallenge,
  'compare-balance': CompareBalance,
  'word-match': WordMatch,
  'letter-adventure': LetterAdventure,
  'angle-magic': AngleMagic,
  'count-challenge': CountChallenge,
  'make-ten': MakeTen,
  'tone-detective': ToneDetective,
  'word-chain': WordChain,
  'schulte': Schulte,
  'pinyin-spell': PinyinSpell,
  'spot-difference': SpotDifference,
  'sound-memory': SoundMemory,
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
