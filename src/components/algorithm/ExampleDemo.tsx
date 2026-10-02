'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ExampleScene } from '@/lib/algorithm/types';
import { ExampleVisualStyle, ExampleVisualView } from './ExampleVisuals';
import { FadeIn } from './LazyMotion';
import { TtsButton } from './TtsButton';
import { sfxCorrect, sfxWrong, sfxComplete } from '@/lib/sfx';

/**
 * 典型例题「分幕思维可视化」引擎
 *
 * 教学节奏：
 *  1. 一次只亮一幕 —— 萌可教练给引导语 + 课本标准图示（静默态）
 *  2. 有互动提问的幕：孩子必须答对才能解锁本幕动画 + 下一步
 *  3. 答对后图示自动播放揭晓动画（搬豆子 / 弧线画出 / 符号翻跟头…）
 *  4. 前面已完成的幕折叠成「回顾条」，可点击回看
 *  5. 最后一幕 = 总结思维图 + 口诀 + 「去练习」
 *
 * 增强功能：
 *  - 🔁 重看动画：答对后可点击重看本幕动画
 *  - ◀ 回看：点击回顾条返回已完成的幕
 *  - 场景过渡：幕之间滑动切换
 *  - 互动提问：答错震动、答对弹跳 + 音效
 */
export function ExampleDemo({
  problem,
  scenes,
  moko,
  mantra,
  topicId,
}: {
  problem: string;
  scenes: ExampleScene[];
  moko: { name: string; img: string; emoji?: string; line: string };
  mantra: string;
  topicId: string;
}) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [solvedScenes, setSolvedScenes] = useState<Set<number>>(new Set());
  const [replayCount, setReplayCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 卸载时清掉过渡定时器，避免在已卸载组件上改 state
  const nextTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
    },
    []
  );

  const scene = scenes[sceneIdx];
  const isLast = sceneIdx === scenes.length - 1;
  const hasQuiz = !!scene?.quiz;
  const isQuizSolved = !hasQuiz || solvedScenes.has(sceneIdx);
  const canNext = isQuizSolved;

  const handleSolved = useCallback(() => {
    if (isLast) {
      sfxComplete();
    } else {
      sfxCorrect();
    }
    setSolvedScenes((s) => new Set(s).add(sceneIdx));
  }, [isLast, sceneIdx]);

  /** 重看本幕动画：重置 quiz 状态，触发重播 */
  const handleReplay = () => {
    setSolvedScenes((s) => {
      const next = new Set(s);
      next.delete(sceneIdx);
      return next;
    });
    setReplayCount((c) => c + 1);
  };

  /** 切换到下一幕（带过渡动画） */
  const handleNext = () => {
    // 防连点：过渡期间重复触发会把 sceneIdx 一路推到 scenes.length，
    // 下一帧渲染就会解引用 undefined 的 scene.quiz 而整页崩溃。
    if (leaving) return;
    setLeaving(true);
    nextTimerRef.current = window.setTimeout(() => {
      // 再兜一层钳制：即使出现意外也不会越界
      setSceneIdx((i) => Math.min(i + 1, scenes.length - 1));
      setLeaving(false);
      // 滚动到顶部，确保用户看到新幕的开头
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  /** 回看已完成的幕 */
  const handleReview = (idx: number) => {
    if (leaving) return;
    setLeaving(true);
    nextTimerRef.current = window.setTimeout(() => {
      setSceneIdx(Math.min(Math.max(idx, 0), scenes.length - 1));
      setLeaving(false);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  // 最后一道防线：sceneIdx 已由 handleNext/handleReview 钳制，这里保证任何意外
  // 都不会因为读取 undefined 而把整页打到错误边界。
  if (!scene) return null;

  return (
    <div className="space-y-4" ref={containerRef}>
      <ExampleVisualStyle />

      {/* 题目卡 */}
      <div className="text-center bg-white rounded-3xl p-5 border-2 border-moko-purple/25 shadow-md">
        <div className="text-4xl font-black text-moko-purple tracking-wide">{problem}</div>
        <div className="text-xs text-gray-400 font-bold mt-1.5">👇 跟着萌可一步一步看思维图</div>
      </div>

      {/* 进度点 */}
      <div className="flex items-center justify-center gap-1.5">
        {scenes.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < sceneIdx && handleReview(i)}
            aria-label={i < sceneIdx ? `回看第 ${i + 1} 幕` : `第 ${i + 1} 幕`}
            aria-current={i === sceneIdx ? 'step' : undefined}
            className={`flex h-8 items-center px-0.5 ${i < sceneIdx ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === sceneIdx
                  ? 'w-6 bg-moko-purple'
                  : i < sceneIdx
                    ? 'w-2 bg-emerald-400 hover:bg-emerald-500'
                    : 'w-2 bg-gray-200'
              } ${i < sceneIdx ? 'hover:scale-125' : ''}`}
            />
          </button>
        ))}
      </div>

      {/* 已完成幕的回顾条（可点击回看） */}
      {sceneIdx > 0 && (
        <div className="space-y-1">
          {scenes.slice(0, sceneIdx).map((s, i) => (
            <button
              key={i}
              onClick={() => handleReview(i)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-1.5 hover:bg-moko-purple/10 hover:text-moko-violet hover:scale-[1.01] active:scale-[0.99] transition-all text-left"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-400 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                ✓
              </span>
              <span className="font-bold truncate flex-1">{s.key || s.caption.slice(0, 24)}</span>
              <span className="text-gray-300 text-[10px]">◀ 回看</span>
            </button>
          ))}
        </div>
      )}

      {/* 当前幕 */}
      <div
        className={`transition-all duration-300 ${
          leaving ? 'opacity-0 translate-x-[-20px] scale-[0.98]' : 'opacity-100 translate-x-0 scale-100'
        }`}
      >
        <FadeIn key={`${sceneIdx}-${replayCount}`} duration={0.3}>
          <div
            className={`rounded-3xl p-5 border-2 shadow-lg ${
              scene.summary ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300' : 'bg-white border-moko-purple/25'
            }`}
          >
            {/* 萌可教练 + 引导语 */}
            <div className="flex items-start gap-3 mb-4">
              <Image
                src={moko.img || '/moko/lemei.jpg'}
                alt={moko.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-xl border-2 border-moko-purple/30 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-moko-violet flex items-center gap-1">
                  {moko.emoji && <span>{moko.emoji}</span>}
                  <span>{moko.name}：</span>
                  <span className="flex-1" />
                  <TtsButton text={`${moko.name}：${scene.caption}`} iconSize="text-xs" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{scene.caption}</p>
              </div>
            </div>

            {/* 图示 */}
            <div className="py-1 min-h-[140px] flex items-center justify-center">
              <ExampleVisualView visual={scene.visual} unlocked={isQuizSolved} />
            </div>

            {/* 互动提问（首次解答） */}
            {hasQuiz && !isQuizSolved && (
              <SceneQuiz key={`${sceneIdx}-${replayCount}`} scene={scene} onSolved={handleSolved} />
            )}

            {/* 答对反馈 + 重看按钮 */}
            {hasQuiz && isQuizSolved && (
              <div
                className="mt-3 flex items-center justify-center gap-2"
                style={{ animation: 'exPop .5s cubic-bezier(.34,1.56,.64,1) both' }}
              >
                <div className="text-sm font-black text-emerald-600 bg-emerald-50 rounded-xl py-2 px-3 border border-emerald-200">
                  🎉 {scene.quiz!.praise || '答对啦！'}
                </div>
                <button
                  onClick={handleReplay}
                  className="text-xs font-bold text-moko-violet bg-moko-purple/10 rounded-xl py-2 px-3 border border-moko-purple/20 hover:bg-moko-purple/20 active:scale-95 transition"
                >
                  🔁 重看动画
                </button>
              </div>
            )}

            {/* 总结幕专属内容 */}
            {scene.summary && (
              <div className="mt-4 space-y-3">
                {scene.flow && (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {scene.flow.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-xl border-2 border-emerald-300 bg-white px-3 py-1.5 text-base font-black text-emerald-700"
                        style={{ animation: 'exPop .55s cubic-bezier(.34,1.56,.64,1) both', animationDelay: `${i * 0.25}s` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {scene.answer !== undefined && (
                  <div className="text-center bg-white rounded-2xl py-3 px-4 border-2 border-emerald-200">
                    <div className="text-xs font-bold text-gray-400 mb-0.5">最终答案</div>
                    <div className="text-4xl font-black text-emerald-600">{scene.answer}</div>
                  </div>
                )}
                <div className="text-center bg-moko-purple/8 rounded-2xl py-3 px-4 border border-moko-purple/15">
                  <div className="text-xs font-black text-moko-violet mb-1">📝 速算口诀</div>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{mantra}</p>
                </div>
              </div>
            )}

            {/* 下一步 / 去练习 */}
            {isLast ? (
              isQuizSolved && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/algorithm/${topicId}/practice/1`}
                    className="inline-block px-7 py-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    🎯 去练习闯关 →
                  </Link>
                </div>
              )
            ) : (
              canNext && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-moko-purple to-moko-violet text-white font-black text-sm shadow-md hover:scale-105 active:scale-95 transition"
                  >
                    我明白了，下一步 ▶
                  </button>
                </div>
              )
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ── 互动提问组件 ──────────────────────────────────────────────

function SceneQuiz({ scene, onSolved }: { scene: ExampleScene; onSolved: () => void }) {
  const quiz = scene.quiz!;
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const wrongRef = useRef<string | null>(null);

  return (
    <div className="mt-3 bg-moko-purple/5 rounded-2xl p-3 border-2 border-moko-purple/15">
      <div className="text-sm font-black text-moko-purple mb-3 flex items-center gap-1">
        <span className="text-base">🤔</span>
        <span>{quiz.prompt}</span>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {quiz.options.map((o) => {
          const isWrong = wrong === o;
          const isPicked = picked === o;
          return (
            <button
              key={o}
              onClick={() => {
                if (o === quiz.answer) {
                  setPicked(o);
                  onSolved();
                } else {
                  sfxWrong();
                  wrongRef.current = o;
                  setWrong(o);
                  setTimeout(() => setWrong(null), 600);
                }
              }}
              className={`min-w-12 h-12 px-3 rounded-2xl border-2 text-xl font-black transition-all duration-200 active:scale-95 ${
                isWrong
                  ? 'bg-red-100 border-red-300 text-red-500'
                  : isPicked
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : 'bg-white border-moko-purple/30 text-gray-700 hover:bg-moko-purple/10 hover:border-moko-purple/50'
              }`}
              style={
                isWrong
                  ? { animation: 'exShake .5s ease-in-out' }
                  : isPicked
                    ? { animation: 'exPop .5s cubic-bezier(.34,1.56,.64,1) both' }
                    : {}
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
