'use client';

import { useState } from 'react';
import type { Task, Subject } from '@/lib/types';
import { speakZh, speakEn } from '@/lib/speak';
import { logMistake } from '@/lib/mistake-log';

const SUBJECT_COLOR: Record<Subject, string> = {
  语文: 'bg-moko-pink text-white',
  数学: 'bg-moko-blue text-white',
  英语: 'bg-moko-mint text-white',
};

const FILTERS: ('全部' | Subject)[] = ['全部', '语文', '数学', '英语'];

interface DictItem {
  prompt: string;
  answer: string;
  kind: string;
  options?: string[];
}
interface DictData {
  __kind: 'dictation';
  mode: 'char' | 'math' | 'en';
  items: DictItem[];
}
interface QuizData {
  __kind: 'quiz';
  mode: string;
  items: DictItem[];
}

function parseDictation(desc: string | undefined): DictData | null {
  if (!desc) return null;
  try {
    const o = JSON.parse(desc);
    if (o && o.__kind === 'dictation' && Array.isArray(o.items)) return o as DictData;
  } catch {
    /* not a dictation task */
  }
  return null;
}

function parseQuiz(desc: string | undefined): QuizData | null {
  if (!desc) return null;
  try {
    const o = JSON.parse(desc);
    // 必须每题都带 options 才按选择题渲染，否则退回普通任务展示
    if (o && o.__kind === 'quiz' && Array.isArray(o.items) && o.items.length > 0) {
      const ok = (o.items as DictItem[]).every((q) => Array.isArray(q.options) && q.options.length >= 2);
      if (ok) return o as QuizData;
    }
  } catch {
    /* not a quiz task */
  }
  return null;
}

function readItem(mode: DictData['mode'], it: DictItem) {
  if (mode === 'en') return speakEn(it.prompt);
  if (mode === 'math') {
    const m = it.prompt.match(/(\d+)\s*\+\s*(\d+)/);
    if (m) return speakZh(`${m[1]} 加 ${m[2]} 等于几`);
    return speakZh(it.prompt);
  }
  return speakZh(it.prompt);
}

