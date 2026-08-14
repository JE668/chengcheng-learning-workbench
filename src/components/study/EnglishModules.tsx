'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LETTERS,
  EN_WORD_TOPICS,
  EN_UNITS,
  ALL_EN_WORDS,
  type WordItem,
  type LetterItem,
} from '@/lib/study-data';
import { speakEn } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useModuleProgress } from '@/lib/module-progress';

function lev(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

/* ---------- 字母认读 ---------- */
function LetterCard({ item }: { item: LetterItem }) {
  return (
    <button
      onClick={() => speakEn(`${item.letter}. ${item.word}`)}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-yellow to-amber-300 text-white shadow-lg text-center active:scale-95 transition"
    >
      <div className="text-4xl font-black">{item.letter}</div>
      <div className="text-2xl mb-1">{item.emoji}</div>
      <div className="text-sm font-bold">{item.word}</div>
    </button>
  );
}

export function LetterModule() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {LETTERS.map((l) => (
        <LetterCard key={l.letter} item={l} />
      ))}
    </div>
  );
}

/* ---------- 单词（按主题，可点读 + 跟读录音；可选「我认识」完成标记） ---------- */
function WordCard({ item, done, onDone }: { item: WordItem; done?: boolean; onDone?: () => void }) {
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const logM = useMistakeLogger();

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setRecordUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setRecordUrl(null);
      setTimeout(() => {
        if (mr.state !== 'inactive') mr.stop();
        setRecording(false);
      }, 3000);
    } catch {
      alert('需要麦克风权限才能录音哦，请允许后重试～');
    }
  }

  function scorePronunciation() {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      alert('当前浏览器不支持发音评测，可以继续用「跟读」录音哦～');
      return;
    }
    setScoring(true);
    setScore(null);
    setHeard('');
    const rec = new (SR as new () => any)();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = String(e.results[0][0].transcript).toLowerCase().trim();
      setHeard(text);
      const target = item.word.toLowerCase().trim();
      let s = 0;
      if (text && (text.includes(target) || target.includes(text))) s = 3;
      else {
        const dist = lev(text, target);
        const ratio = 1 - dist / Math.max(text.length, target.length, 1);
        s = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
      }
      setScore(s);
      if (s < 2) logM({ subject: '英语', kind: '单词', prompt: item.word, answer: item.word, wrong: text });
      setScoring(false);
    };
    rec.onerror = () => {
      setScoring(false);
      alert('没听清，再试一次吧～');
    };
    rec.onend = () => setScoring(false);
    rec.start();
  }

  const stars = score === null ? '' : '⭐'.repeat(score) + '☆'.repeat(3 - score);

  return (
    <div className={`rounded-2xl p-4 shadow-lg border-2 text-center transition ${done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-yellow/30'}`}>
      <div className="text-5xl mb-2">{item.emoji}</div>
      <div
        onClick={() => speakEn(item.word)}
        className="text-3xl font-black text-moko-violet cursor-pointer hover:scale-105 transition"
      >
        {item.word}
      </div>
      <div className="text-sm text-gray-500 mb-3">{item.cn}</div>
      {item.sentence && <div className="text-xs text-gray-400 mb-3 italic">{item.sentence}</div>}
      <div className="flex gap-2">
        <button onClick={() => speakEn(item.word)} className="flex-1 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition">
          🔊 点读
        </button>
        <button
          onClick={startRecord}
          disabled={recording}
          className={`flex-1 py-2 rounded-full font-bold text-sm active:scale-95 transition ${
            recording ? 'bg-red-400 text-white' : 'bg-moko-pink text-white'
          }`}
        >
          {recording ? '⏹ 录音' : '🎙️ 跟读'}
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={scorePronunciation}
          disabled={scoring}
          className="flex-1 py-2 rounded-full bg-moko-violet text-white font-bold text-sm active:scale-95 transition disabled:opacity-60"
        >
          {scoring ? '🎯 听…' : '🎯 评发音'}
        </button>
        {onDone && (
          <button
            onClick={onDone}
            disabled={done}
            className={`flex-1 py-2 rounded-full font-bold text-sm transition ${done ? 'bg-green-200 text-green-700' : 'bg-moko-yellow/15 text-moko-yellow border-2 border-moko-yellow/40'}`}
          >
            {done ? '✅ 认识啦' : '👆 我认识'}
          </button>
        )}
      </div>
      {recordUrl && (
        <div className="mt-3">
          <audio src={recordUrl} controls className="w-full h-8" />
          <p className="text-xs text-gray-400 mt-1">听听自己的发音吧～</p>
        </div>
      )}
      {score !== null && (
        <div className="mt-3 rounded-xl bg-moko-violet/5 p-2">
          <div className="text-2xl">{stars}</div>
          <p className="text-xs text-gray-500">
            {score >= 3 ? '太棒了，发音很准！' : score === 2 ? '不错，再练习一下更标准～' : '加油，跟着点读多读几遍！'}
            {heard && <span className="block">我听到：{heard}</span>}
          </p>
        </div>
      )}
    </div>
  );
}

