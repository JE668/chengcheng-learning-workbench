import { CHARACTERS } from '@/lib/study-data/characters';

const STROKE_CHARS = new Set(CHARACTERS.map((item) => item.char));

export function hasStrokes(ch: string): boolean {
  return STROKE_CHARS.has(ch);
}
