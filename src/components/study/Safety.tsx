'use client';

import { useMemo, useState } from 'react';
import { SAFETY_TIPS } from '@/lib/study-data';
import { useModuleProgress } from '@/lib/module-progress';
import { speakZh, praise } from '@/lib/speak';
import { useMistakeLogger } from '@/lib/mistake-logger';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 温柔萌可的安全小课堂（综合内容，挂语文模块）
 * 情景 + 做法判断（对/不对），答错由温柔萌可讲解正确做法。
 */
export function SafetyModule() {
  const { record } = useModuleProgress('chinese', 'safety');
  const logM = useMistakeLogger();
  const order = useMemo(() => shuffle(SAFETY_TIPS.map((_, i) => i)), []);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [rightCount, setRightCount] = useState(0);
  const [done, setDone] = useState(false);

  const item = SAFETY_TIPS[order[pos]];

  function pick(v: boolean) {
    if (picked !== null) return;
    setPicked(v);
    if (v === item.isSafe) {
      praise();
      setRightCount((c) => c + 1);
    } else {
      speakZh(item.tip, 0.9);
      logM({
        subject: '语文',
        kind: '安全常识',
        prompt: item.statement,
        answer: item.isSafe ? '对，安全' : '不对，危险',
        wrong: v ? '对，安全' : '不对，危险',
      });
    }
    // 显示提示后自动进入下一题
    setTimeout(() => {
      if (pos + 1 >= order.length) {
        setDone(true);
        record(Math.min(3, Math.ceil((rightCount + (v === item.isSafe ? 1 : 0)) / 4)));
      } else {
        setPicked(null);
        setPos(pos + 1);
      }
    }, 2600);
  }

  function restart() {
    setPos(0);
    setPicked(null);
    setRightCount(0);
    setDone(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-mint to-moko-cyan text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🌸💪</div>
        <h2 className="text-2xl font-black">温柔萌可的安全小课堂</h2>
        <p className="text-sm opacity-90 mt-1">
          温柔萌可：轻轻的，慢慢来～先看看怎么做才安全。 正正萌可：敬礼！安全第一！
        </p>
      </div>

      {done ? (
        <div className="rounded-3xl p-8 bg-white shadow-lg border-2 border-moko-mint/40 text-center">
          <div className="text-5xl mb-2">🌸🎉</div>
          <h3 className="text-xl font-black text-moko-cyan mb-1">安全小卫士，你真棒！</h3>
          <p className="text-gray-500 mb-4">一共答对了 {rightCount} / {SAFETY_TIPS.length} 题</p>
          <button
            onClick={restart}
            className="px-6 py-2.5 rounded-full bg-moko-mint text-white font-black shadow active:scale-95 transition"
          >
            🔄 再来一轮
          </button>
        </div>
      ) : (
        <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-mint/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400">
              {item.emoji} <span className="text-gray-600">{item.scenario}</span>
            </span>
            <span className="text-xs font-bold text-moko-mint">
              {pos + 1} / {order.length}
            </span>
          </div>
          <p className="text-lg font-black text-gray-700 mb-4">{item.statement}</p>
          <p className="text-sm text-gray-400 mb-3">这个做法安全吗？</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => pick(true)}
              disabled={picked !== null}
              className={`py-3 rounded-2xl font-black text-lg transition ${
                picked === true
                  ? item.isSafe
                    ? 'bg-green-400 text-white shadow scale-[1.02]'
                    : 'bg-red-300 text-white'
                  : 'bg-moko-mint/15 text-moko-mint border-2 border-moko-mint/40 active:scale-95'
              }`}
            >
              ✅ 对，安全
            </button>
            <button
              onClick={() => pick(false)}
              disabled={picked !== null}
              className={`py-3 rounded-2xl font-black text-lg transition ${
                picked === false
                  ? !item.isSafe
                    ? 'bg-green-400 text-white shadow scale-[1.02]'
                    : 'bg-red-300 text-white'
                  : 'bg-red-50 text-red-400 border-2 border-red-200 active:scale-95'
              }`}
            >
              ❌ 不对，危险
            </button>
          </div>
          {picked !== null && (
            <div className="mt-4 rounded-2xl bg-moko-mint/10 p-3 text-sm">
              <p className="font-bold text-moko-cyan">🌸 温柔萌可说：</p>
              <p className="text-gray-600">{item.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}