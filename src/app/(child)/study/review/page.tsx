'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { playTts } from '@/lib/speak';
import { useOfflineStore } from '@/lib/stores';
import { ClayCard, ClayButton } from '@/components/design-system';
import { MISTAKE_ERROR_TYPES, mistakeErrorTypeLabel } from '@/lib/mistake-error-types';

/**
 * 🏫 小老师台词（2026-10-21 ②号内容升级）——固定文案，已进预生成
 * 静态集（moko-phrases-manifest ⑥ 段），播放走 preferStatic。
 * learning-by-teaching：让孩子把错题「讲给萌可听」，教是最好的学。
 */
const TEACH_LINES_OK = [
  '萌可学会啦，谢谢小老师！',
  '哇，原来如此！程程教得真清楚！',
  '程程是萌可最棒的小老师！',
];
const TEACH_LINES_RETRY = [
  '萌可还有点没听懂，再教一遍好不好？',
  '萌可想到了另一个答案，小老师再看看？',
];

interface MistakeRow {
  id: number;
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string | null;
  /** 来源学习模块 key（如 proverbs），用于「去练习」跳转 */
  source_module: string | null;
  interval_days: number;
  reps: number;
  error_type: string | null;
}

const subjectEmoji: Record<string, string> = {
  语文: '💗',
  数学: '🔵',
  英语: '💛',
};

const subjectKey: Record<string, string> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
};

/** 把正确答案、上次错误答案和其它干扰项混在一起打乱 */
function shuffleAns(answer: string, wrong: string | null, distractors: string[]): string[] {
  const opts = [answer, ...(wrong ? [wrong] : []), ...distractors].filter((d) => d !== answer);
  opts.unshift(answer);
  const uniq = [...new Set(opts)].slice(0, 4);
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return uniq;
}