function DictationCard({ task, data, onDone }: { task: Task; data: DictData; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const total = data.items.length;
  const cur = data.items[idx];
  const correct = results.filter(Boolean).length;
  const wrong = results.filter((r) => r === false).length;

  const answer = async (ok: boolean) => {
    if (ok) {
      setResults((p) => [...p, true]);
    } else {
      setResults((p) => [...p, false]);
      // 还不会 → 记入错题本。走共享实现：网络失败会入离线队列，
      // 联网后自动补记（此前裸 fetch + 空 catch，断网即永久丢失）。
      void logMistake({
        subject: task.subject,
        kind: cur.kind,
        prompt: cur.prompt,
        answer: cur.answer,
        wrong: cur.prompt,
        sourceModule: 'dictation',
      });
    }
    if (idx + 1 >= total) {
      setDone(true);
      onDone();
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    return (
      <div className="card-moko text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="section-title">听写完成！</h3>
        <p className="text-gray-600 mt-1">
          会了 {correct} 个，还不会 {wrong} 个（已放进错题本，记得复习哦）
        </p>
        <div className="text-xs text-moko-rose font-bold mt-2">🎯 获得 {task.points} 积分</div>
      </div>
    );
  }

  return (
    <div className="card-moko">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBJECT_COLOR[task.subject]}`}
        >
          {task.subject}·听写
        </span>
        <span className="font-black text-moko-rose">
          {idx + 1}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-moko-rose to-moko-pink transition-all"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm mb-3">听一听，在纸上写下来～</p>
        <button
          onClick={() => readItem(data.mode, cur)}
          className="px-8 py-4 rounded-3xl bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black text-lg shadow hover:scale-105 transition"
        >
          🔊 听一听
        </button>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => answer(true)}
          className="flex-1 py-3 rounded-2xl bg-moko-mint text-white font-black shadow hover:scale-105 transition"
        >
          ✅ 会了
        </button>
        <button
          onClick={() => answer(false)}
          className="flex-1 py-3 rounded-2xl bg-red-400 text-white font-black shadow hover:scale-105 transition"
        >
          ❌ 还不会
        </button>
      </div>
    </div>
  );
}

/**
 * AI 智能小测验卡（家长端「🤖 AI 出题」布置的选择题任务）。
 * 点选项作答：答对亮绿、答错亮红并自动进错题本；全部答完领任务积分。
 */
function QuizCard({ task, data, onDone }: { task: Task; data: QuizData; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null); // 本题选中的选项文本
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const total = data.items.length;
  const cur = data.items[idx];

  const choose = (opt: string) => {
    if (picked) return; // 已作答本题
    setPicked(opt);
    const ok = opt === cur.answer;
    if (ok) setRight((n) => n + 1);
    else {
      setWrong((n) => n + 1);
      // 答错 → 错题本（与 DictationCard 同一共享实现，断网入离线队列）
      void logMistake({
        subject: task.subject,
        kind: cur.kind,
        prompt: cur.prompt,
        answer: cur.answer,
        wrong: opt,
        sourceModule: 'ai-quiz',
      });
    }
    setTimeout(() => {
      if (idx + 1 >= total) {
        setDone(true);
        onDone();
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 900); // 给孩子一点看「对/错」反馈的时间
  };

  if (done) {
    return (
      <div className="card-moko text-center">
        <div className="text-4xl mb-2">{right === total ? '🏆' : '🎉'}</div>
        <h3 className="section-title">小测验完成！</h3>
        <p className="text-gray-600 mt-1">
          答对 {right} 题{wrong > 0 ? `，答错 ${wrong} 题（已放进错题本，记得复习哦）` : '，全对真棒！'}
        </p>
        <div className="text-xs text-moko-rose font-bold mt-2">🎯 获得 {task.points} 积分</div>
      </div>
    );
  }

  return (
    <div className="card-moko">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBJECT_COLOR[task.subject]}`}>
          {task.subject}·小测验
        </span>
        <span className="font-black text-moko-rose">
          {idx + 1}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-moko-rose to-moko-pink transition-all"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>
      <p className="font-bold text-gray-800 mb-4 leading-relaxed">{cur.prompt}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {cur.options?.map((opt, k) => {
          const isAnswer = opt === cur.answer;
          const isPicked = opt === picked;
          const showState = picked != null && (isPicked || isAnswer);
          return (
            <button
              key={k}
              onClick={() => choose(opt)}
              disabled={picked != null}
              className={`text-left px-4 py-3 rounded-xl border-2 font-bold transition ${
                showState
                  ? isAnswer
                    ? 'bg-moko-mint/20 border-moko-mint text-moko-mint'
                    : 'bg-red-100 border-red-300 text-red-400'
                  : 'bg-white border-moko-violet/30 text-gray-800 hover:bg-moko-violet/10'
              }`}
            >
              {showState && (isAnswer ? '✓ ' : isPicked ? '✗ ' : '')}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ChildTaskList({
  tasks,
  initialPoints,
}: {
  tasks: Task[];
  initialPoints: number;
}) {
  const [list, setList] = useState<Task[]>(tasks);
  const [filter, setFilter] = useState<'全部' | Subject>('全部');
  const [points, setPoints] = useState(initialPoints);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const shown = filter === '全部' ? list : list.filter((t) => t.subject === filter);
  const doneCount = list.filter((t) => t.completed).length;
  const total = list.length;

  async function complete(t: Task) {
    try {
      const res = await fetch(`/api/tasks/${t.id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: true } : x)));
        setPoints((p) => p + t.points);
        setToast({ msg: `完成「${t.title}」，获得 ${t.points} 积分！`, ok: true });
      } else {
        setToast({ msg: String(data.error || '出了点小问题，再试一次～'), ok: false });
      }
    } catch {
      setToast({ msg: '网络开小差了，再试一次～', ok: false });
    }
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`p-3 rounded-2xl text-white font-bold text-center shadow ${toast.ok ? 'bg-moko-mint' : 'bg-red-400'}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="card-moko">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-moko-violet">完成进度</span>
          <span className="font-black text-moko-rose">
            {doneCount}/{total}
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-moko-rose to-moko-pink transition-all duration-500"
            style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          当前积分：<span className="font-black text-moko-rose">{points}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full font-bold text-sm transition ${
              filter === s
                ? 'bg-moko-violet text-white'
                : 'bg-white text-moko-violet border-2 border-moko-purple/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card-moko text-gray-500 text-center py-10">
          还没有任务哦，等爸爸妈妈布置吧～ 🐣
        </div>
      ) : (
        shown.map((t) => {
          const dict = parseDictation(t.description);
          const quiz = parseQuiz(t.description);
          if (quiz && !t.completed) {
            return <QuizCard key={t.id} task={t} data={quiz} onDone={() => complete(t)} />;
          }
          if (dict && !t.completed) {
            return <DictationCard key={t.id} task={t} data={dict} onDone={() => complete(t)} />;
          }
          return (
            <div key={t.id} className="card-moko">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBJECT_COLOR[t.subject]}`}
                    >
                      {t.subject}
                    </span>
                    <span className="font-black text-lg text-moko-violet truncate">{t.title}</span>
                  </div>
                  {/* AI 测验/听写的 description 是 JSON 数据，不该当普通文本展示 */}
                  {t.description && !dict && !quiz && (
                    <p className="text-sm text-gray-600 mb-2">{t.description}</p>
                  )}
                  <div className="text-xs text-moko-rose font-bold">🎯 {t.points} 积分</div>
                </div>
                <button
                  disabled={t.completed}
                  onClick={() => complete(t)}
                  className={`shrink-0 px-4 py-2 rounded-2xl font-bold text-white shadow ${
                    t.completed
                      ? 'bg-moko-mint cursor-default'
                      : 'bg-gradient-to-r from-moko-rose to-moko-pink hover:scale-105 transition'
                  }`}
                >
                  {t.completed ? '已完成 ✓' : '完成'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
