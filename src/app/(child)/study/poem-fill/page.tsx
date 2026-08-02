'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { POEMS, CHARACTERS } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';

const PUNCT = new Set(['，', '。', '？', '！', '、', '；', '：', '“', '”', '《', '》']);

type Token =
  | { kind: 'punct'; text: string }
  | { kind: 'char'; text: string }
  | { kind: 'blank'; expected: string; slot: number };

function buildLines(poemLines: string[]): Token[][] {
  const lines: Token[][] = [];
  let slot = 0;
  for (const line of poemLines) {
    const chars = line.split('');
    const letters = chars.filter((c) => !PUNCT.has(c));
    const total = letters.length;
    let letterSeen = 0;
    const tokens: Token[] = [];
    for (const c of chars) {
      if (PUNCT.has(c)) {
        tokens.push({ kind: 'punct', text: c });
        continue;
      }
      letterSeen += 1;
      // 每行至少藏 1 个；其余每 3 个藏 1 个（但不藏最后一个字，便于押韵记忆）
      const hide = letterSeen === 1 || (letterSeen % 3 === 0 && letterSeen < total);
      if (hide) {
        tokens.push({ kind: 'blank', expected: c, slot });
        slot += 1;
      } else {
        tokens.push({ kind: 'char', text: c });
      }
    }
    lines.push(tokens);
  }
  return lines;
}

function pickDistractors(blanks: string[], n: number): string[] {
  const used = new Set(blanks);
  const pool = CHARACTERS.map((c) => c.char).filter((c) => !used.has(c));
  const out: string[] = [];
  let i = 3;
  while (out.length < n && i < pool.length) {
    out.push(pool[i % pool.length]);
    i += 7;
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PoemFillPage() {
  const [pIdx, setPIdx] = useState(0);
  const poem = POEMS[pIdx];

  const lines = useMemo(() => buildLines(poem.lines), [poem]);
  const blankCount = useMemo(() => lines.flat().filter((t) => t.kind === 'blank').length, [lines]);
  const blanks = useMemo(
    () => lines.flat().filter((t): t is Extract<Token, { kind: 'blank' }> => t.kind === 'blank').map((t) => t.expected),
    [lines],
  );

  const [slots, setSlots] = useState<(string | null)[]>(() => Array(blankCount).fill(null));
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);
  const [consumed, setConsumed] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);

  const candidates = useMemo(
    () => shuffle([...blanks, ...pickDistractors(blanks, Math.min(3, blanks.length))]),
    [blanks],
  );

  const reset = useCallback(() => {
    setSlots(Array(blankCount).fill(null));
    setConsumed(new Set());
    setWrongSlot(null);
    setSolved(false);
  }, [blankCount]);

  const gotoPoem = (i: number) => {
    setPIdx(i);
    setSlots(Array(blankCount).fill(null));
    setConsumed(new Set());
    setWrongSlot(null);
    setSolved(false);
  };

  const nextPoem = () => gotoPoem((pIdx + 1) % POEMS.length);
  const prevPoem = () => gotoPoem((pIdx - 1 + POEMS.length) % POEMS.length);

  const tapCard = (cardIdx: number, char: string) => {
    if (consumed.has(cardIdx) || solved) return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) return;
    const expected = blanks[slotIdx];
    if (char === expected) {
      const ns = [...slots];
      ns[slotIdx] = char;
      setSlots(ns);
      setConsumed((prev) => new Set(prev).add(cardIdx));
      if (ns.every((s) => s !== null)) {
        setSolved(true);
        setTimeout(() => speakZh(poem.lines.join(''), 0.7), 500);
      }
    } else {
      setWrongSlot(slotIdx);
      setTimeout(() => setWrongSlot(null), 700);
    }
  };

  const readAll = () => speakZh(poem.lines.join(''), 0.7);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/study" className="text-moko-violet font-black no-underline">‹ 返回学习城堡</Link>
      <h1 className="text-3xl font-black text-moko-violet mt-2 mb-1">古诗填空背诵 📜</h1>
      <p className="text-gray-600 mb-4">
        把缺少的字从下方字卡里点出来补上，全部填对就能听萌可念整首诗啦！
      </p>

      <div className="rounded-3xl p-6 shadow-xl border-2 border-moko-gold/30 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-moko-violet">{poem.title}</h2>
            <p className="text-sm text-gray-500">〔{poem.author}〕</p>
          </div>
          <button onClick={readAll} className="rounded-2xl px-4 py-2 bg-moko-gold text-white font-black shadow hover:scale-105 transition text-sm">🔊 朗读全诗</button>
        </div>

        <div className="space-y-3 text-2xl leading-relaxed font-bold tracking-wide">
          {lines.map((toks, li) => (
            <div key={li} className="flex flex-wrap items-end gap-1">
              {toks.map((t, ci) => {
                if (t.kind === 'punct') return <span key={ci} className="text-gray-400 mx-0.5">{t.text}</span>;
                if (t.kind === 'char') return <span key={ci} className="text-moko-violet">{t.text}</span>;
                const filled = slots[t.slot];
                const isWrong = wrongSlot === t.slot;
                return (
                  <span
                    key={ci}
                    className={`inline-flex items-center justify-center w-9 h-10 rounded-lg border-2 mx-0.5 ${
                      isWrong
                        ? 'border-moko-pink bg-moko-pink/15 text-moko-pink'
                        : filled
                        ? 'border-moko-cyan bg-moko-cyan/10 text-moko-violet'
                        : 'border-dashed border-gray-300 text-gray-300'
                    }`}
                  >
                    {filled ?? '＿'}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {solved && (
          <div className="mt-5 rounded-2xl p-4 bg-moko-gold/15 text-center">
            <div className="text-4xl mb-1">🎉🌟🎉</div>
            <p className="text-moko-violet font-black">太棒啦！这首诗你填对啦，跟着萌可一起背一遍吧～</p>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-3xl p-5 shadow-lg border-2 border-moko-purple/20 bg-white">
        <h3 className="text-lg font-black text-moko-violet mb-3">🔤 字卡（点一点补到上面）</h3>
        <div className="flex flex-wrap gap-3">
          {candidates.map((c, ci) => (
            <button
              key={ci}
              disabled={consumed.has(ci) || solved}
              onClick={() => tapCard(ci, c)}
              className={`w-14 h-14 rounded-2xl text-2xl font-black shadow transition ${
                consumed.has(ci) || solved
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-moko-cyan/15 text-moko-violet hover:scale-110 active:scale-95'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={reset} className="rounded-2xl px-5 py-2 bg-gray-200 text-gray-700 font-black shadow hover:scale-105 transition">🧽 重填</button>
          <button onClick={prevPoem} className="rounded-2xl px-5 py-2 bg-moko-yellow text-white font-black shadow hover:scale-105 transition">‹ 上一首</button>
          <button onClick={nextPoem} className="rounded-2xl px-5 py-2 bg-moko-violet text-white font-black shadow hover:scale-105 transition">下一首 ›</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 背诵小帮手</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>先点「朗读全诗」听两遍，脑子里有画面再填空更容易。</li>
          <li>点错的字卡会变红一下，别急，换一张试试。</li>
          <li>填对全部空后，跟着萌可大声背出来，比死记硬背记得牢。</li>
        </ul>
      </div>
    </div>
  );
}
