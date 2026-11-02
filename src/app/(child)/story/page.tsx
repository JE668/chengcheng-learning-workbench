'use client';

import { useEffect, useRef, useState } from 'react';
import { storyChapters } from '@/lib/story';
import { STUDY_MODULES, type StudySubject } from '@/lib/study-modules';
import { mokoImgByName } from '@/lib/moko-imgs';
import { mokoCollectionByName } from '@/lib/moko-collection';
import { playTtsEnd, prefetchStaticAudio } from '@/lib/speak';
import { CaptureMoment, type CapturePayload } from '@/components/CaptureMoment';
import { useOfflineStore } from '@/lib/stores';
import { ClayCard } from '@/components/design-system';

import { StoryHeader } from './components/StoryHeader';
import { BedtimeOverlay } from './components/BedtimeMode';
import {
  StoryChapterLocked,
  StoryChapterHeader,
  StoryReadingPanel,
  StoryChapterActions,
  StoryAllDone,
  StoryBedtimeEntry,
  StoryLoading,
  chapterTheme,
} from './components/StoryChapterCard';
import type { StoryProgress } from './components/types';

type Chapter = (typeof storyChapters)[number];

export default function StoryPage() {
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [active, setActive] = useState<string | null>(null); // 正在展开阅读章节
  const [narrating, setNarrating] = useState<string | null>(null); // 正在自动朗读的章节
  const [readPara, setReadPara] = useState(-1); // 当前朗读到第几段（-1=未朗读，paragraphs.length=正在读 tip）
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  // 🌙 晚安模式（2026-10-21 ①号内容升级）：睡前连播已解锁的故事集——
  // 更慢语速（0.6）、无答题、暗屏遮罩、读完自动停。孩子睡前听故事是
  // 真实高频场景，故事 TTS 已全量预生成（弱网/断网也秒响）。
  const [bedtime, setBedtime] = useState(false);
  const [bedtimeCh, setBedtimeCh] = useState<Chapter | null>(null);
  const bedtimeAbort = useRef(false);
  const [quizSet, setQuizSet] = useState<Set<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState('');
  const [justCaught, setJustCaught] = useState<CapturePayload | null>(null);
  const abortRef = useRef(false);
  const quizAbortRef = useRef(false);
  const [quizSpeaking, setQuizSpeaking] = useState(false);
  // 答题反馈必须**按章节**存，不能用单一 boolean：storyChapters.map 一次渲染全部章节，
  // 一个全局标志会在孩子切换到下一集时串味（上一集答错的红字飘到新章节）。
  const [quizWrongFor, setQuizWrongFor] = useState<string | null>(null);
  const [quizRightFor, setQuizRightFor] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  /** 有模块锁定剧情的章节是否已达成（moduleKey → 是否 ≥1 星） */
  const [moduleDone, setModuleDone] = useState<Record<string, boolean>>({});
  /**
   * 按当前孩子取的差异化题目（chapterId → {q, options}），多娃防抄题（2026-10-17）：
   * 远征章节每个孩子各出一版；主线章节服务端返回同一题。
   * 取不到时渲染层回退到全局 c.quiz（旧库/接口异常都不影响答题）。
   */
  const [childQuiz, setChildQuiz] = useState<Record<string, { q: string; options: string[] }>>({});

  /** 拉某章节「给这个孩子」的题目；失败静默回退全局题，绝不阻塞答题 */
  async function loadChildQuiz(chapterId: string) {
    if (childQuiz[chapterId]) return;
    try {
      const r = await fetch(`/api/story/quiz?chapterId=${encodeURIComponent(chapterId)}`);
      if (!r.ok) return;
      const j = (await r.json()) as { chapterId?: string; q?: string; options?: string[] };
      if (j.chapterId && j.q && Array.isArray(j.options)) {
        setChildQuiz((m) => ({ ...m, [chapterId]: { q: j.q!, options: j.options! } }));
      }
    } catch {
      /* 网络失败：渲染层回退全局 quiz */
    }
  }

  async function loadModuleProgress() {
    const reqs = storyChapters
      .filter((c) => c.module)
      .map(async (c) => {
        const mod = c.module;
        try {
          const r = await fetch(
            `/api/module-progress?subject=${encodeURIComponent(mod!.subject)}&moduleKey=${encodeURIComponent(mod!.key)}`
          );
          const d = await r.json();
          return { key: mod!.key, done: (Number(d.stars) || 0) >= 1 } as const;
        } catch {
          return { key: mod!.key, done: true } as const; // 查询失败不卡剧情
        }
      });
    const results = await Promise.all(reqs);
    const map: Record<string, boolean> = {};
    for (const x of results) map[x.key] = x.done;
    setModuleDone(map);
  }

  useEffect(() => {
    load();
    loadModuleProgress();
  }, []);

  /** 模块绑定章节的解锁判定 + 展示用模块名 */
  function moduleInfo(c: Chapter) {
    const mod = c.module;
    if (!mod) return null;
    const list = STUDY_MODULES[mod.subject as StudySubject] ?? [];
    const meta = list.find((m) => m.key === mod.key);
    const label = meta?.label ?? mod.key;
    const done = !!moduleDone[mod.key];
    return { label, done, href: `/study/${mod.subject}/${mod.key}` };
  }

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

  // 注：原先这里还有一个 `useEffect(() => { load(); }, [])`，
  // 与上面的 effect 重复调用了 load() —— 进入页面会并发发两次
  // GET /api/story/progress，后到的响应覆盖先到的（竞态）。
  // 现只保留上面那一个 effect。

  /** 标记某集已读完（捕捉前必须先读） */
  async function markRead(chapterId: string) {
    try {
      await fetch('/api/story/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
    } catch {
      /* 离线也先本地标记，保证体验流畅 */
    }
    setReadSet((s) => new Set(s).add(chapterId));
  }

  /** 顺序朗读整集：一段一段读，读完标记已读并解锁捕捉 */
  async function startNarration(c: Chapter) {
    if (narrating) stopNarration();
    setNarrating(c.id);
    setReadPara(0);
    abortRef.current = false;
    for (let k = 0; k < c.paragraphs.length; k++) {
      if (abortRef.current) {
        setNarrating(null);
        setReadPara(-1);
        return;
      }
      setReadPara(k);
      // 预取下一段静态 MP3（浏览器 HTTP 缓存；弱网下命中即零网络）
      if (k + 1 < c.paragraphs.length) {
        prefetchStaticAudio(c.paragraphs[k + 1], 'zh');
      }
      await playTtsEnd(c.paragraphs[k], 'zh', { wsRate: 0.7, pauseMs: 80, preferStatic: true });
    }
    if (c.tip) {
      if (abortRef.current) {
        setNarrating(null);
        setReadPara(-1);
        return;
      }
      setReadPara(c.paragraphs.length);
      await playTtsEnd(c.tip, 'zh', { wsRate: 0.7, pauseMs: 80, preferStatic: true });
    }
    // 故事朗读完毕：预取下一集的前两段 TTS，减少切换到下一集时的等待
    const nextIdx = storyChapters.findIndex((ch) => ch.id === c.id) + 1;
    if (nextIdx < storyChapters.length) {
      const nextCh = storyChapters[nextIdx];
      // 静态预取：下一集开讲前把前两段拉进 HTTP 缓存（833 条故事
      // MP3 已随镜像内置，prefetchStaticAudio 用 <link preload> 让
      // 浏览器提前下载，不走服务端合成）
      if (nextCh.paragraphs.length > 0) prefetchStaticAudio(nextCh.paragraphs[0], 'zh');
      if (nextCh.paragraphs.length > 1) prefetchStaticAudio(nextCh.paragraphs[1], 'zh');
    }
    if (abortRef.current) {
      setNarrating(null);
      setReadPara(-1);
      return;
    }
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

  /** 顺序朗读题目 + 每个选项（照顾还不识字的孩子）。优先读「给这个孩子」的题 */
  async function speakQuiz(c: Chapter) {
    const quiz = childQuiz[c.id] ?? c.quiz;
    if (!quiz || quizSpeaking) return;
    setQuizSpeaking(true);
    quizAbortRef.current = false;
    await playTtsEnd(quiz.q, 'zh', { wsRate: 0.7, pauseMs: 220, preferStatic: true });
    if (quizAbortRef.current) {
      setQuizSpeaking(false);
      return;
    }
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let k = 0; k < quiz.options.length; k++) {
      if (quizAbortRef.current) {
        setQuizSpeaking(false);
        return;
      }
      await playTtsEnd(`${letters[k]}、${quiz.options[k]}`, 'zh', { wsRate: 0.8, pauseMs: 260 });
    }
    setQuizSpeaking(false);
  }

  /** 单独朗读某一个选项文字 */
  async function speakOne(text: string) {
    stopQuiz();
    await playTtsEnd(text, 'zh', { wsRate: 0.85, pauseMs: 120, preferStatic: true });
  }

  /** 🌙 晚安连播：从第一集顺序播已解锁的全部故事（含 nextIndex 集） */
  async function startBedtime() {
    if (bedtime || !progress) return;
    const playable = storyChapters.slice(0, progress.nextIndex + 1);
    if (playable.length === 0) return;
    stopNarration();
    stopQuiz();
    bedtimeAbort.current = false;
    setBedtime(true);
    try {
      for (const c of playable) {
        if (bedtimeAbort.current) break;
        setBedtimeCh(c);
        // 预取本集段落（静态 MP3，弱网零延迟）
        for (const p of c.paragraphs) prefetchStaticAudio(p, 'zh');
        if (c.tip) prefetchStaticAudio(c.tip, 'zh');
        for (let k = 0; k < c.paragraphs.length; k++) {
          if (bedtimeAbort.current) break;
          await playTtsEnd(c.paragraphs[k], 'zh', {
            wsRate: 0.6,
            pauseMs: 260,
            preferStatic: true,
          });
        }
        if (!bedtimeAbort.current && c.tip) {
          await playTtsEnd(c.tip, 'zh', { wsRate: 0.6, pauseMs: 400, preferStatic: true });
        }
        // 集间停顿：让孩子知道换了一集
        if (!bedtimeAbort.current) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    } finally {
      setBedtime(false);
      setBedtimeCh(null);
    }
  }

  function stopBedtime() {
    bedtimeAbort.current = true;
    setBedtime(false);
    setBedtimeCh(null);
  }

  /** 展开/收起 */
  function toggleOpen(c: Chapter) {
    stopNarration();
    stopQuiz();
    // 只在**收起**当前章节时清掉它的答题反馈：展开别的一集不该把这一集的结果抹掉
    // （此前是全局 boolean，收起任意一集都会清掉所有反馈）。
    if (active === c.id) {
      setQuizWrongFor(null);
      setQuizRightFor(null);
    }
    if (active === c.id) {
      setActive(null);
    } else {
      setActive(c.id);
      // 多娃差异化：展开章节即按当前孩子取题（答题校验与服务端同源）
      if (c.quiz) loadChildQuiz(c.id);
      // 打开章节即静态预取全部段落+tip（833 条故事 MP3 随镜像内置，
      // 弱网下朗读全部本地命中；不再触发服务端合成）
      for (const p of c.paragraphs) prefetchStaticAudio(p, 'zh');
      if (c.tip) prefetchStaticAudio(c.tip, 'zh');
      // 还没读过这集 → 打开就自动朗读（满足「打开阅读故事 + 自动语音」）
      if (!readSet.has(c.id)) startNarration(c);
    }
  }

  /** 提交小问题答案：答对才解锁捕捉 */
  async function answerQuiz(c: Chapter, idx: number) {
    stopQuiz();
    setQuizWrongFor(null);
    setQuizRightFor(null);
    try {
      const r = await fetch('/api/story/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: c.id, answer: idx }),
      });
      const j = await r.json();
      if (j.ok) {
        setQuizSet((s) => new Set(s).add(c.id));
        setQuizRightFor(c.id);
        playTtsEnd('答对啦！真棒！', 'zh', { wsRate: 0.85, pauseMs: 120 });
      } else if (j.code === 'wrong') {
        setQuizWrongFor(c.id);
        playTtsEnd('再想想看，选另一个试试吧～', 'zh', { wsRate: 0.85, pauseMs: 120 });
      } else {
        setQuizWrongFor(c.id);
        if (j.error) setToast(j.error);
      }
    } catch {
      setQuizWrongFor(c.id);
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
        // 组装捕捉演出数据（优先用轻量集合里的真实口头禅/图片，缺失回退 emoji）
        const nm = j.mokoName as string;
        const entry = mokoCollectionByName[nm];
        setJustCaught({
          name: nm,
          img: entry?.img || mokoImgByName[nm] || '',
          emoji: entry?.emoji || '✨',
          line: entry?.line,
        });
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
      // 网络错误：入离线队列，联网后自动重放
      useOfflineStore.getState().addAction({ type: 'story-capture', payload: { chapterId } });
      setToast('网络不稳，已离线保存，联网后自动同步～');
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
    return <StoryLoading loadErr={loadErr} onRetry={load} />;
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <StoryHeader
        capturedCount={progress.captured.length}
        total={progress.total}
        tickets={progress.tickets}
      />

      {/* 🌙 晚安模式入口：睡前连播已解锁的故事——慢语速、暗屏、无答题 */}
      {progress.nextIndex >= 0 && (
        <StoryBedtimeEntry
          count={Math.min(progress.nextIndex + 1, storyChapters.length)}
          onStart={() => void startBedtime()}
        />
      )}

      {/* 🌙 晚安模式遮罩 */}
      {bedtime && (
        <BedtimeOverlay
          chapter={bedtimeCh}
          img={(bedtimeCh && mokoImgByName[bedtimeCh.mokoName]) || ''}
          onStop={stopBedtime}
        />
      )}

      {toast && (
        <div className="mb-5 rounded-2xl p-3 text-center font-bold bg-moko-rose/10 text-moko-rose border-2 border-moko-rose/20">
          {toast}
        </div>
      )}

      <div className="space-y-5">
        {storyChapters.map((c, i) => {
          const isCaptured = progress.captured.includes(c.id);
          const isRead = readSet.has(c.id);
          const isQuiz = quizSet.has(c.id);
          const isNext = i === progress.nextIndex;
          const isLocked = i > progress.nextIndex;
          const mod = moduleInfo(c);
          const lockedByModule = mod ? !mod.done : false;
          const img = mokoImgByName[c.mokoName];
          const open = active === c.id;
          const isNarrating = narrating === c.id;

          if (isLocked || lockedByModule) {
            return <StoryChapterLocked key={c.id} index={i} chapter={c} mod={mod} />;
          }

          return (
            <ClayCard key={c.id} theme={chapterTheme(c.gradient)} className="p-5">
              <StoryChapterHeader
                chapter={c}
                index={i}
                img={img}
                isCaptured={isCaptured}
                isRead={isRead}
                isQuiz={isQuiz}
              />

              <StoryReadingPanel
                chapter={c}
                open={open}
                isRead={isRead}
                isQuiz={isQuiz}
                isNarrating={isNarrating}
                readPara={readPara}
                quiz={childQuiz[c.id] ?? c.quiz}
                quizSpeaking={quizSpeaking}
                quizWrongFor={quizWrongFor === c.id}
                quizRightFor={quizRightFor === c.id}
                onSpeakQuiz={() => speakQuiz(c)}
                onAnswer={(k) => void answerQuiz(c, k)}
                onSpeakOne={(text) => void speakOne(text)}
              />

              <StoryChapterActions
                chapter={c}
                index={i}
                open={open}
                isRead={isRead}
                isQuiz={isQuiz}
                isCaptured={isCaptured}
                isNext={isNext}
                isNarrating={isNarrating}
                capturing={capturing}
                tickets={progress.tickets}
                onToggle={() => toggleOpen(c)}
                onNarrate={() => void startNarration(c)}
                onCapture={() => void capture(c.id)}
              />
            </ClayCard>
          );
        })}
      </div>

      {progress.allDone && <StoryAllDone total={progress.total} />}

      {justCaught && <CaptureMoment data={justCaught} onClose={() => setJustCaught(null)} />}
    </div>
  );
}
