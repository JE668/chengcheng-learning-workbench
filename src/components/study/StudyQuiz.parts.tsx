'use client';

/**
 * StudyQuiz 的纯展示子组件：选项网格 / 题头 / 本轮结算封面 / 答题反馈。
 * 抽离自 StudyQuiz.tsx 以保持主组件聚焦于状态机与业务逻辑。
 */
import { MokoPraiseBanner } from '@/components/study/MokoPraise';
import type { QuizItem } from '@/components/study/StudyQuiz';

/** 题头：进度统计 + 听题目按钮 */
export function QuizHeader({
  rightCount,
  progressPct,
  moduleKey,
  questionsAnswered,
  roundSize,
  item,
  onSpeak,
}: {
  rightCount: number;
  progressPct: number;
  moduleKey?: string;
  questionsAnswered: number;
  roundSize: number;
  item: QuizItem;
  onSpeak: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold text-gray-400">
        已答对 {rightCount} · 正确率 {progressPct}%
        {moduleKey ? ` · 本轮第 ${Math.min(questionsAnswered + 1, roundSize)}/${roundSize} 题` : ''}
      </span>
      {item.speak || item.speakEn ? (
        <button
          onClick={onSpeak}
          className="text-xs px-3 py-1 rounded-full bg-moko-yellow text-white font-bold active:scale-95 transition"
        >
          🔊 听题目
        </button>
      ) : null}
    </div>
  );
}

/** 选项网格：2 列，答题后即时高亮对错 */
export function QuizOptions({
  options,
  answer,
  picked,
  textColor,
  onPick,
}: {
  options: string[];
  answer: string;
  picked: string | null;
  textColor: string;
  onPick: (opt: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const isAnswer = opt === answer;
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
            onClick={() => onPick(opt)}
            className={`py-4 rounded-2xl font-black text-2xl shadow active:scale-95 transition disabled:cursor-default ${cls}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 本轮结算封面：星数 + 正确率 + 封面累计星。
 * displayStars 一直在按 max 累积封面星数，这里显式渲染，让「星星会留在封面上」的
 * 承诺有落点；取 max 而非本轮值：历史最佳不会被某次失误抹掉。
 */
export function RoundSummary({
  roundStars,
  roundAcc,
  attempts,
  displayStars,
  color,
  onContinue,
}: {
  roundStars: number;
  roundAcc: number;
  attempts: number;
  displayStars: number;
  color: string;
  onContinue: () => void;
}) {
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
        <p className="text-gray-600 mb-2">
          正确率 {roundAcc}%，共答 {attempts} 题
        </p>
        <p className="text-sm text-moko-violet font-bold mb-3">
          🏰 封面累计：
          <span className="text-yellow-400">{'★'.repeat(displayStars)}</span>
          <span className="text-gray-300">{'☆'.repeat(Math.max(0, 3 - displayStars))}</span>
        </p>
        <button
          onClick={onContinue}
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

/**
 * 答题后的文字反馈：镇守萌可用它的性格口头禅给小朋友贴心的答对 / 答错反馈。
 * line 来自语音选中的同一句（pick() 里 pickMokoLine 返回），保证「听到的 = 看到的」。
 */
export function CorrectFeedback({
  subject,
  ok,
  item,
  line,
}: {
  subject: string;
  ok: boolean;
  item: QuizItem;
  line: string;
}) {
  return (
    <div className="space-y-1">
      {ok && (
        <div className="flex justify-center gap-1.5 my-1">
          {['⭐', '🌟', '✨'].map((s, i) => (
            <span
              key={i}
              className="text-2xl animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <MokoPraiseBanner
        subject={subject}
        ok={ok}
        text={line || (ok ? '真棒！' : '没关系，再试试～')}
      />
      {!ok && <p className="text-center text-xs text-gray-500 mt-1">正确答案是「{item.answer}」</p>}
    </div>
  );
}
