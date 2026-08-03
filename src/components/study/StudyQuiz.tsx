'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { speakZh, speakEn, praise } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useModuleProgress } from '@/lib/module-progress';

/** 一道选择题：prompt 为题目展示（可含 emoji / JSX），options 含正确项，answer 为正确项文本 */
export interface QuizItem {
  prompt: ReactNode;
  speak?: string; // 朗读题目（中文）
  speakEn?: string; // 朗读题目（英文）
  options: string[]; // 选项文本（含 answer）
  answer: string; // 正确选项文本
  kind: string; // 错题类型
  chapter?: string;
}

interface Props {
  items: QuizItem[];
  subject: '语文' | '数学' | '英语';
  color?: string; // 主色 bg token（如 bg-moko-blue）
  textColor?: string; // 选项文字色 token（如 text-moko-blue）
  shuffleOptions?: boolean; // 选项是否打乱（默认 true）
  autoSpeak?: 'zh' | 'en'; // 进入每题自动朗读题目
  randomOrder?: boolean; // 题目是否随机顺序循环（默认 true）
  /** 关卡进度：模块 key（如 'word-problem'），传入即记录星数 */
  moduleKey?: string;
  /** 学科 key（chinese/math/english），缺省由 subject 推断 */
  subjectKey?: string;
  /** 每多少题算一轮并结算星数（默认 8） */
  roundSize?: number;
}

const SUBJ_KEY: Record<string, string> = { 语文: 'chinese', 数学: 'math', 英语: 'english' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 通用选择题练习组件：自动打乱选项、朗读题目、记录错题、进度与夸夸。
 * 12 个幼小衔接模块里大部分（应用题 / 阅读理解 / 序数 / 比轻重 / 星期 / 英语句型 …）
 * 直接喂数据即可，无需各自重写交互。
 * 传入 moduleKey 后，每完成一轮（默认 8 题）按正确率结算 0~3 颗星并记录关卡进度。
 */
export function StudyQuiz({
  items,
  subject,
  color = 'bg-moko-blue',
  textColor = 'text-moko-blue',
  shuffleOptions = true,
  autoSpeak,
  randomOrder = true,
  moduleKey,
  subjectKey,
  roundSize = 8,
}: Props) {
  const sKey = subjectKey ?? SUBJ_KEY[subject] ?? subject;
  const progress = useModuleProgress(sKey, moduleKey ?? '');

  const order = useMemo(
    () => (randomOrder ? shuffle(items.map((_, i) => i)) : items.map((_, i) => i)),
    // 仅在挂载时生成一次题目顺序
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [rightCount, setRightCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [roundStars, setRoundStars] = useState(0);
  const [roundAcc, setRoundAcc] = useState(0);
  const attemptsRef = useRef(0);
  const rightRef = useRef(0);
  const logM = useMistakeLogger();

  const item = items[order[pos % order.length]];

  const options = useMemo(
    () => (shuffleOptions ? shuffle(item.options) : item.options),
    // 每次换题 / 选项变化都重新打乱
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pos, shuffleOptions],
  );

  // 进入每题自动朗读
  useEffect(() => {
    setPicked(null);
    if (autoSpeak === 'zh' && item.speak) speakZh(item.speak);
    else if (autoSpeak === 'en' && item.speakEn) speakEn(item.speakEn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  function next() {
    setPicked(null);
    setPos((p) => p + 1);
  }

  function finishRound() {
    const acc = attemptsRef.current > 0 ? rightRef.current / attemptsRef.current : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
    if (moduleKey) progress.record(stars);
    setRoundAcc(Math.round(acc * 100));
    setRoundStars(stars);
    setRoundDone(true);
  }

  function continueRound() {
    setRoundDone(false);
    setPicked(null);
    attemptsRef.current = 0;
    rightRef.current = 0;
    setAttempts(0);
    setRightCount(0);
    setPos((p) => p + 1);
  }

  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const ok = opt === item.answer;
    attemptsRef.current += 1;
    if (ok) rightRef.current += 1;
    setAttempts(attemptsRef.current);
    setRightCount(rightRef.current);

    if (ok) {
      praise();
      if (attemptsRef.current % roundSize === 0) {
        finishRound();
      } else {
        setTimeout(next, 1300);
      }
    } else {
      speakZh(`不对哦，正确答案是「${item.answer}」`);
      logM({
        subject,
        kind: item.kind,
        prompt: typeof item.speak === 'string' ? item.speak : String(item.answer),
        answer: item.answer,
        wrong: opt,
        chapter: item.chapter,
      });
      setTimeout(() => setPicked(null), 1600);
    }
  }

  const progressPct = attempts > 0 ? Math.round((rightCount / attempts) * 100) : 100;

  // 本轮结算封面
  if (roundDone) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-6 bg-white shadow-lg border-2 border-moko-yellow/40 text-center">
          <div className="text-3xl font-black text-moko-violet mb-2">🎉 本轮闯关结束！</div>
          <div className="flex justify-center gap-1 text-4xl mb-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < roundStars ? 'text-yellow-400' : 'text-gray-200'}>
                ★
              </span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">正确率 {roundAcc}%，共答 {attemptsRef.current} 题</p>
          <button
            onClick={continueRound}
            className="px-6 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
          >
            再来一轮 ›
          </button>
        </div>
        <div className={`rounded-2xl p-3 ${color} text-white text-center text-sm font-bold shadow`}>
          星星会留在封面上，慢慢集满三颗吧～
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-blue/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400">
            已答对 {rightCount} · 正确率 {progressPct}%{moduleKey ? ` · 本轮第 ${Math.min(attempts + 1, roundSize)}/${roundSize} 题` : ''}
          </span>
          {item.speak || item.speakEn ? (
            <button
              onClick={() => (item.speak ? speakZh(item.speak) : item.speakEn && speakEn(item.speakEn))}
              className="text-xs px-3 py-1 rounded-full bg-moko-yellow text-white font-bold active:scale-95 transition"
            >
              🔊 听题目
            </button>
          ) : null}
        </div>
        <div className="text-center mb-4 text-lg font-bold text-gray-700">{item.prompt}</div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isAnswer = opt === item.answer;
            const isPicked = opt === picked;
            let cls = `bg-white ${textColor} border-2 border-moko-blue/30`;
            if (picked) {
              if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
              else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
              else cls = `bg-white ${textColor} border-2 border-moko-blue/30 opacity-50`;
            }
            return (
              <button
                key={opt}
                disabled={!!picked}
                onClick={() => pick(opt)}
                className={`py-4 rounded-2xl font-black text-2xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {picked && (
          <p className={`text-center mt-4 font-bold ${picked === item.answer ? 'text-green-600' : 'text-red-500'}`}>
            {picked === item.answer ? '🎉 答对啦！' : `💡 正确答案是「${item.answer}」`}
          </p>
        )}
      </div>
      <div className={`rounded-2xl p-3 ${color} text-white text-center text-sm font-bold shadow`}>
        换一题继续练，闯关不嫌多～
      </div>
    </div>
  );
}
