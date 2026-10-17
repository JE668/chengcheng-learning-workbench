'use client';

// ⚠️ 直接从具体子模块导入，不要走 `@/lib/study-data` barrel（barrel 的 export *
// 会把全部 ~110KB 数据打进 chunk，见拆分前的 ChineseModules 原注释）。

import { useState, useEffect } from 'react';
import { TEXTBOOK_CHARACTERS, textbookCharsUpTo, type TextbookChar } from '@/lib/study-data/units';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useModuleProgress } from '@/lib/module-progress';

type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

/**
 * 题库跟着课本生字表走（与识字课文、家长听写同源）：
 * 入门只考前两单元（天地人 / 数字 / 自然 / 人体），进阶到第七单元，挑战覆盖全册。
 */
export const LEVEL_POOL: Record<DiffLevel, TextbookChar[]> = {
  easy: textbookCharsUpTo(2),
  medium: textbookCharsUpTo(7),
  hard: TEXTBOOK_CHARACTERS,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface CharQ {
  mode: 'char2mean' | 'mean2char';
  target: TextbookChar;
  options: string[];
  answer: string;
}

/**
 * 构造一道题。
 *
 * @param opts.shuffle 传 false 时走**确定性**路径（取池中第一个、不打乱选项）——
 *   专供组件首帧使用：客户端组件会被 SSR，首帧若就随机，服务端 HTML 与客户端必然不一致
 *   （React 会报 hydration 错误并丢弃子树重渲染）。挂载后再用默认的随机路径换题。
 */
export function buildQuestion(level: DiffLevel, opts: { shuffle?: boolean } = {}): CharQ {
  const random = opts.shuffle !== false;
  const pick = <T,>(arr: T[]): T => (random ? arr[Math.floor(Math.random() * arr.length)] : arr[0]);
  const arrange = <T,>(arr: T[]): T[] => (random ? shuffle(arr) : arr);

  const pool = LEVEL_POOL[level];
  const target = pick(pool);
  if (level === 'hard') {
    // mean2char: 题干显示释义，选项是字。如果释义包含目标字（如「子」→「孩子」），答案泄露，跳过
    const safePool = pool.filter((c) => !c.meaning.includes(c.char));
    const safeTarget = safePool.length > 0 ? pick(safePool) : target;
    const distractors = arrange(pool.filter((c) => c.char !== safeTarget.char))
      .slice(0, 3)
      .map((c) => c.char);
    return {
      mode: 'mean2char',
      target: safeTarget,
      options: arrange([safeTarget.char, ...distractors]),
      answer: safeTarget.char,
    };
  }
  // ⚠️ 释义会撞车：比如「站」和「立」都写「站立」、「天」和「空」都写「天空」。
  // 原实现只过滤了「与目标释义相同」的，于是**两个干扰项彼此相同**时，
  // 选项里会出现两个一模一样的内容 —— 孩子选对了那个却被判错。
  // 现在按释义整体去重地收集干扰项。
  const seenMeaning = new Set<string>([target.meaning]);
  const distractors: string[] = [];
  for (const c of arrange(pool)) {
    if (distractors.length >= 3) break;
    if (seenMeaning.has(c.meaning)) continue;
    seenMeaning.add(c.meaning);
    distractors.push(c.meaning);
  }
  return {
    mode: 'char2mean',
    target,
    options: arrange([target.meaning, ...distractors]),
    answer: target.meaning,
  };
}

export function CharacterQuizModule() {
  const { record } = useModuleProgress('chinese', 'quiz');
  const [level, setLevel] = useState<DiffLevel>('easy');
  // 首帧用确定性题目（SSR 一致），挂载后再随机换题（见下面的 mount effect）
  const [q, setQ] = useState<CharQ>(() => buildQuestion('easy', { shuffle: false }));
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const logM = useMistakeLogger();

  useEffect(() => {
    const saved = localStorage.getItem('chineseDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQ(buildQuestion(saved));
    } else {
      // 没有存档时也要把首帧的确定性题目换成随机的，否则会一直停在第一题
      setQ(buildQuestion('easy'));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chineseDiffLevel', level);
  }, [level]);

  function nextRound(newLevel: DiffLevel) {
    setLevel(newLevel);
    setPicked(null);
    setQ(buildQuestion(newLevel));
  }

  // 换题时自动朗读：char2mean 读「字 + 拼音」，mean2char 读「哪个字是这个意思」
  useEffect(() => {
    if (q.mode === 'char2mean') {
      speakZh(`${q.target.char}，${q.target.meaning}`);
    } else {
      speakZh(`哪个字的意思是「${q.target.meaning}」？`);
    }
  }, [q.mode, q.target.char, q.target.meaning]);

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const ok = opt === q.answer;
    speakZh(ok ? '答对啦！' : `不对哦，${q.target.char} 是 ${q.target.meaning}`);
    const newCorrect = totalCorrect + (ok ? 1 : 0);
    const newAnswered = totalAnswered + 1;
    setTotalCorrect(newCorrect);
    setTotalAnswered(newAnswered);
    // 每答 8 题结算一次星（做够就至少 1 星，≥70% 给 2 星，≥90% 给 3 星）
    if (newAnswered >= 8 && newAnswered % 8 === 0) {
      const acc = newCorrect / newAnswered;
      const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      record(stars);
    }
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
        subject: '语文',
        kind: '识字',
        prompt: `${q.target.char} 是什么意思？`,
        answer: q.target.meaning,
        wrong: opt,
        chapter: q.target.unit, // 带上课本单元，家长端错题本能看出是哪一单元没过关
      });
    }
    setTimeout(() => nextRound(nl), ok ? 1400 : 1700);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">
          难度：{meta.emoji} {meta.label}
        </span>
        <span className="text-xs opacity-90">连对 {streak.right} · 自动调整中</span>
      </div>
      <div className="text-center mb-4">
        {q.mode === 'char2mean' ? (
          <>
            <div className="text-sm font-bold opacity-90">
              {q.target.pinyin}
              {q.target.altPinyin ? (
                <span className="opacity-75"> · 又读 {q.target.altPinyin}</span>
              ) : null}
            </div>
            <div className="text-6xl font-black mb-1">{q.target.char}</div>
            <button
              onClick={() => speakZh(q.target.char)}
              className="text-xs px-3 py-1 rounded-full bg-white/30 font-bold active:scale-95 transition"
            >
              🔊 读一读
            </button>
            <div className="text-sm mt-2 opacity-95">这个字是什么意思？</div>
          </>
        ) : (
          <div className="text-base font-bold">哪个字的意思是「{q.target.meaning}」？</div>
        )}
        <div className="text-[11px] mt-2 opacity-80">
          课本第 {q.target.chapter} 单元 · {q.target.unit}
        </div>
      </div>
      <div
        className={`grid gap-2 ${q.mode === 'mean2char' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}
      >
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          let cls = 'bg-white text-moko-rose border-2 border-moko-rose';
          if (picked) {
            if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
            else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
            else cls = 'bg-white text-moko-rose border-2 border-moko-rose opacity-60';
          }
          return (
            <button
              key={opt}
              disabled={!!picked}
              onClick={() => choose(opt)}
              className={`py-3 rounded-xl font-black shadow active:scale-95 transition disabled:cursor-default ${
                q.mode === 'mean2char' ? 'text-3xl' : 'text-lg'
              } ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
