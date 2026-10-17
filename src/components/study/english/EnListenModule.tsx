'use client';

// ⚠️ 直接从具体子模块导入，不要走 `@/lib/study-data` barrel（barrel 的 export *
// 会把全部 ~110KB 数据打进 chunk，见拆分前的 EnglishModules 原注释）。

// 难度定义与 Easy 词表来自拆分出的 shared.ts（原文件 295-310 行，EnListen 专用）
import { type DiffLevel, LEVEL_META, LEVEL_ORDER, EN_EASY_WORDS } from './shared';

import { useState, useEffect } from 'react';
import { ALL_EN_WORDS, type WordItem } from '@/lib/study-data-en';
import { speakEn } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 从候选里取 k 个**单词各不相同**的项。
 *
 * ⚠️ 不能只按 word 过滤「目标」：同一个英文词可能**合法地**出现在两个主题里
 * （orange 既是「橙子」又是「橙色」，在 EN_WORD_TOPICS 里出现两次）。
 * 那样两个干扰项会拿到同一个词 → 选项出现两个一模一样的单词，
 * 孩子一眼就能看出「重复的那个肯定不是答案」—— 等于泄题。
 *
 * 抽成纯函数是为了能被**对抗性输入**确定性地测试
 * （这类 bug 靠随机抽样跑几千次也抓不住：命中概率约万分之 1.8）。
 */
export function pickDistinctWords(candidates: WordItem[], k: number): WordItem[] {
  const seen = new Set<string>();
  const out: WordItem[] = [];
  for (const w of candidates) {
    if (out.length >= k) break;
    if (seen.has(w.word)) continue;
    seen.add(w.word);
    out.push(w);
  }
  return out;
}

export function buildQuestion(level: DiffLevel): { target: WordItem; options: WordItem[] } {
  const pool =
    level === 'easy'
      ? EN_EASY_WORDS
      : level === 'medium'
        ? ALL_EN_WORDS.slice(0, 40)
        : ALL_EN_WORDS;
  const k = level === 'easy' ? 3 : 4;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = pickDistinctWords(shuffle(pool.filter((w) => w.word !== target.word)), k - 1);
  return { target, options: shuffle([target, ...distractors]) };
}

function EnListenQuiz() {
  const [level, setLevel] = useState<DiffLevel>('easy');
  const [q, setQ] = useState<{ target: WordItem; options: WordItem[] }>(() =>
    buildQuestion('easy')
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const logM = useMistakeLogger();

  useEffect(() => {
    const saved = localStorage.getItem('englishDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQ(buildQuestion(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('englishDiffLevel', level);
  }, [level]);

  useEffect(() => {
    speakEn(q.target.word, level === 'hard' ? 0.95 : 0.75);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function nextRound(newLevel: DiffLevel) {
    setLevel(newLevel);
    setPicked(null);
    setQ(buildQuestion(newLevel));
  }

  function choose(opt: WordItem) {
    if (picked) return;
    setPicked(opt.word);
    const ok = opt.word === q.target.word;
    speakEn(ok ? 'Great job!' : `No, it is ${q.target.word}`);
    let nl = level;
    if (ok) {
      const nr = streak.right + 1;
      setStreak({ right: nr, wrong: 0 });
      if (nr >= 3 && level !== 'hard') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
    } else {
      const nw = streak.wrong + 1;
      setStreak({ right: 0, wrong: nw });
      if (nw >= 2 && level !== 'easy') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1];
      logM({
        subject: '英语',
        kind: '听音选词',
        prompt: q.target.word,
        answer: q.target.word,
        wrong: opt.word,
      });
    }
    setTimeout(() => nextRound(nl), ok ? 1400 : 1700);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-yellow to-amber-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">
          难度：{meta.emoji} {meta.label}
        </span>
        <span className="text-xs opacity-90">连对 {streak.right} · 自动调整中</span>
      </div>
      <div className="text-center mb-4">
        <button
          onClick={() => speakEn(q.target.word, level === 'hard' ? 0.95 : 0.75)}
          className="w-24 h-24 mx-auto rounded-full bg-white text-moko-yellow text-5xl shadow-lg active:scale-95 transition flex items-center justify-center"
        >
          🔊
        </button>
        <div className="text-sm mt-2 opacity-95">听一听，选出正确的单词～</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isAnswer = opt.word === q.target.word;
          const isPicked = opt.word === picked;
          let cls = 'bg-white text-moko-violet border-2 border-moko-yellow';
          if (picked) {
            if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
            else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
            else cls = 'bg-white text-moko-violet border-2 border-moko-yellow opacity-60';
          }
          return (
            <button
              key={opt.word}
              disabled={!!picked}
              onClick={() => choose(opt)}
              className={`py-3 rounded-xl font-black shadow active:scale-95 transition disabled:cursor-default ${cls}`}
            >
              <div className="text-3xl">{opt.emoji}</div>
              <div className="text-lg">{opt.word}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EnListenModule() {
  return <EnListenQuiz />;
}
