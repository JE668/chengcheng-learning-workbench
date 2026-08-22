'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  CHARACTERS,
  CHARACTER_CATEGORIES,
  POEMS,
  TEXTBOOK_CHARACTERS,
  TRACE_CHARS,
  textbookCharsUpTo,
  type CharacterItem,
  type PoemItem,
  type TextbookChar,
} from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';
import { useModuleProgress } from '@/lib/module-progress';
import { ModuleStars } from '@/components/study/ModuleStars';

/* ---------- 识字（按类别，一屏一类） ---------- */
function CharacterCard({ item, done, onDone }: { item: CharacterItem; done: boolean; onDone: () => void }) {
  return (
    <div className={`rounded-2xl p-4 shadow-lg border-2 text-center transition ${done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-pink/20'}`}>
      <div className="text-xs text-moko-rose/70 font-bold tracking-wide">{item.pinyin}{item.altPinyin ? <span className="text-moko-purple/80"> · 又读 {item.altPinyin}</span> : null}</div>
      <div className="text-5xl font-black text-moko-rose mb-2">{item.char}</div>
      <div className="text-sm text-gray-600">{item.meaning}</div>
      <div className="text-xs text-gray-400 mt-1">{item.strokeCount} 画 · {item.phrase}</div>
      <div className="flex gap-1.5 mt-2">
        <button
          onClick={() => speakZh(`${item.char}，${item.meaning}。${item.phrase}`)}
          className="flex-1 text-xs px-2 py-1 rounded-full bg-moko-pink text-white font-bold"
        >
          🔊 读一读
        </button>
        <Link
          href="/study/chinese/strokes-order"
          className="flex-1 text-xs px-2 py-1 rounded-full bg-moko-violet/10 text-moko-violet border-2 border-moko-violet/30 font-bold text-center inline-flex items-center justify-center"
        >
          ✍️ 看笔顺
        </Link>
        <button
          onClick={onDone}
          disabled={done}
          className={`flex-1 text-xs px-2 py-1 rounded-full font-bold transition ${done ? 'bg-green-200 text-green-700' : 'bg-moko-pink/10 text-moko-rose border-2 border-moko-pink/30'}`}
        >
          {done ? '✅ 认识啦' : '👆 我认识'}
        </button>
      </div>
    </div>
  );
}

/** 分类 emoji（与 CHARACTER_CATEGORIES 顺序一致） */
const CAT_EMOJI: Record<string, string> = {
  数字: '🔢',
  自然: '🌿',
  人体: '👤',
  家庭: '🏠',
  方位: '🧭',
  动作: '🤸',
  颜色: '🎨',
  动物: '🐾',
  植物: '🌱',
  物品: '📦',
};
const CAT_FALLBACK = '✏️';

/** 识字按分类完成数 → 星数：3 类 1 星、6 类 2 星、全 10 类 3 星 */
function starsForCats(doneCount: number): number {
  if (doneCount >= 10) return 3;
  if (doneCount >= 6) return 2;
  if (doneCount >= 3) return 1;
  return 0;
}

