'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LETTERS, RAZ_AA_WORDS, COLORS_WORDS, BODY_WORDS, type WordItem } from '@/lib/study-data';
import { logMistake } from '@/lib/mistake-log';

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[m][n];
}

function speakEn(text: string, rate = 0.75) {
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  u.pitch = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ---------- 字母卡 ---------- */
function LetterCard({ item }: { item: (typeof LETTERS)[number] }) {
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

/* ---------- 点读 + 录音复读单词卡 ---------- */
function WordCard({ item }: { item: WordItem }) {
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

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

  // 🎯 发音评测：用浏览器语音识别比对原词相似度给星级
  function scorePronunciation() {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
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
      if (s < 2) logMistake({ subject: '英语', kind: '单词', prompt: item.word, answer: item.word, wrong: text });
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
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
      <div className="text-5xl mb-2">{item.emoji}</div>
      <div
        onClick={() => speakEn(item.word)}
        className="text-3xl font-black text-moko-violet cursor-pointer hover:scale-105 transition"
      >
        {item.word}
      </div>
      <div className="text-sm text-gray-500 mb-3">{item.cn}</div>
      {item.sentence && (
        <div className="text-xs text-gray-400 mb-3 italic">{item.sentence}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => speakEn(item.word)}
          className="flex-1 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
        >
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
        <button
          onClick={scorePronunciation}
          disabled={scoring}
          className="flex-1 py-2 rounded-full bg-moko-violet text-white font-bold text-sm active:scale-95 transition disabled:opacity-60"
        >
          {scoring ? '🎯 听…' : '🎯 评发音'}
        </button>
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

/* ---------- 听音选词（难度自适应） ---------- */
type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

const ALL_EN_WORDS = [...RAZ_AA_WORDS, ...COLORS_WORDS, ...BODY_WORDS];
const EN_WORD_MAP: Record<string, WordItem> = Object.fromEntries(ALL_EN_WORDS.map((w) => [w.word, w]));
const EN_EASY_WORDS = ['apple', 'dog', 'cat', 'sun', 'red', 'blue', 'eye', 'ear', 'book']
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
  const pool = level === 'easy' ? EN_EASY_WORDS : level === 'medium' ? RAZ_AA_WORDS : ALL_EN_WORDS;
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

  // 出题即朗读（挑战档语速更快）
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
      logMistake({ subject: '英语', kind: '听音选词', prompt: q.target.word, answer: q.target.word, wrong: opt.word });
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

export default function EnglishStudyPage() {
  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-yellow mb-2">🔤 英语小天地</h1>
      <p className="text-gray-600 mb-6">和唱唱萌可一起认字母、读单词、RAZ AA 点读录音～</p>

      {/* 字母 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🔠 字母认读</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LETTERS.map((l) => (
            <LetterCard key={l.letter} item={l} />
          ))}
        </div>
      </section>

      {/* RAZ AA 单词 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">📚 RAZ AA 核心词（点读 + 录音）</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {RAZ_AA_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>

      {/* 颜色 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🎨 颜色 Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLORS_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>

      {/* 身体 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🧍 身体 Body</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BODY_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>

      {/* 听音选词（难度自适应） */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🎧 听音选词（难度会自己调整哦）</h2>
        <EnListenQuiz />
      </section>
    </div>
  );
}
