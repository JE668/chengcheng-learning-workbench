'use client';

/**
 * ⚡ 口算达人（2026-10-19 ②号升级）
 *
 * 60 秒限时口算挑战：正确率 × 速度双维度计分。
 * - 三档难度（GameShell level）：10 以内加法 → 20 以内加减 → 50 以内加减/乘法口诀
 * - 每题答对 +10 分，连对有 combo 加成（+2/连击，封顶 +30）
 * - 答错不扣分但断 combo，且该题保留到队尾再出（直到答对为止——口算
 *   要的是自动化，错了就当场学会）
 * - 触觉/音效反馈与全站一致：sfxCorrect/sfxWrong + navigator.vibrate
 * - 结束走 GameShell 的 onFinish(score) → 现有防刷分链路（白名单 + 每日一次）
 *
 * 计分上限说明：60 秒 × 极限 3 秒/题 ≈ 20 题 × (10+2) ≈ 240 分，远低于
 * game-complete 的 MAX_GAME_SCORE=500，正常游玩不会触发截断。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfxCorrect, sfxWrong } from '@/lib/sfx';
import { speakZh } from '@/lib/speak';

interface OralQuestion {
  prompt: string;
  answer: number;
}

/** 按难度档生成一题（level: 0/1/2） */
function genQ(level: number): OralQuestion {
  const ri = (n: number) => Math.floor(Math.random() * n);
  if (level === 0) {
    // 10 以内加法
    const a = 1 + ri(9);
    const b = 1 + ri(9);
    return { prompt: `${a} + ${b}`, answer: a + b };
  }
  if (level === 1) {
    // 20 以内加减（结果恒非负）
    const a = 5 + ri(15);
    if (Math.random() < 0.5) {
      const b = 1 + ri(Math.min(9, 20 - a));
      return { prompt: `${a} + ${b}`, answer: a + b };
    }
    const b = 1 + ri(a - 1);
    return { prompt: `${a} - ${b}`, answer: a - b };
  }
  // level 2：50 以内加减 + 乘法口诀混合
  if (Math.random() < 0.4) {
    const a = 2 + ri(8);
    const b = 2 + ri(8);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }
  const a = 10 + ri(40);
  if (Math.random() < 0.5) {
    const b = 5 + ri(20);
    return { prompt: `${a} + ${b}`, answer: a + b };
  }
  const b = 1 + ri(a - 5);
  return { prompt: `${a} - ${b}`, answer: a - b };
}