export function CharacterModule() {
  const { record } = useModuleProgress('chinese', 'characters');
  const [activeCat, setActiveCat] = useState<string | null>(null); // 当前打开的分类
  const [doneCats, setDoneCats] = useState<Set<string>>(new Set());
  const [doneChars, setDoneChars] = useState<Set<string>>(new Set()); // 当前分类已认识的字
  const [celebrate, setCelebrate] = useState<string | null>(null); // 刚完成的分类名

  // 每完成一个分类记录一次星（取历史最佳，不会掉）
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCats.size === prevDone.current) return;
    prevDone.current = doneCats.size;
    if (doneCats.size > 0) record(starsForCats(doneCats.size));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCats.size]);

  // 切换分类时重置「已认识」
  useEffect(() => {
    setDoneChars(new Set());
    setCelebrate(null);
  }, [activeCat]);

  function enterCat(cat: string) {
    setActiveCat(cat);
  }

  function markDone(char: string) {
    if (!activeCat) return;
    setDoneChars((s) => new Set(s).add(char));
  }

  // 当前分类全部认完 → 标记分类完成，稍候自动返回
  useEffect(() => {
    if (!activeCat) return;
    const items = CHARACTERS.filter((c) => c.category === activeCat);
    if (items.length > 0 && doneChars.size >= items.length && !doneCats.has(activeCat)) {
      setDoneCats((s) => new Set(s).add(activeCat));
      setCelebrate(activeCat);
      const timer = setTimeout(() => setActiveCat(null), 1800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneChars.size, activeCat]);

  // —— 分类详情页：一次只看一个分类的字 ——
  if (activeCat) {
    const items = CHARACTERS.filter((c) => c.category === activeCat);
    const catDone = doneCats.has(activeCat);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveCat(null)}
            className="px-3 py-1.5 rounded-full bg-white text-moko-rose font-bold text-sm shadow border-2 border-moko-rose/20 active:scale-95 transition"
          >
            ‹ 返回分类
          </button>
          <h2 className="text-xl font-black text-moko-rose">{CAT_EMOJI[activeCat] ?? CAT_FALLBACK} {activeCat}</h2>
          <span className="text-sm font-bold text-gray-400">已认识 {doneChars.size}/{items.length}</span>
        </div>

        {celebrate === activeCat && (
          <div className="rounded-2xl p-4 bg-green-100 border-2 border-green-400 text-center text-green-700 font-black text-lg fade-up">
            🎉「{activeCat}」全部认完啦！爱心萌可为你开心～
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((c) => (
            <CharacterCard key={c.char} item={c} done={doneChars.has(c.char) || catDone} onDone={() => markDone(c.char)} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">把每个字点成「我认识」，这一组就完成啦～</p>
      </div>
    );
  }

  // —— 分类宫格：选择要学的小类 ——
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/15 text-center">
        <p className="text-gray-600 text-sm">
          字宝宝按<span className="font-black text-moko-rose"> 小分类 </span>排队啦！先挑一组，认完这一组再去下一组，
          <span className="font-bold text-moko-rose">认满 3 组就拿 1 颗⭐</span>，全认完 3 颗星！
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CHARACTER_CATEGORIES.map((cat) => {
          const items = CHARACTERS.filter((c) => c.category === cat);
          if (!items.length) return null;
          const done = doneCats.has(cat);
          return (
            <button
              key={cat}
              onClick={() => enterCat(cat)}
              className={`rounded-3xl p-4 text-center shadow-lg border-2 active:scale-95 transition ${
                done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-pink/30 hover:border-moko-rose'
              }`}
            >
              <div className="text-4xl mb-1">{done ? '✅' : CAT_EMOJI[cat] ?? CAT_FALLBACK}</div>
              <div className={`font-black ${done ? 'text-green-600' : 'text-moko-rose'}`}>{cat}</div>
              <div className={`text-xs mt-1 ${done ? 'text-green-500' : 'text-gray-400'}`}>{done ? '完成啦' : `${items.length} 个字 · 点开认一认`}</div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-400 font-bold">已认完 {doneCats.size} / {CHARACTER_CATEGORIES.filter((c) => CHARACTERS.some((x) => x.category === c)).length} 组</p>
    </div>
  );
}

/* ---------- 古诗 ---------- */
function PoemCard({ item }: { item: PoemItem }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [reciteScore, setReciteScore] = useState<number | null>(null);
  const [reciteText, setReciteText] = useState('');
  const [micError, setMicError] = useState('');
  // 古诗诵读（poems）关卡进度：背诵打分后记录星数，让孩子在中文城堡看到累计星星
  const { record: recordPoemStars } = useModuleProgress('chinese', 'poems');
  const mrRef = useRef<MediaRecorder | null>(null);
  const srRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string | null>(null);

  /** 我来背诵：
   *  - 用 MediaRecorder 真正录音 → 可「停止」、可「回放」（核心需求）；
   *  - 同时 best-effort 跑 SpeechRecognition 给背诵打分，识别不可用/失败都不影响录音与回放。
   *  原实现只依赖 SpeechRecognition：在 iPad Safari 等环境 rec.start() 可能抛错或 onend 永不
   *  触发，导致「背诵中…」卡死且根本没有回放——本次改为录音为主、识别为辅。 */
  async function startRecite() {
    setMicError('');
    setReciteScore(null);
    setReciteText('');
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // ① 录音（核心：供回放）
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      // 防止意外一直录：最长 60s 自动停止
      timerRef.current = setTimeout(stopRecite, 60000);

      // ② 尽力而为的语音识别打分（失败/不支持都不影响上面的录音与回放）
      const SR =
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          rec.lang = 'zh-CN';
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          rec.onresult = (e: any) => {
            const text = String(e.results[0][0].transcript).replace(/[，。、；：""''！？\s]/g, '');
            setReciteText(text);
            // 取原诗所有汉字
            const target = item.lines.join('').replace(/[，。、；：""''！？\s]/g, '');
            // 计算原诗中有多少字出现在孩子念的内容里
            let hit = 0;
            for (const ch of target) {
              if (text.includes(ch)) hit++;
            }
            const ratio = target.length > 0 ? hit / target.length : 0;
            const score = ratio >= 0.8 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.4 ? 1 : 0;
            setReciteScore(score);
            if (score > 0) recordPoemStars(score);
          };
          rec.onerror = () => {};
          rec.start();
          srRef.current = rec;
        } catch {
          /* 识别不可用则跳过打分 */
        }
      }
    } catch {
      setMicError('需要麦克风权限才能录音哦～请在 https 或 localhost 下访问，并在浏览器弹窗里允许麦克风。');
    }
  }

  function stopRecite() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      mrRef.current?.stop();
    } catch {
      /* ignore */
    }
    try {
      srRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    mrRef.current = null;
    srRef.current = null;
    setRecording(false);
  }

  const stars = reciteScore !== null && reciteScore > 0 ? '⭐'.repeat(reciteScore) + '☆'.repeat(3 - reciteScore) : '';

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-purple/20 to-moko-pink/20 shadow-lg border-2 border-moko-purple/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">{item.title}</h3>
        <span className="text-xs text-gray-500">{item.author}</span>
      </div>
      <p className="text-lg leading-loose text-gray-700 font-medium">
        {item.lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < item.lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={() => speakZh(item.lines.join(''))} className="flex-1 btn btn-violet text-sm">
          🔊 朗读古诗
        </button>
        {recording ? (
          <button
            onClick={stopRecite}
            className="flex-1 py-2 rounded-full font-bold text-sm transition bg-red-500 text-white animate-pulse"
          >
            ⏹ 停止录音
          </button>
        ) : (
          <button
            onClick={startRecite}
            className="flex-1 py-2 rounded-full font-bold text-sm transition bg-moko-rose text-white"
          >
            🎙️ 我来背诵
          </button>
        )}
      </div>
      {micError && <p className="text-xs text-red-400 mt-2">{micError}</p>}
      {audioUrl && (
        <div className="mt-2 rounded-xl bg-white/60 p-2">
          <p className="text-xs text-gray-500 mb-1">▶ 回放我的背诵：</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      {reciteScore !== null && reciteScore > 0 && (
        <div className="mt-2 rounded-xl bg-moko-yellow/10 p-2 text-sm">
          <div className="text-2xl">{stars}</div>
          <p className="text-xs text-gray-500 mt-1">
            {reciteScore >= 3 ? '背得真好！爱心萌可给你点赞！' : reciteScore >= 2 ? '不错，再练几遍更熟！' : '加油，多读几遍再来背！'}
          </p>
        </div>
      )}
    </div>
  );
}

export function PoemModule() {
  const [idx, setIdx] = useState(0);
  const poem = POEMS[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">第 {idx + 1} / {POEMS.length} 首 · 一首一首读，慢慢来</div>
        <ModuleStars subject="chinese" moduleKey="poems" />
      </div>
      <PoemCard key={poem.title} item={poem} />
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIdx((i) => (i - 1 + POEMS.length) % POEMS.length)}
          className="rounded-2xl px-5 py-2 bg-white shadow text-moko-violet font-black hover:scale-105 transition"
        >‹ 上一首</button>
        <button
          onClick={() => setIdx((i) => (i + 1) % POEMS.length)}
          className="rounded-2xl px-5 py-2 bg-moko-purple text-white font-black shadow hover:scale-105 transition"
        >下一首 ›</button>
      </div>
    </div>
  );
}

/* ---------- 描红 Canvas ---------- */
function TracingCard({ char }: { char: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    drawTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  function drawTemplate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#ffe4ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 0);
    ctx.lineTo(rect.width / 2, rect.height);
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.font = 'bold 140px ui-rounded, Hiragino Maru Gothic ProN, sans-serif';
    ctx.fillStyle = 'rgba(255, 93, 160, 0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, rect.width / 2, rect.height / 2 + 8);
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#FF5DA0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  function end() {
    setDrawing(false);
  }
  function clear() {
    drawTemplate();
  }

  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20">
      <div className="text-center text-sm text-gray-500 mb-2">用手指或鼠标跟着写「{char}」</div>
      <canvas
        ref={canvasRef}
        className="w-full h-48 rounded-xl bg-pink-50 touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={clear} className="flex-1 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
          🧼 擦除重练
        </button>
        <button onClick={() => speakZh(char)} className="flex-1 py-2 rounded-full bg-moko-pink text-white font-bold text-sm">
          🔊 读字
        </button>
      </div>
    </div>
  );
}

export function TraceModule() {
  const [traceChar, setTraceChar] = useState('人');
  const traceChars = TRACE_CHARS;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {traceChars.map((c) => (
          <button
            key={c}
            onClick={() => setTraceChar(c)}
            className={`w-10 h-10 rounded-full font-black text-lg transition ${
              traceChar === c ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <TracingCard char={traceChar} />
    </div>
  );
}

/* ---------- 识字闯关（难度自适应） ---------- */
type DiffLevel = 'easy' | 'medium' | 'hard';
const LEVEL_META: Record<DiffLevel, { label: string; emoji: string }> = {
  easy: { label: '入门', emoji: '🌱' },
  medium: { label: '进阶', emoji: '🌿' },
  hard: { label: '挑战', emoji: '🚀' },
};
const LEVEL_ORDER: DiffLevel[] = ['easy', 'medium', 'hard'];

/**
 * 题库跟着课本生字表走（与识字课文、家长听写同源）：
 * 入门只考前两单元（天地人 / 数字 / 自然 / 人体），进阶到第七单元，挑战覆盖全册。
 */
const LEVEL_POOL: Record<DiffLevel, TextbookChar[]> = {
  easy: textbookCharsUpTo(2),
  medium: textbookCharsUpTo(7),
  hard: TEXTBOOK_CHARACTERS,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CharQ {
  mode: 'char2mean' | 'mean2char';
  target: TextbookChar;
  options: string[];
  answer: string;
}

function buildQuestion(level: DiffLevel): CharQ {
  const pool = LEVEL_POOL[level];
  const target = pool[Math.floor(Math.random() * pool.length)];
  if (level === 'hard') {
    const distractors = shuffle(pool.filter((c) => c.char !== target.char))
      .slice(0, 3)
      .map((c) => c.char);
    return { mode: 'mean2char', target, options: shuffle([target.char, ...distractors]), answer: target.char };
  }
  // 释义可能撞车（比如两个字都写「小孩」），撞车的选项会让孩子答对被判错，先过滤掉
  const distractors = shuffle(pool.filter((c) => c.meaning !== target.meaning))
    .slice(0, 3)
    .map((c) => c.meaning);
  return { mode: 'char2mean', target, options: shuffle([target.meaning, ...distractors]), answer: target.meaning };
}

export function CharacterQuizModule() {
  const { record } = useModuleProgress('chinese', 'quiz');
  const [level, setLevel] = useState<DiffLevel>('easy');
  const [q, setQ] = useState<CharQ>(() => buildQuestion('easy'));
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState({ right: 0, wrong: 0 });
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const logM = useMistakeLogger();

  useEffect(() => {
    const saved = localStorage.getItem('chineseDiffLevel') as DiffLevel | null;
    if (saved && LEVEL_ORDER.includes(saved)) {
      setLevel(saved);
      setQ(buildQuestion(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chineseDiffLevel', level);
  }, [level]);

  function nextRound(newLevel: DiffLevel) {
    setLevel(newLevel);
    setPicked(null);
    setQ(buildQuestion(newLevel));
  }

  // 换题时自动朗读：char2mean 读「字 + 拼音」，mean2char 读「哪个字是这个意思」
  useEffect(() => {
    if (q.mode === 'char2mean') {
      speakZh(`${q.target.char}，${q.target.meaning}`);
    } else {
      speakZh(`哪个字的意思是「${q.target.meaning}」？`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.mode, q.target.char, q.target.meaning]);

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const ok = opt === q.answer;
    speakZh(ok ? '答对啦！' : `不对哦，${q.target.char} 是 ${q.target.meaning}`);
    const newCorrect = totalCorrect + (ok ? 1 : 0);
    const newAnswered = totalAnswered + 1;
    setTotalCorrect(newCorrect);
    setTotalAnswered(newAnswered);
    // 每答 8 题结算一次星（做够就至少 1 星，≥70% 给 2 星，≥90% 给 3 星）
    if (newAnswered >= 8 && newAnswered % 8 === 0) {
      const acc = newCorrect / newAnswered;
      const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      record(stars);
    }
    let nl = level;
    if (ok) {
      const nr = streak.right + 1;
      setStreak({ right: nr, wrong: 0 });
      if (nr >= 3 && level !== 'hard') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
    } else {
      const nw = streak.wrong + 1;
      setStreak({ right: 0, wrong: nw });
      if (nw >= 2 && level !== 'easy') nl = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1];
      logM({
        subject: '语文',
        kind: '识字',
        prompt: `${q.target.char} 是什么意思？`,
        answer: q.target.meaning,
        wrong: opt,
        chapter: q.target.unit, // 带上课本单元，家长端错题本能看出是哪一单元没过关
      });
    }
    setTimeout(() => nextRound(nl), ok ? 1400 : 1700);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold bg-white/25 rounded-full px-3 py-1">难度：{meta.emoji} {meta.label}</span>
        <span className="text-xs opacity-90">连对 {streak.right} · 自动调整中</span>
      </div>
      <div className="text-center mb-4">
        {q.mode === 'char2mean' ? (
          <>
            <div className="text-sm font-bold opacity-90">{q.target.pinyin}{q.target.altPinyin ? <span className="opacity-75"> · 又读 {q.target.altPinyin}</span> : null}</div>
            <div className="text-6xl font-black mb-1">{q.target.char}</div>
            <button
              onClick={() => speakZh(q.target.char)}
              className="text-xs px-3 py-1 rounded-full bg-white/30 font-bold active:scale-95 transition"
            >
              🔊 读一读
            </button>
            <div className="text-sm mt-2 opacity-95">这个字是什么意思？</div>
          </>
        ) : (
          <div className="text-base font-bold">哪个字的意思是「{q.target.meaning}」？</div>
        )}
        <div className="text-[11px] mt-2 opacity-80">
          课本第 {q.target.chapter} 单元 · {q.target.unit}
        </div>
      </div>
      <div className={`grid gap-2 ${q.mode === 'mean2char' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          let cls = 'bg-white text-moko-rose border-2 border-moko-rose';
          if (picked) {
            if (isAnswer) cls = 'bg-green-100 text-green-700 border-2 border-green-500';
            else if (isPicked) cls = 'bg-red-100 text-red-600 border-2 border-red-500';
            else cls = 'bg-white text-moko-rose border-2 border-moko-rose opacity-60';
          }
          return (
            <button
              key={opt}
              disabled={!!picked}
              onClick={() => choose(opt)}
              className={`py-3 rounded-xl font-black shadow active:scale-95 transition disabled:cursor-default ${
                q.mode === 'mean2char' ? 'text-3xl' : 'text-lg'
              } ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
