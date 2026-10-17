'use client';

import { useRef, useState, useEffect } from 'react';
import { ALL_EN_WORDS, EN_WORD_TOPICS, type WordItem } from '@/lib/study-data-en';
import { speakEn } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useModuleProgress } from '@/lib/module-progress';
import { useRecorder, recognizeSpeech } from '../useRecorder';
import { lev } from './shared';

function WordCard({ item, done, onDone }: { item: WordItem; done?: boolean; onDone?: () => void }) {
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState('');
  const {
    recording,
    audioUrl: recordUrl,
    micError,
    start: startRecord,
  } = useRecorder({ maxMs: 3000 });
  const logM = useMistakeLogger();

  async function scorePronunciation() {
    setScoring(true);
    setScore(null);
    setHeard('');
    // recognizeSpeech 内部兜住：不支持 / 启动失败 / 超时 一律返回 null，不会卡按钮
    const raw = await recognizeSpeech({ lang: 'en-US' });
    setScoring(false);
    if (raw === null) {
      // 区分「不支持」和「没听清」没法可靠判断，统一温和提示
      return;
    }
    const text = raw.toLowerCase().trim();
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
    if (s < 2)
      logM({ subject: '英语', kind: '单词', prompt: item.word, answer: item.word, wrong: text });
  }

  const stars = score === null ? '' : '⭐'.repeat(score) + '☆'.repeat(3 - score);

  return (
    <div
      className={`rounded-2xl p-4 shadow-lg border-2 text-center transition ${done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-yellow/30'}`}
    >
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
      {micError && <p className="text-xs text-red-400 mt-2">{micError}</p>}
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
            {score >= 3
              ? '太棒了，发音很准！'
              : score === 2
                ? '不错，再练习一下更标准～'
                : '加油，跟着点读多读几遍！'}
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
  const activeWords = activeTopic ? (EN_WORD_TOPICS[activeTopic] ?? []) : [];

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
          <span className="text-sm font-bold text-gray-400">
            已认识 {doneWords.size}/{activeWords.length}
          </span>
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
        <p className="text-center text-xs text-gray-400">
          把每个词点成「我认识」，这一组就完成啦～
        </p>
      </div>
    );
  }

  // 主题宫格：一次挑一类
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/20 text-center">
        <p className="text-gray-600 text-sm">
          单词按<span className="font-black text-moko-yellow"> 主题 </span>排队啦！一次认一组，认完
          4 组拿 1 颗⭐，全认完 3 颗星！
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
                done
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-moko-yellow/30 hover:border-moko-yellow'
              }`}
            >
              <div className="text-4xl mb-1">{done ? '✅' : emoji}</div>
              <div className={`font-black ${done ? 'text-green-600' : 'text-moko-violet'}`}>
                {topic}
              </div>
              <div className={`text-xs mt-1 ${done ? 'text-green-500' : 'text-gray-400'}`}>
                {done ? '完成啦' : `${words.length} 个词 · 点开认一认`}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-400 font-bold">
        已认完 {doneTopics.size} / {topics.length} 组
      </p>
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

const EN_WORD_MAP: Record<string, WordItem> = Object.fromEntries(
  ALL_EN_WORDS.map((w) => [w.word, w])
);
const EN_EASY_WORDS = [
  'apple',
  'dog',
  'cat',
  'sun',
  'red',
  'blue',
  'eye',
  'ear',
  'book',
  'one',
  'two',
  'mom',
]
  .map((w) => EN_WORD_MAP[w])
  .filter(Boolean) as WordItem[];