/** 数字键盘 0-9 + 退格。口算达人只输入非负整数答案。 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '退', '0', '✓'];

export default function OralMaster({ onFinish, level = 0 }: { onFinish: (score: number) => void; level?: number }) {
  const TOTAL_SECONDS = 60;
  const [phase, setPhase] = useState<'ready' | 'run' | 'over'>('ready');
  const [left, setLeft] = useState(TOTAL_SECONDS);
  const [q, setQ] = useState<OralQuestion | null>(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const finishedRef = useRef(false);
  const pendingRef = useRef<OralQuestion[]>([]); // 答错的题，队尾重出

  const total = correctCount + wrongCount;

  /** 结束：只报一次分（防重复触发） */
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('over');
    onFinish(score);
  }, [onFinish, score]);

  /** 倒计时（run 阶段才走） */
  useEffect(() => {
    if (phase !== 'run') return;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  /** 出下一题：优先重出答错的（学当场的），否则新生成 */
  const nextQ = useCallback(() => {
    if (pendingRef.current.length > 0) {
      setQ(pendingRef.current.shift()!);
    } else {
      setQ(genQ(level));
    }
    setInput('');
  }, [level]);

  const start = () => {
    finishedRef.current = false;
    pendingRef.current = [];
    setScore(0);
    setCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLeft(TOTAL_SECONDS);
    setPhase('run');
    setQ(genQ(level));
    setInput('');
  };

  const submit = useCallback(() => {
    if (phase !== 'run' || !q || input === '') return;
    const val = Number(input);
    if (Number.isNaN(val)) return;
    if (val === q.answer) {
      const gained = 10 + Math.min(30, combo * 2);
      setScore((s) => s + gained);
      setCombo((c) => c + 1);
      setCorrectCount((c) => c + 1);
      setFlash('ok');
      sfxCorrect();
      try {
        navigator.vibrate?.(30);
      } catch {}
      nextQ();
    } else {
      // 答错：断 combo，题回队尾，当场重学会
      setCombo(0);
      setWrongCount((w) => w + 1);
      setFlash('bad');
      sfxWrong();
      try {
        navigator.vibrate?.([40, 40, 40]);
      } catch {}
      pendingRef.current.push(q);
      nextQ();
    }
    setTimeout(() => setFlash(null), 240);
  }, [phase, q, input, combo, nextQ]);

  const press = (k: string) => {
    if (phase !== 'run') return;
    if (k === '退') {
      setInput((s) => s.slice(0, -1));
      return;
    }
    if (k === '✓') {
      submit();
      return;
    }
    // 最多 4 位数（50×9=450，口算范围足够）
    setInput((s) => (s.length >= 4 ? s : s + k));
  };

  /** 达人星级（结束页展示）：正确率 × 速度双维度 */
  const stars = useMemo(() => {
    if (total < 5) return 0; // 题量太少不评星
    const acc = correctCount / total;
    const speed = correctCount / TOTAL_SECONDS; // 题/秒
    const composite = acc * 0.6 + Math.min(1, speed / 0.3) * 0.4;
    if (composite >= 0.85) return 3;
    if (composite >= 0.65) return 2;
    if (composite >= 0.4) return 1;
    return 0;
  }, [total, correctCount]);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {phase === 'ready' && (
        <div className="text-center max-w-md">
          <div className="text-6xl mb-3">⚡</div>
          <h3 className="text-2xl font-black text-moko-violet mb-2">口算达人</h3>
          <p className="text-gray-600 mb-1">60 秒限时挑战，答得又快又准就是达人！</p>
          <p className="text-sm text-gray-400 mb-6">
            {level === 0 ? '本档：10 以内加法' : level === 1 ? '本档：20 以内加减' : '本档：50 以内加减 + 乘法口诀'}
            <br />
            连续答对有连击加分，答错的题会再回来找你哦～
          </p>
          <button onClick={start} className="px-8 py-3 rounded-full bg-moko-blue text-white font-black text-lg clay-btn clay-theme clay-blue transition">
            ▶ 开始挑战
          </button>
        </div>
      )}

      {phase === 'run' && (
        <>
          <div className="flex items-center gap-4 w-full max-w-md justify-between">
            <div className={`font-black text-2xl tabular-nums ${left <= 10 ? 'text-red-500' : 'text-moko-violet'}`}>
              ⏱ {left}s
            </div>
            <div className="font-black text-xl text-moko-gold">⭐ {score}</div>
            {combo >= 2 && <div className="font-black text-moko-rose">🔥 连击 ×{combo}</div>}
          </div>
          {/* 进度条：剩余时间可视化（一岁孩子对“条变短”比数字敏感） */}
          <div className="w-full max-w-md h-3 rounded-full bg-moko-purple/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 10 ? 'bg-red-400' : 'bg-moko-blue'}`}
              style={{ width: `${(left / TOTAL_SECONDS) * 100}%` }}
            />
          </div>

          <div
            className={`w-full max-w-md rounded-3xl p-8 text-center transition ${
              flash === 'ok'
                ? 'bg-green-100 scale-[1.02]'
                : flash === 'bad'
                  ? 'bg-red-100 scale-[0.98]'
                  : 'bg-white clay-card'
            }`}
          >
            <div className="text-5xl font-black text-moko-violet tabular-nums">{q?.prompt} = ?</div>
            <div className="mt-4 min-h-16 text-3xl font-black text-gray-700 tabular-nums">
              {input || <span className="text-gray-300">…</span>}
            </div>
          </div>

          {/* 数字键盘：大按键，平板手指友好 */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-md">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className={`py-4 rounded-2xl font-black text-2xl transition active:scale-95 ${
                  k === '✓'
                    ? 'bg-moko-mint text-white'
                    : k === '退'
                      ? 'bg-gray-200 text-gray-600 text-xl'
                      : 'bg-white text-moko-violet clay-card'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'over' && (
        <div className="text-center max-w-md">
          <div className="text-6xl mb-2">{stars === 3 ? '🏆' : stars === 2 ? '🥈' : stars === 1 ? '🥉' : '💪'}</div>
          <h3 className="text-2xl font-black text-moko-violet mb-1">
            {stars === 3 ? '口算大达人！' : stars === 2 ? '很棒的小达人！' : stars === 1 ? '继续加油！' : '多练就会更快！'}
          </h3>
          <div className="text-4xl mb-3">{'⭐'.repeat(Math.max(stars, 0))}</div>
          <div className="flex justify-center gap-6 text-gray-600 font-bold mb-2">
            <span>得分 {score}</span>
            <span>答对 {correctCount}</span>
            <span>正确率 {total > 0 ? Math.round((correctCount / total) * 100) : 0}%</span>
          </div>
          <p className="text-sm text-gray-400 mb-6">积分已自动入账，明天再来刷新纪录吧～</p>
          <button onClick={start} className="px-8 py-3 rounded-full bg-moko-blue text-white font-black text-lg clay-btn clay-theme clay-blue transition">
            🔄 再来一次
          </button>
        </div>
      )}
    </div>
  );
}
