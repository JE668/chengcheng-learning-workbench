'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ClayCard, ClayButton } from '@/components/design-system';
import type { StoryModuleInfo } from './types';

interface Chapter {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  scene: string;
  mokoName: string;
  paragraphs: string[];
  tip?: string;
  quiz?: { q: string; options: string[] };
}

/** 锁定章节卡（按集数或模块绑定未达成而锁） */
export function StoryChapterLocked({
  index,
  chapter,
  mod,
}: {
  index: number;
  chapter: Chapter;
  mod: StoryModuleInfo | null;
}) {
  const lockedByModule = mod ? !mod.done : false;
  return (
    <ClayCard theme="secondary" className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-300 flex items-center justify-center text-2xl">
        🔒
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-500">
          第 {index + 1} 集 · {chapter.title}
        </div>
        {lockedByModule && mod ? (
          <div className="text-xs text-moko-violet mt-1">
            先去「{mod.label}」拿一颗⭐，就能解锁这一集～
            <Link
              href={mod.href}
              className="ml-1 inline-block px-2 py-0.5 rounded-full bg-moko-violet/15 text-moko-violet font-bold hover:bg-moko-violet/25 transition"
            >
              去学习
            </Link>
          </div>
        ) : (
          <div className="text-xs text-gray-400 mt-1">先捕捉上一集的萌可，就能解锁这一集～</div>
        )}
      </div>
    </ClayCard>
  );
}