export function WordModule() {
  const { record } = useModuleProgress('english', 'words');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [doneTopics, setDoneTopics] = useState<Set<string>>(new Set());
  const [doneWords, setDoneWords] = useState<Set<string>>(new Set());
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const prevDone = useRef(0);

  const topics = Object.keys(EN_WORD_TOPICS);
  const activeWords = activeTopic ? EN_WORD_TOPICS[activeTopic] ?? [] : [];

  // 完成主题数 → 星：4 主题 1 星、8 主题 2 星、全部 3 星（取历史最佳）
  useEffect(() => {
    if (doneTopics.size === prevDone.current) return;
    prevDone.current = doneTopics.size;
    if (doneTopics.size > 0) {
      const stars = doneTopics.size >= topics.length ? 3 : doneTopics.size >= 8 ? 2 : 1;
      record(stars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneTopics.size]);

  // 切换主题时重置已认识
  useEffect(() => {
    setDoneWords(new Set());
    setCelebrate(null);
  }, [activeTopic]);

  // 当前主题全部认识 → 完成打勾 + 稍候自动返回
  useEffect(() => {
    if (!activeTopic || doneTopics.has(activeTopic)) return;
    if (activeWords.length > 0 && doneWords.size >= activeWords.length) {
      setDoneTopics((s) => new Set(s).add(activeTopic));
      setCelebrate(activeTopic);
      const timer = setTimeout(() => setActiveTopic(null), 1800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneWords.size, activeTopic]);

  // 主题详情页
  if (activeTopic) {
    const topicDone = doneTopics.has(activeTopic);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTopic(null)}
            className="px-3 py-1.5 rounded-full bg-white text-moko-violet font-bold text-sm shadow border-2 border-moko-violet/20 active:scale-95 transition"
          >
            ‹ 返回主题
          </button>
          <h2 className="text-xl font-black text-moko-violet">📚 {activeTopic}</h2>
          <span className="text-sm font-bold text-gray-400">已认识 {doneWords.size}/{activeWords.length}</span>
        </div>

        {celebrate === activeTopic && (
          <div className="rounded-2xl p-4 bg-green-100 border-2 border-green-400 text-center text-green-700 font-black text-lg fade-up">
            🎉「{activeTopic}」全部认识啦！唱唱萌可为你鼓掌～
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {activeWords.map((w) => (
            <WordCard
              key={w.word}
              item={w}
              done={doneWords.has(w.word) || topicDone}
              onDone={() => setDoneWords((s) => new Set(s).add(w.word))}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">把每个词点成「我认识」，这一组就完成啦～</p>
      </div>
    );
  }

  // 主题宫格：一次挑一类
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/20 text-center">
        <p className="text-gray-600 text-sm">
          单词按<span className="font-black text-moko-yellow"> 主题 </span>排队啦！一次认一组，认完 4 组拿 1 颗⭐，全认完 3 颗星！
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const words = EN_WORD_TOPICS[topic];
          const done = doneTopics.has(topic);
          const emoji = words[0]?.emoji ?? '🏷️';
          return (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`rounded-3xl p-4 text-center shadow-lg border-2 active:scale-95 transition ${
                done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-yellow/30 hover:border-moko-yellow'
              }`}
            >
              <div className="text-4xl mb-1">{done ? '✅' : emoji}</div>
              <div className={`font-black ${done ? 'text-green-600' : 'text-moko-violet'}`}>{topic}</div>
              <div className={`text-xs mt-1 ${done ? 'text-green-500' : 'text-gray-400'}`}>{done ? '完成啦' : `${words.length} 个词 · 点开认一认`}</div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-400 font-bold">已认完 {doneTopics.size} / {topics.length} 组</p>
    </div>
  );
}

/* ---------- 听音选词（难度自适应） ---------- */
type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

const EN_WORD_MAP: Record<string, WordItem> = Object.fromEntries(ALL_EN_WORDS.map((w) => [w.word, w]));
const EN_EASY_WORDS = ['apple', 'dog', 'cat', 'sun', 'red', 'blue', 'eye', 'ear', 'book', 'one', 'two', 'mom']
  .map((w) => EN_WORD_MAP[w])
  .filter(Boolean) as WordItem[];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(level: DiffLevel): { target: WordItem; options: WordItem[] } {
  const pool = level === 'easy' ? EN_EASY_WORDS : level === 'medium' ? ALL_EN_WORDS.slice(0, 40) : ALL_EN_WORDS;
  const k = level === 'easy' ? 3 : 4;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(pool.filter((w) => w.word !== target.word)).slice(0, k - 1);
  return { target, options: shuffle([target, ...distractors]) };
}

function EnListenQuiz() {
  const [level, setLevel] = useState<DiffLevel>('easy');
  const [q, setQ] = useState<{ target: WordItem; options: WordItem[] }>(() => buildQuestion('easy'));
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const logM = useMistakeLogger();

  useEffect(() => {
    const saved = localStorage.getItem('englishDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQ(buildQuestion(saved));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      logM({ subject: '英语', kind: '听音选词', prompt: q.target.word, answer: q.target.word, wrong: opt.word });
    }
    setTimeout(() => nextRound(nl), ok ? 1400 : 1700);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-yellow to-amber-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">难度：{meta.emoji} {meta.label}</span>
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

/* ---------- 口语跟读（逐词挑战） ---------- */
export function EnSpeakModule() {
  const practice = ALL_EN_WORDS.filter((w) => w.sentence);
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const item = practice[idx % practice.length];
  const logM = useMistakeLogger();

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setScore(null);
      setTimeout(() => {
        if (mr.state !== 'inactive') mr.stop();
        setRecording(false);
      }, 3000);
    } catch {
      alert('需要麦克风权限才能录音哦～');
    }
  }

  function scorePronunciation() {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      alert('当前浏览器不支持发音评测，可以继续用「跟读」录音哦～');
      return;
    }
    setScoring(true);
    setScore(null);
    setHeard('');
    const rec = new (SR as new () => any)();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = String(e.results[0][0].transcript).toLowerCase().trim();
      setHeard(text);
      const target = item.word.toLowerCase().trim();
      let s = 0;
      if (text && (text.includes(target) || target.includes(text))) s = 3;
      else {
        const dist = lev(text, target);
        const ratio = 1 - dist / Math.max(text.length, target.length, 1);
        s = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
      }
      setScore(s);
      if (s < 2) logM({ subject: '英语', kind: '口语', prompt: item.word, answer: item.word, wrong: text });
      setScoring(false);
    };
    rec.onerror = () => {
      setScoring(false);
      alert('没听清，再试一次吧～');
    };
    rec.onend = () => setScoring(false);
    rec.start();
  }

  const stars = score === null ? '' : '⭐'.repeat(score) + '☆'.repeat(3 - score);

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-moko-violet to-purple-400 text-white shadow-lg text-center">
      <div className="text-6xl mb-2">{item.emoji}</div>
      <button onClick={() => speakEn(item.word)} className="text-4xl font-black underline decoration-white/40">
        {item.word}
      </button>
      <p className="text-sm opacity-90 mt-1">{item.cn}</p>
      <p className="text-xs opacity-80 italic mt-1">{item.sentence}</p>
      <div className="flex justify-center gap-3 mt-4">
        <button onClick={() => speakEn(item.word)} className="px-5 py-2 rounded-full bg-white text-moko-violet font-bold text-sm active:scale-95 transition">
          🔊 听
        </button>
        <button
          onClick={startRecord}
          disabled={recording}
          className={`px-5 py-2 rounded-full font-bold text-sm active:scale-95 transition ${recording ? 'bg-red-400' : 'bg-moko-pink'}`}
        >
          {recording ? '⏹ 录音中' : '🎙️ 跟读'}
        </button>
        <button
          onClick={scorePronunciation}
          disabled={scoring}
          className="px-5 py-2 rounded-full bg-moko-yellow font-bold text-sm active:scale-95 transition disabled:opacity-60"
        >
          {scoring ? '🎯 听…' : '🎯 评发音'}
        </button>
      </div>
      {score !== null && (
        <div className="mt-4">
          <div className="text-3xl">{stars}</div>
          <p className="text-xs mt-1 opacity-90">
            {score >= 3 ? '太棒了！' : score === 2 ? '不错，再练一次～' : '加油，多跟读几遍！'}
            {heard && <span className="block">我听到：{heard}</span>}
          </p>
        </div>
      )}
      <button
        onClick={() => {
          setScore(null);
          setHeard('');
          setIdx((i) => i + 1);
        }}
        className="mt-4 px-6 py-2 rounded-full bg-white/25 font-bold text-sm active:scale-95 transition"
      >
        下一个 ›
      </button>
    </div>
  );
}

/* ---------- 单元浏览（人教版一年级起点） ---------- */
function UnitWordCard({ item }: { item: WordItem }) {
  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
      <div className="text-4xl mb-1">{item.emoji}</div>
      <div
        onClick={() => speakEn(item.word)}
        className="text-2xl font-black text-moko-violet cursor-pointer hover:scale-105 transition"
      >
        {item.word}
      </div>
      <div className="text-sm text-gray-500 mb-2">{item.cn}</div>
      {item.sentence && <div className="text-xs text-gray-400 mb-2 italic">{item.sentence}</div>}
      <button
        onClick={() => speakEn(item.word)}
        className="px-4 py-1 rounded-full bg-moko-yellow text-white font-bold text-xs active:scale-95 transition"
      >
        🔊 点读
      </button>
    </div>
  );
}

export function UnitModule() {
  const [open, setOpen] = useState<string | null>(EN_UNITS[0]?.unit ?? null);
  return (
    <div className="space-y-4">
      {EN_UNITS.map((u) => {
        const words: WordItem[] = u.topics.flatMap((t) => EN_WORD_TOPICS[t] ?? []);
        const isOpen = open === u.unit;
        return (
          <div key={u.unit} className="rounded-2xl bg-white shadow-lg border-2 border-moko-yellow/20 overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : u.unit)}
              className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition"
            >
              <span className="text-3xl">{u.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm text-gray-400">
                  {u.unit}
                  {u.extra ? <span className="ml-1 text-[10px] text-moko-yellow font-bold">拓展</span> : null}
                  <span className="ml-1 text-[10px] text-gray-300">{words.length} 词</span>
                </span>
                <span className="block text-lg font-black text-moko-violet">{u.title}</span>
              </span>
              <span className="text-moko-yellow text-2xl">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {words.map((w) => (
                    <UnitWordCard key={w.word + u.unit} item={w} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
