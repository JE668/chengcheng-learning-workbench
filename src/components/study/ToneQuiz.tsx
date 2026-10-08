'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { TONE_ITEMS } from '@/lib/study-data/pinyin';

import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function ToneModule() {
  const { record } = useModuleProgress('chinese', 'tone-quiz');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const item = TONE_ITEMS[idx];
  const prevStreak = useRef(0);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (streak >= 3) record(1);
    if (streak >= 6) record(2);
    if (streak >= 10) record(3);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // 生成打乱后的选项
  //
  // ⚠️ 必须用 useMemo 缓存，不能在渲染函数体内直接 sort(() => Math.random())。
  // 原写法下，`select()` 里的 setSelected(i) 会触发重渲染 → 重新洗牌 →
  // **孩子点击的瞬间选项就换位置了**（高亮项跳位到另一个选项上）；
  // 同时 SSR 首帧与客户端首帧顺序不同，触发 hydration 不匹配。
  //
  // 依赖是 item.label / item.tone（它们由 idx 派生）：换题才会重新洗牌，
  // 同一题内的状态更新（setSelected / setStreak）不影响顺序。
  const options = useMemo(() => {
    const distractors = TONE_ITEMS.filter((t) => t.tone !== item.tone).map((t) => t.label);
    return [item.label, ...distractors].sort(() => Math.random() - 0.5);
  }, [item.label, item.tone]);

  function playTone() {
    speakZh(item.mark);
  }

  function select(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (options[i] === item.label) {
      praise();
      setStreak((s) => s + 1);
    }
  }

  function next() {
    setIdx((i) => (i + 1) % TONE_ITEMS.length);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-pink to-moko-rose text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎵✨</div>
        <h2 className="text-2xl font-black">声调辨别</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：这个拼音是什么声调？听一听，选一选！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-pink/30 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-8xl font-black text-moko-pink">{item.mark}</div>
          <div className="text-4xl">{item.emoji}</div>
        </div>
        <div className="text-lg font-bold text-gray-500 mb-2">这是什么声调？</div>
        <div className="text-sm text-gray-400 mb-4">例字：{item.example.join('、')}</div>

        <button
          onClick={playTone}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black hover:scale-105 transition mb-4"
        >
          🔊 听声调
        </button>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {options.map((opt, i) => {
            const isCorrect = opt === item.label;
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                disabled={selected !== null}
                className={`rounded-xl px-4 py-3 font-bold text-sm transition ${
                  selected === null
                    ? 'bg-moko-pink/5 hover:bg-moko-pink/15 border border-moko-pink/20'
                    : isCorrect
                      ? 'bg-moko-green text-white border border-moko-green'
                      : isSelected
                        ? 'bg-moko-rose text-white border border-moko-rose'
                        : 'bg-gray-50 border border-gray-100 opacity-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="rounded-xl p-3 bg-gradient-to-r from-moko-yellow/10 to-moko-orange/10 border border-moko-yellow/30 mb-4 text-sm">
            <span className="font-bold">💡 {item.mnemonic}</span>
          </div>
        )}

        <button
          onClick={next}
          className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-moko-cyan to-moko-blue text-white font-black hover:scale-105 transition"
        >
          下一题 →
        </button>
        <div className="mt-2 text-xs text-gray-400">
          连对 <span className="font-bold text-moko-green">{streak}</span> 题 · 进度 {idx + 1}/
          {TONE_ITEMS.length}
        </div>
      </div>
    </div>
  );
}