/** 展开阅读面板：正文逐段高亮 + tip + 小问题 + 答对鼓励 */
export function StoryReadingPanel({
  chapter,
  open,
  isRead,
  isQuiz,
  isNarrating,
  readPara,
  quiz,
  quizSpeaking,
  quizWrongFor,
  quizRightFor,
  onSpeakQuiz,
  onAnswer,
  onSpeakOne,
}: {
  chapter: Chapter;
  open: boolean;
  isRead: boolean;
  isQuiz: boolean;
  isNarrating: boolean;
  readPara: number;
  quiz: { q: string; options: string[] } | undefined;
  quizSpeaking: boolean;
  quizWrongFor: boolean;
  quizRightFor: boolean;
  onSpeakQuiz: () => void;
  onAnswer: (idx: number) => void;
  onSpeakOne: (text: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="mt-4 bg-white/95 text-gray-700 rounded-2xl p-4">
      {isNarrating && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moko-violet/10 text-moko-violet font-bold px-3 py-1 text-sm">
          🔊 正在读故事…
        </div>
      )}
      {chapter.paragraphs.map((p, k) => (
        <p
          key={k}
          className={`mb-2 leading-relaxed transition ${isNarrating && readPara === k ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2 font-bold text-moko-violet' : ''}`}
        >
          {p}
        </p>
      ))}
      {chapter.tip && (
        <p
          className={`text-sm text-moko-violet font-semibold mt-2 transition ${isNarrating && readPara === chapter.paragraphs.length ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2' : ''}`}
        >
          💡 {chapter.tip}
        </p>
      )}

      {/* —— 读完故事，弹出小问题（答对才能捕捉） —— */}
      {isRead && !isQuiz && quiz && (
        <div className="mt-4 rounded-2xl bg-moko-gold/10 border-2 border-moko-gold/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-black text-moko-violet">❓ 小问题</span>
            {quizSpeaking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-moko-violet/10 text-moko-violet text-xs font-bold px-2 py-0.5">
                🔊 正在读题…
              </span>
            )}
            <button
              onClick={onSpeakQuiz}
              className="ml-auto text-xs px-3 py-1 rounded-full bg-moko-violet/10 text-moko-violet font-bold hover:bg-moko-violet/20 transition"
            >
              🔊 再听一遍
            </button>
          </div>
          <p className="font-bold text-gray-800 mb-3 leading-relaxed">{quiz.q}</p>
          <div className="grid grid-cols-1 gap-2">
            {quiz.options.map((opt, k) => (
              <div key={k} className="flex items-center gap-2">
                <button
                  onClick={() => onAnswer(k)}
                  className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white border-2 border-moko-violet/30 font-bold text-gray-800 hover:bg-moko-violet/10 hover:border-moko-violet transition"
                >
                  {opt}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeakOne(opt);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-moko-violet/10 text-moko-violet font-bold hover:bg-moko-violet/20 transition"
                  aria-label="听这个选项"
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
          {quizWrongFor && (
            <p className="mt-3 text-sm font-bold text-moko-rose">😊 再想想看，选另一个试试吧～</p>
          )}
        </div>
      )}

      {/* 答对：quizRightFor 才代表「刚刚这道题答对了」；isQuiz 只是「这一集已解锁过」 */}
      {isQuiz && quizRightFor && (
        <div className="mt-4 mb-1 inline-flex items-center gap-2 rounded-full bg-moko-rose/10 text-moko-rose font-bold px-3 py-1 text-sm">
          ✅ 小问题答对啦，可以捕捉咯！
        </div>
      )}
    </div>
  );
}

/** 章节卡头部（图片 + 标题 + 状态徽章） */
export function StoryChapterHeader({
  chapter,
  index,
  img,
  isCaptured,
  isRead,
  isQuiz,
}: {
  chapter: Chapter;
  index: number;
  img: string | undefined;
  isCaptured: boolean;
  isRead: boolean;
  isQuiz: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      {img ? (
        <Image
          src={img}
          alt={chapter.mokoName}
          width={64}
          height={64}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow"
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-white/30 flex items-center justify-center text-3xl">
          {chapter.emoji}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-black text-lg">
          第 {index + 1} 集 · {chapter.title}
        </div>
        <div className="text-sm opacity-90">
          {chapter.scene} · 主角 {chapter.mokoName}
        </div>
      </div>
      {isCaptured && (
        <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">✅ 已捕捉</span>
      )}
      {!isCaptured && isQuiz && (
        <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">📖 已读·已答</span>
      )}
      {!isCaptured && isRead && !isQuiz && (
        <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">📖 已读</span>
      )}
    </div>
  );
}

/** 章节底部操作区（读/听/答题/捕捉按钮） */
export function StoryChapterActions({
  chapter,
  index,
  open,
  isRead,
  isQuiz,
  isCaptured,
  isNext,
  isNarrating,
  capturing,
  tickets,
  onToggle,
  onNarrate,
  onCapture,
}: {
  chapter: Chapter;
  index: number;
  open: boolean;
  isRead: boolean;
  isQuiz: boolean;
  isCaptured: boolean;
  isNext: boolean;
  isNarrating: boolean;
  capturing: boolean;
  tickets: number;
  onToggle: () => void;
  onNarrate: () => void;
  onCapture: () => void;
}) {
  return (
    <div className="mt-4 flex gap-3 flex-wrap">
      <button
        onClick={onToggle}
        className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
      >
        {open ? '收起故事' : isRead ? '📖 再读一遍' : '📖 读这一集'}
      </button>

      {open && isRead && !isNarrating && (
        <button
          onClick={onNarrate}
          className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
        >
          🔊 再听一遍
        </button>
      )}

      {isNext && !isCaptured && !isRead && (
        <button
          disabled
          className="px-5 py-2 rounded-full bg-white/40 text-white/80 font-black cursor-not-allowed"
        >
          {isNarrating ? '🎧 正在读故事…' : '🔒 先听故事'}
        </button>
      )}
      {isNext && !isCaptured && !isRead && !isNarrating && (
        <p className="text-xs text-white/90 w-full mt-1">
          {index === 0
            ? '点「读这一集」，听完故事就能答题啦～'
            : '先读完故事，并用捕捉券解锁这一集哦～'}
        </p>
      )}

      {isNext && !isCaptured && isRead && !isQuiz && (
        <button
          disabled
          className="px-5 py-2 rounded-full bg-white/40 text-white/80 font-black cursor-not-allowed"
        >
          ❓ 先回答小问题
        </button>
      )}
      {isNext && !isCaptured && isRead && !isQuiz && (
        <p className="text-xs text-white/90 w-full mt-1">
          故事听完啦，先答对下面的小问题，就能捕捉萌可～
        </p>
      )}

      {isNext && !isCaptured && isQuiz && index > 0 && tickets === 0 && (
        <Link
          href="/daily-practice"
          className="px-5 py-2 rounded-full bg-white/90 text-moko-violet font-black shadow hover:scale-105 transition"
        >
          🎯 去赚捕捉券
        </Link>
      )}

      {isNext && !isCaptured && isQuiz && (index === 0 || tickets > 0) && (
        <ClayButton variant="brand" size="sm" disabled={capturing} onClick={onCapture}>
          {capturing ? '捕捉中…' : `✨ 捕捉${chapter.mokoName}！`}
        </ClayButton>
      )}

      {isCaptured && (
        <Link
          href="/castle"
          className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
        >
          去城堡看看 ›
        </Link>
      )}
    </div>
  );
}

/** 章节主题映射（gradient class → ClayCard theme） */
export function chapterTheme(gradient: string): 'pink' | 'gold' | 'blue' | 'violet' {
  if (gradient === 'from-moko-pink to-moko-purple') return 'pink';
  if (gradient === 'from-moko-yellow to-moko-yellow') return 'gold';
  if (gradient === 'from-moko-blue to-moko-blue') return 'blue';
  return 'violet';
}

/** 已全部捕捉完成的全站庆祝 */
export function StoryAllDone({ total }: { total: number }) {
  if (total === 0) return null;
  return (
    <div className="mt-8 rounded-3xl p-6 text-center bg-gradient-to-r from-moko-gold to-moko-yellow text-white shadow-xl">
      <div className="text-4xl mb-2">🏆</div>
      <div className="text-xl font-black">哇，你捕捉了全部萌可！</div>
      <div className="text-sm opacity-90 mt-1">打开图鉴，看看谁在城堡里等你回家～</div>
      <Link
        href="/castle"
        className="inline-block mt-3 px-6 py-2 rounded-full bg-white text-moko-violet font-black shadow"
      >
        🏰 进入城堡
      </Link>
    </div>
  );
}

/** 晚安连播入口按钮 */
export function StoryBedtimeEntry({ count, onStart }: { count: number; onStart: () => void }) {
  return (
    <ClayButton
      onClick={onStart}
      variant="brand"
      size="lg"
      fullWidth
      className="mb-6 p-4 text-lg transition hover:scale-[1.02]"
      style={{ background: 'linear-gradient(to right, #a855f7, #8b5cf6)' }}
    >
      🌙 晚安故事 · 连播 {count} 集
      <span className="block text-xs font-bold opacity-80 mt-1">慢速 · 无答题 · 播完自动停</span>
    </ClayButton>
  );
}

/** 加载中/失败态 */
export function StoryLoading({
  loadErr,
  onRetry,
}: {
  loadErr: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto py-20 text-center">
      {loadErr ? (
        <div className="space-y-4">
          <p className="text-gray-500 font-bold">😣 {loadErr}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-moko-violet text-white font-bold shadow hover:scale-105 transition"
          >
            重新加载
          </button>
        </div>
      ) : (
        <div className="text-gray-400">故事加载中…</div>
      )}
    </div>
  );
}
