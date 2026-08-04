'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { storyChapters } from '@/lib/story';
import { mokoImgByName } from '@/lib/moko-imgs';
import { playTtsEnd } from '@/lib/speak';

interface Progress {
  captured: string[];
  read: string[];
  quiz: string[];
  nextIndex: number;
  total: number;
  allDone: boolean;
  tickets: number;
}

export default function StoryPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [active, setActive] = useState<string | null>(null); // 正在展开阅读章节
  const [narrating, setNarrating] = useState<string | null>(null); // 正在自动朗读的章节
  const [readPara, setReadPara] = useState(-1); // 当前朗读到第几段（-1=未朗读，paragraphs.length=正在读 tip）
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [quizSet, setQuizSet] = useState<Set<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState('');
  const abortRef = useRef(false);
  const quizAbortRef = useRef(false);
  const [quizSpeaking, setQuizSpeaking] = useState(false);
  const [quizWrong, setQuizWrong] = useState(false);
  const [quizRight, setQuizRight] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function load() {
    setLoadErr(null);
    try {
      const r = await fetch('/api/story/progress');
      const j = await r.json();
      if (!j || !Array.isArray(j.captured)) {
        throw new Error(typeof j?.error === 'string' ? j.error : '数据格式异常');
      }
      setProgress(j);
      setReadSet(new Set(j.read || []));
      setQuizSet(new Set(j.quiz || []));
    } catch (e) {
      setLoadErr((e as Error)?.message || '故事加载失败了，点这里重试');
    }
  }

  useEffect(() => { load(); }, []);

  /** 标记某集已读完（捕捉前必须先读） */
  async function markRead(chapterId: string) {
    try {
      await fetch('/api/story/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
    } catch { /* 离线也先本地标记，保证体验流畅 */ }
    setReadSet((s) => new Set(s).add(chapterId));
  }

  /** 顺序朗读整集：一段一段读，读完标记已读并解锁捕捉 */
  async function startNarration(c: (typeof storyChapters)[number]) {
    if (narrating) stopNarration();
    setNarrating(c.id);
    setReadPara(0);
    abortRef.current = false;
    for (let k = 0; k < c.paragraphs.length; k++) {
      if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
      setReadPara(k);
      await playTtsEnd(c.paragraphs[k], 'zh', { wsRate: 0.7, pauseMs: 140 });
    }
    if (c.tip) {
      if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
      setReadPara(c.paragraphs.length);
      await playTtsEnd(c.tip, 'zh', { wsRate: 0.7, pauseMs: 140 });
    }
    if (abortRef.current) { setNarrating(null); setReadPara(-1); return; }
    setNarrating(null);
    setReadPara(-1);
    await markRead(c.id);
  }

  /** 停止朗读（故事） */
  function stopNarration() {
    abortRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setNarrating(null);
    setReadPara(-1);
  }

  /** 停止朗读（题目语音） */
  function stopQuiz() {
    quizAbortRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setQuizSpeaking(false);
  }

  /** 顺序朗读题目 + 每个选项（照顾还不识字的孩子） */
  async function speakQuiz(c: (typeof storyChapters)[number]) {
    if (!c.quiz || quizSpeaking) return;
    setQuizSpeaking(true);
    quizAbortRef.current = false;
    await playTtsEnd(c.quiz.q, 'zh', { wsRate: 0.7, pauseMs: 220 });
    if (quizAbortRef.current) { setQuizSpeaking(false); return; }
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let k = 0; k < c.quiz.options.length; k++) {
      if (quizAbortRef.current) { setQuizSpeaking(false); return; }
      await playTtsEnd(`${letters[k]}、${c.quiz.options[k]}`, 'zh', { wsRate: 0.8, pauseMs: 260 });
    }
    setQuizSpeaking(false);
  }

  /** 单独朗读某一个选项文字 */
  async function speakOne(text: string) {
    stopQuiz();
    await playTtsEnd(text, 'zh', { wsRate: 0.85, pauseMs: 120 });
  }

  /** 展开/收起 */
  function toggleOpen(c: (typeof storyChapters)[number]) {
    stopNarration();
    stopQuiz();
    setQuizWrong(false);
    setQuizRight(false);
    if (active === c.id) {
      setActive(null);
    } else {
      setActive(c.id);
      // 还没读过这集 → 打开就自动朗读（满足「打开阅读故事 + 自动语音」）
      if (!readSet.has(c.id)) startNarration(c);
    }
  }

  /** 提交小问题答案：答对才解锁捕捉 */
  async function answerQuiz(c: (typeof storyChapters)[number], idx: number) {
    stopQuiz();
    setQuizWrong(false);
    setQuizRight(false);
    try {
      const r = await fetch('/api/story/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: c.id, answer: idx }),
      });
      const j = await r.json();
      if (j.ok) {
        setQuizSet((s) => new Set(s).add(c.id));
        setQuizRight(true);
        playTtsEnd('答对啦！真棒！', 'zh', { wsRate: 0.85, pauseMs: 120 });
      } else if (j.code === 'wrong') {
        setQuizWrong(true);
        playTtsEnd('再想想看，选另一个试试吧～', 'zh', { wsRate: 0.85, pauseMs: 120 });
      } else {
        setQuizWrong(true);
        if (j.error) setToast(j.error);
      }
    } catch {
      setQuizWrong(true);
      setToast('网络好像走神了，再试一次吧');
    }
  }

  async function capture(chapterId: string) {
    setCapturing(true);
    setToast('');
    try {
      const r = await fetch('/api/story/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
      const j = await r.json();
      if (j.ok) {
        setToast(`🎉 捕捉到${j.mokoName}啦！去看看图鉴吧～`);
        setActive(null);
        stopNarration();
        stopQuiz();
        await load();
      } else if (j.code === 'not_read') {
        setToast(j.error || '先读完故事再捕捉哦～');
      } else if (j.code === 'not_quiz') {
        setToast(j.error || '先答对小问题再捕捉哦～');
      } else if (j.code === 'no_ticket') {
        setToast(j.error || '捕捉券不够啦～去做练习攒券吧');
      } else {
        setToast(j.error || '捕捉失败，再试一次');
      }
    } catch {
      setToast('网络好像走神了，再试一次吧');
    } finally {
      setCapturing(false);
    }
  }

  // 当某集「已读但还没答对」时，自动把题目和选项读给孩子听
  useEffect(() => {
    if (active && readSet.has(active) && !quizSet.has(active)) {
      const c = storyChapters.find((x) => x.id === active);
      if (c?.quiz) speakQuiz(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, readSet, quizSet]);

  if (!progress) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        {loadErr ? (
          <div className="space-y-4">
            <p className="text-gray-500 font-bold">😣 {loadErr}</p>
            <button
              onClick={load}
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

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/games" className="text-moko-violet font-bold hover:underline">‹ 游戏乐园</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-violet mb-2">📜 萌可剧情</h1>
      <p className="text-gray-600 mb-2">
        跟着乐美公主的领航故事，一集一集认识并捕捉萌可。已捕捉
        <span className="font-black text-moko-rose"> {progress.captured.length} </span>/ {progress.total} 只。
      </p>
      <p className="text-xs text-gray-500 mb-2">流程：听故事 → 答对小问题 → 捕捉萌可（第 2 集起还要用 1 张捕捉券）</p>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-moko-gold/15 text-moko-gold font-black px-3 py-1 text-sm">🎟️ 捕捉券 ×{progress.tickets}</span>
        {progress.tickets === 0 && (
          <span className="text-xs text-gray-500">做「萌可闯关」练习可攒捕捉券，用来解锁下一集</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all" style={{ width: `${(progress.captured.length / progress.total) * 100}%` }} />
      </div>

      {toast && (
        <div className="mb-5 rounded-2xl p-3 text-center font-bold bg-moko-rose/10 text-moko-rose border-2 border-moko-rose/20">{toast}</div>
      )}

      <div className="space-y-5">
        {storyChapters.map((c, i) => {
          const isCaptured = progress.captured.includes(c.id);
          const isRead = readSet.has(c.id);
          const isQuiz = quizSet.has(c.id);
          const isNext = i === progress.nextIndex;
          const isLocked = i > progress.nextIndex;
          const img = mokoImgByName[c.mokoName];
          const open = active === c.id;
          const isNarrating = narrating === c.id;

          if (isLocked) {
            return (
              <div key={c.id} className="rounded-3xl p-5 shadow-lg border-2 border-gray-200 bg-gray-100 opacity-80 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-300 flex items-center justify-center text-2xl">🔒</div>
                <div>
                  <div className="font-black text-gray-500">第 {i + 1} 集 · {c.title}</div>
                  <div className="text-xs text-gray-400">先捕捉上一集的萌可，就能解锁这一集～</div>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} className={`rounded-3xl p-5 shadow-xl border-2 bg-gradient-to-br ${c.gradient} text-white`}>
              <div className="flex items-center gap-4">
                {img ? (
                  <img src={img} alt={c.mokoName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/30 flex items-center justify-center text-3xl">{c.emoji}</div>
                )}
                <div className="flex-1">
                  <div className="font-black text-lg">第 {i + 1} 集 · {c.title}</div>
                  <div className="text-sm opacity-90">{c.scene} · 主角 {c.mokoName}</div>
                </div>
                {isCaptured && <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">✅ 已捕捉</span>}
                {!isCaptured && isQuiz && <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">📖 已读·已答</span>}
                {!isCaptured && isRead && !isQuiz && <span className="text-sm font-bold bg-white/25 px-3 py-1 rounded-full">📖 已读</span>}
              </div>

              {open && (
                <div className="mt-4 bg-white/95 text-gray-700 rounded-2xl p-4">
                  {isNarrating && (
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-moko-violet/10 text-moko-violet font-bold px-3 py-1 text-sm">
                      🔊 正在读故事…
                    </div>
                  )}
                  {c.paragraphs.map((p, k) => (
                    <p
                      key={k}
                      className={`mb-2 leading-relaxed transition ${isNarrating && readPara === k ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2 font-bold text-moko-violet' : ''}`}
                    >
                      {p}
                    </p>
                  ))}
                  {c.tip && (
                    <p
                      className={`text-sm text-moko-violet font-semibold mt-2 transition ${isNarrating && readPara === c.paragraphs.length ? 'bg-moko-yellow/30 rounded-lg px-2 -mx-2' : ''}`}
                    >
                      💡 {c.tip}
                    </p>
                  )}

                  {/* —— 读完故事，弹出小问题（答对才能捕捉） —— */}
                  {open && isRead && !isQuiz && c.quiz && (
                    <div className="mt-4 rounded-2xl bg-moko-gold/10 border-2 border-moko-gold/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-moko-violet">❓ 小问题</span>
                        {quizSpeaking && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-moko-violet/10 text-moko-violet text-xs font-bold px-2 py-0.5">🔊 正在读题…</span>
                        )}
                        <button
                          onClick={() => speakQuiz(c)}
                          className="ml-auto text-xs px-3 py-1 rounded-full bg-moko-violet/10 text-moko-violet font-bold hover:bg-moko-violet/20 transition"
                        >
                          🔊 再听一遍
                        </button>
                      </div>
                      <p className="font-bold text-gray-800 mb-3 leading-relaxed">{c.quiz.q}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {c.quiz.options.map((opt, k) => (
                          <div key={k} className="flex items-center gap-2">
                            <button
                              onClick={() => answerQuiz(c, k)}
                              className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white border-2 border-moko-violet/30 font-bold text-gray-800 hover:bg-moko-violet/10 hover:border-moko-violet transition"
                            >
                              {opt}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); speakOne(opt); }}
                              className="px-3 py-2.5 rounded-xl bg-moko-violet/10 text-moko-violet font-bold hover:bg-moko-violet/20 transition"
                              aria-label="听这个选项"
                            >
                              🔊
                            </button>
                          </div>
                        ))}
                      </div>
                      {quizWrong && (
                        <p className="mt-3 text-sm font-bold text-moko-rose">😊 再想想看，选另一个试试吧～</p>
                      )}
                    </div>
                  )}

                  {/* 已读且已答对 */}
                  {open && isQuiz && (
                    <div className="mt-4 mb-1 inline-flex items-center gap-2 rounded-full bg-moko-rose/10 text-moko-rose font-bold px-3 py-1 text-sm">
                      ✅ 小问题答对啦，可以捕捉咯！
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  onClick={() => toggleOpen(c)}
                  className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
                >
                  {open ? '收起故事' : isRead ? '📖 再读一遍' : '📖 读这一集'}
                </button>

                {/* 已展开且已读：提供「再听一遍」 */}
                {open && isRead && !isNarrating && (
                  <button
                    onClick={() => startNarration(c)}
                    className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition"
                  >
                    🔊 再听一遍
                  </button>
                )}

                {/* —— 捕捉门槛：必须先读完故事 —— */}
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
                    {i === 0 ? '点「读这一集」，听完故事就能答题啦～' : '先读完故事，并用捕捉券解锁这一集哦～'}
                  </p>
                )}

                {/* —— 读完但还没答对：先答题 —— */}
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

                {/* 已读已答但缺券（非首集）：去赚券 */}
                {isNext && !isCaptured && isQuiz && i > 0 && progress.tickets === 0 && (
                  <Link href="/daily-practice" className="px-5 py-2 rounded-full bg-white/90 text-moko-violet font-black shadow hover:scale-105 transition">
                    🎯 去赚捕捉券
                  </Link>
                )}

                {/* 已读已答且有资格：直接捕捉 */}
                {isNext && !isCaptured && isQuiz && (i === 0 || progress.tickets > 0) && (
                  <button
                    onClick={() => capture(c.id)}
                    disabled={capturing}
                    className="px-5 py-2 rounded-full bg-white text-moko-violet font-black shadow hover:scale-105 transition disabled:opacity-60"
                  >
                    {capturing ? '捕捉中…' : `✨ 捕捉${c.mokoName}！`}
                  </button>
                )}

                {isCaptured && (
                  <Link href="/castle" className="px-5 py-2 rounded-full bg-white/25 font-bold hover:bg-white/35 transition">
                    去城堡看看 ›
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progress.allDone && (
        <div className="mt-8 rounded-3xl p-6 text-center bg-gradient-to-r from-moko-gold to-moko-yellow text-white shadow-xl">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-black">哇，你捕捉了全部萌可！</div>
          <div className="text-sm opacity-90 mt-1">打开图鉴，看看谁在城堡里等你回家～</div>
          <Link href="/castle" className="inline-block mt-3 px-6 py-2 rounded-full bg-white text-moko-violet font-black shadow">🏰 进入城堡</Link>
        </div>
      )}
    </div>
  );
}