export default function ReviewPage() {
  const [items, setItems] = useState<MistakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(0);
  const [pickedAns, setPickedAns] = useState<Record<number, string>>({});
  const [errorType, setErrorType] = useState<Record<number, string>>({});
  // 每题选项在题目加载后固定下来（useMemo 以 items 为源）。原来在 JSX 内联
  // 洗牌，任何 state 变化（本卡/他卡 pickedAns、revealed、done…）都会让
  // 全部未揭示卡的选项重排——孩子正要点的按钮在点击后跳位，极易误点。
  const optionsById = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const it of items) {
      m.set(
        it.id,
        shuffleAns(
          it.answer,
          it.wrong,
          items
            .filter((x) => x.id !== it.id && x.subject === it.subject)
            .map((x) => x.answer)
            .slice(0, 3)
        )
      );
    }
    return m;
  }, [items]);

  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch('/api/mistakes');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      setItems(Array.isArray(d?.due) ? d.due : []);
      setLoadError(null);
    } catch {
      // 断网/服务端错误：给出明确错误态 + 重试入口，而不是永久卡骨架屏
      setLoadError('错题本加载失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(id: number, correct: boolean, type?: string) {
    try {
      await fetch('/api/mistakes/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, correct, errorType: type }),
      });
    } catch {
      // 网络错误：入离线队列，联网后由 OfflineSync 重放（服务端按 next_review 幂等）
      useOfflineStore
        .getState()
        .addAction({ type: 'mistake-review', payload: { id, correct, errorType: type } });
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    // done 的增量只在「揭示答案答对」按钮处计一次（review() 也被
    // 「听懂啦 ✅」复用，原来两边都 +1 会让计数虚高）
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">
          ‹ 学习首页
        </Link>
      </div>
      <h1 className="page-title mb-2">🏫 萌可小课堂</h1>
      <p className="text-gray-600 mb-6">
        萌可们有些题还没弄懂，程程来当<b className="text-moko-violet">小老师</b>教教它们吧！
        想一想正确答案是哪个，点出来讲给萌可听～
      </p>

      {loading ? (
        <div className="text-center text-gray-400 py-16 flex flex-col items-center justify-center gap-3">
          <span className="moko-loader">
            <span></span>
            <span></span>
            <span></span>
          </span>
          萌可正在翻找你的错题本…
        </div>
      ) : loadError ? (
        <ClayCard theme="violet" className="p-10 text-center">
          <div className="text-5xl mb-3">📡</div>
          <div className="text-lg font-black text-moko-violet mb-4">{loadError}</div>
          <ClayButton
            variant="mint"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            重试 🔄
          </ClayButton>
        </ClayCard>
      ) : items.length === 0 ? (
        <ClayCard theme="violet" className="p-10 text-center">
          <div className="text-6xl mb-3">🎉</div>
          <div className="text-xl font-black text-moko-violet">
            萌可们全都学会了，没有要教的题！
          </div>
          <p className="text-gray-500 mt-2">去学科里多学一点，攒更多知识当小老师吧～</p>
        </ClayCard>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">
            今日待复习 {items.length} 个 · 已复习 {done} 个
          </div>
          <div className="space-y-3">
            {items.map((it) => (
              <ClayCard key={it.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{subjectEmoji[it.subject] || '📘'}</span>
                  <span className="font-bold text-moko-violet">{it.subject}</span>
                  <span className="text-xs text-gray-400">· {it.kind}</span>
                </div>
                <div className="text-lg font-black text-gray-700">{it.prompt}</div>
                {revealed[it.id] ? (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-bold">正确答案：{it.answer}</span>
                    {it.wrong && (
                      <span className="text-red-400 ml-2">（上次写错：{it.wrong}）</span>
                    )}
                    {pickedAns[it.id] && pickedAns[it.id] !== it.answer && (
                      <span className="text-red-500 ml-2">（这次选了：{pickedAns[it.id]}）</span>
                    )}
                    {it.error_type && (
                      <div className="mt-1 text-xs text-moko-violet">
                        上次错误原因：{mistakeErrorTypeLabel(it.error_type)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {/* 先重做：只记录选项，不揭示答案；确认后才进入解释 */}
                    {(() => {
                      const opts = optionsById.get(it.id) ?? [it.answer];
                      return opts.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setPickedAns((p) => ({ ...p, [it.id]: opt }))}
                          className={`w-full text-left px-3 py-2 rounded-xl font-bold text-sm transition ${
                            pickedAns[it.id] === opt
                              ? 'bg-moko-purple/10 text-moko-violet border-2 border-moko-purple/40'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-moko-purple/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ));
                    })()}
                  </div>
                )}
                {pickedAns[it.id] && !revealed[it.id] && (
                  <p className="mt-2 text-xs text-gray-500">
                    选好啦！现在确认一下，把正确答案讲给萌可听。
                  </p>
                )}
                {revealed[it.id] && pickedAns[it.id] !== it.answer && (
                  <div
                    className="mt-3 p-3 rounded-2xl bg-moko-purple/5 border border-moko-purple/10"
                    data-testid="error-type-picker"
                  >
                    <div className="text-xs font-bold text-moko-violet mb-2">
                      这次是因为什么没听懂呀？
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(MISTAKE_ERROR_TYPES).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setErrorType((p) => ({ ...p, [it.id]: key }));
                            void review(it.id, false, key);
                          }}
                          className={`px-2 py-2 rounded-xl text-xs font-bold transition ${
                            errorType[it.id] === key
                              ? 'bg-moko-violet text-white'
                              : 'bg-white text-moko-violet border border-moko-purple/20 hover:bg-moko-purple/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <ClayButton
                    variant="mint"
                    size="sm"
                    fullWidth
                    disabled={!pickedAns[it.id]}
                    onClick={() => {
                      const correct = pickedAns[it.id] === it.answer;
                      setRevealed((p) => ({ ...p, [it.id]: true }));
                      // 答对才结束本次复习；答错等孩子补选错误原因后再提交，
                      // 避免一揭示就丢失「为什么会错」这个关键学习信号。
                      if (correct) {
                        setDone((n) => n + 1);
                        void review(it.id, true);
                      }
                      void playTts(
                        correct
                          ? TEACH_LINES_OK[Math.floor(Math.random() * TEACH_LINES_OK.length)]
                          : TEACH_LINES_RETRY[Math.floor(Math.random() * TEACH_LINES_RETRY.length)],
                        'zh',
                        { wsRate: 0.85, preferStatic: true }
                      );
                    }}
                  >
                    揭示正确答案 👀
                  </ClayButton>
                  {revealed[it.id] ? (
                    <>
                      <ClayButton
                        variant="mint"
                        size="sm"
                        fullWidth
                        onClick={() => review(it.id, true)}
                      >
                        听懂啦 ✅
                      </ClayButton>
                    </>
                  ) : (
                    <ClayButton
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => {
                        setErrorType((p) => ({ ...p, [it.id]: 'concept' }));
                        void review(it.id, false, 'concept');
                      }}
                    >
                      直接讲给我 💡
                    </ClayButton>
                  )}
                </div>
                {it.source_module && (
                  <Link
                    href={`/study/${subjectKey[it.subject] ?? 'chinese'}/${it.source_module}`}
                    className="mt-2 inline-block text-xs px-3 py-1.5 rounded-full bg-moko-purple/10 text-moko-violet font-bold hover:bg-moko-purple/20 transition"
                  >
                    📚 去练同类题
                  </Link>
                )}
              </ClayCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
