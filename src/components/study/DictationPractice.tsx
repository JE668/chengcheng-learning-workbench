'use client';

import { useEffect, useState } from 'react';
import { GRADE1_CHAR_UNITS, CHARACTERS } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';
import { ModuleStars } from '@/components/study/ModuleStars';

type Mode = 'char' | 'pinyin';

interface Item {
  /** 朗读/展示的内容（汉字或词） */
  text: string;
  /** 正确答案：汉字模式=原词；拼音模式=拼音 */
  answer: string;
}

const PINYIN_MAP = new Map<string, string>(
  CHARACTERS.map((c) => [c.char, c.pinyin] as [string, string]),
);

function wordPinyin(w: string): string {
  return w
    .split('')
    .map((ch) => PINYIN_MAP.get(ch) ?? ch)
    .join(' ');
}

/** 拼音归一：小写、去空格、去声调符号，便于小朋友在平板上输入时容错 */
function normPinyin(s: string): string {
  return s.toLowerCase().replace(/[^a-zü]/g, '');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildItems(unit: string, mode: Mode, count: number): Item[] {
  const units = unit === 'ALL' ? GRADE1_CHAR_UNITS : GRADE1_CHAR_UNITS.filter((u) => u.unit === unit);
  const pool: string[] = [];
  units.forEach((u) => {
    if (mode === 'pinyin') pool.push(...u.chars);
    else pool.push(...(u.words.length ? u.words : u.chars));
  });
  const uniq = Array.from(new Set(pool));
  return shuffle(uniq)
    .slice(0, Math.max(1, count))
    .map((w) => (mode === 'pinyin' ? { text: w, answer: wordPinyin(w) } : { text: w, answer: w }));
}

export default function DictationPractice() {
  const [unit, setUnit] = useState('ALL');
  const [mode, setMode] = useState<Mode>('char');
  const [count, setCount] = useState(8);
  // 默写（dictation）关卡进度：每轮结束按正确率记星，让孩子看到累计星星
  const { record: recordDictation } = useModuleProgress('chinese', 'dictation');

  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup');
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongLogged, setWrongLogged] = useState(false);

  const item = items[idx];

  function start() {
    const built = buildItems(unit, mode, count);
    setItems(built);
    setIdx(0);
    setInput('');
    setRevealed(false);
    setScore(0);
    setWrongLogged(false);
    setPhase('play');
  }

  // 进入每题自动朗读
  useEffect(() => {
    if (phase === 'play' && item && !revealed) {
      speakZh(item.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  // 每轮听写结束：按正确率记星（done 阶段只进入一次，避免重复记）
  useEffect(() => {
    if (phase !== 'done') return;
    const acc = items.length ? Math.round((score / items.length) * 100) : 0;
    const s = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 50 ? 1 : 0;
    if (s > 0) recordDictation(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function logMistake(wrong: string) {
    try {
      await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject: '语文',
          kind: '听写',
          prompt: item.text,
          answer: item.answer,
          wrong,
          source_module: 'dictation-self',
          chapter: unit === 'ALL' ? '全册' : unit,
        }),
      });
    } catch {
      /* 离线时静默，不影响练习 */
    }
  }

  async function submit() {
    if (revealed || !input.trim()) return;
    const ok = mode === 'pinyin' ? normPinyin(input) === normPinyin(item.answer) : input.trim() === item.answer.trim();
    setCorrect(ok);
    setRevealed(true);
    if (ok) {
      setScore((s) => s + 1);
    } else {
      await logMistake(input.trim());
      setWrongLogged(true);
    }
  }

  function next() {
    if (idx + 1 >= items.length) {
      setPhase('done');
      return;
    }
    setIdx((i) => i + 1);
    setInput('');
    setRevealed(false);
    setCorrect(false);
    setWrongLogged(false);
  }

  if (phase === 'setup') {
    return (
      <div className="card-moko space-y-4">
        <div className="flex gap-2">
          {(['char', 'pinyin'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 rounded-2xl font-black ${mode === m ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose/20'}`}
            >
              {m === 'char' ? '✍️ 听写汉字' : '🔤 听写拼音'}
            </button>
          ))}
        </div>

        <label className="block text-sm font-bold text-moko-rose">
          选择单元：
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="ml-2 rounded-xl border-2 border-moko-rose/20 px-3 py-2 font-bold bg-white"
          >
            <option value="ALL">全部单元（随机）</option>
            {GRADE1_CHAR_UNITS.map((u) => (
              <option key={u.unit} value={u.unit}>
                {u.unit}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold text-moko-rose">
          题数：
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
            className="ml-2 w-16 rounded-xl border-2 border-moko-rose/20 p-1 text-center"
          />
        </label>

        <button
          onClick={start}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-moko-rose to-moko-pink text-white font-black shadow hover:scale-[1.02] transition"
        >
          🎧 开始听写
        </button>
        <p className="text-xs text-gray-400 text-center">
          {mode === 'pinyin' ? '听读音，写出拼音（声调可省略）' : '听读音，写出听到的字或词'}
          {' · '}写错的小题会自动进复习本
        </p>
      </div>
    );
  }

  if (phase === 'done') {
    const acc = items.length ? Math.round((score / items.length) * 100) : 0;
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 50 ? 1 : 0;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-6 bg-white shadow-lg border-2 border-moko-yellow/40 text-center">
          <div className="text-3xl font-black text-moko-rose mb-2">🎉 听写完成！</div>
          <div className="flex justify-center gap-1 text-4xl mb-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-200'}>
                ★
              </span>
            ))}
          </div>
          <p className="text-gray-600 mb-1">写对了 {score} / {items.length} 个，正确率 {acc}%</p>
          <div className="flex items-center justify-center gap-1 mb-4 text-sm text-moko-violet">
            <span>累计星星</span>
            <ModuleStars subject="chinese" moduleKey="dictation" />
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={start} className="px-6 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition">
              再来一轮 ›
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-rose/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400">
            第 {idx + 1} / {items.length} 题 · 已对 {score}
          </span>
          <button
            onClick={() => speakZh(item.text)}
            className="text-xs px-3 py-1 rounded-full bg-moko-yellow text-white font-bold active:scale-95 transition"
          >
            🔊 再听一次
          </button>
        </div>

        {mode === 'pinyin' ? (
          <div className="text-center mb-4">
            <div className="text-6xl font-black text-moko-rose mb-1">{item.text}</div>
            <div className="text-xs text-gray-400">听读音，写出它的拼音</div>
          </div>
        ) : (
          <div className="text-center mb-4 text-lg font-bold text-gray-500">听一听，写出你听到的字或词</div>
        )}

        <input
          autoFocus
          value={input}
          disabled={revealed}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={mode === 'pinyin' ? '例如 tiān' : '在这里写下来'}
          className="w-full rounded-2xl border-2 border-moko-rose/30 p-4 text-center text-2xl font-black text-moko-rose focus:outline-none focus:border-moko-rose"
        />

        {!revealed ? (
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-moko-rose to-moko-pink text-white font-black shadow hover:scale-[1.02] transition disabled:opacity-50"
          >
            提交
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <div className={`rounded-2xl p-3 text-center font-black ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {correct ? '✅ 写对啦！' : `✏️ 正确答案：${item.answer}`}
            </div>
            <button onClick={next} className="w-full py-3 rounded-2xl bg-moko-yellow text-white font-black shadow hover:scale-[1.02] transition">
              {idx + 1 >= items.length ? '看结果 ›' : '下一题 ›'}
            </button>
          </div>
        )}
      </div>
      <div className="rounded-2xl p-3 bg-moko-rose text-white text-center text-sm font-bold shadow">
        慢慢写，写错也没关系，复习本会帮你记着～
      </div>
    </div>
  );
}
