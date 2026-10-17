'use client';

import { useRef, useState, useMemo } from 'react';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SENTENCE_BUILD: { words: string[]; answer: string }[] = [
  // 简单句（3-4 词）
  { words: ['我', '爱', '妈妈'], answer: '我爱妈妈' },
  { words: ['天上', '有', '小鸟'], answer: '天上有小鸟' },
  { words: ['我', '是', '小学生'], answer: '我是小学生' },
  { words: ['弟弟', '在', '看书'], answer: '弟弟在看书' },
  { words: ['花儿', '真', '美丽'], answer: '花儿真美丽' },
  { words: ['我们', '去', '上学'], answer: '我们去上学' },
  // 稍长句（4-5 词）
  { words: ['小明', '喜欢', '吃', '苹果'], answer: '小明喜欢吃苹果' },
  { words: ['今天', '天气', '真', '好'], answer: '今天天气真好' },
  { words: ['小鸟', '在', '树上', '唱歌'], answer: '小鸟在树上唱歌' },
  { words: ['爸爸', '带', '我', '去', '公园'], answer: '爸爸带我去公园' },
  { words: ['妹妹', '正在', '画', '画'], answer: '妹妹正在画画' },
  { words: ['我们', '一起', '做', '游戏'], answer: '我们一起做游戏' },
  // 生活常用句
  // ⚠️ 原为 words: ['早上','好','老师'] / answer: '早上好老师'。
  // 中文更自然的语序是「老师早上好」—— 孩子按自然语序排反被判错。已改正。
  { words: ['老师', '早上', '好'], answer: '老师早上好' },
  { words: ['谢谢', '你', '的', '帮助'], answer: '谢谢你的帮助' },
  { words: ['请', '借', '我', '一支', '笔'], answer: '请借我一支笔' },
  { words: ['我', '想', '喝', '水'], answer: '我想喝水' },
  { words: ['放学', '了', '我们', '回家'], answer: '放学了我们回家' },
  // 观察句
  { words: ['大树', '长', '得', '真', '高'], answer: '大树长得真高' },
  { words: ['小河', '里', '的', '水', '清'], answer: '小河里的水清' },
  { words: ['云朵', '像', '棉花', '糖'], answer: '云朵像棉花糖' },
];

export function SentenceBuildModule() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const { record } = useModuleProgress('chinese', 'sentence');
  const correctRef = useRef(0);
  const s = SENTENCE_BUILD[idx % SENTENCE_BUILD.length];
  const scrambled = useMemo(() => shuffle(s.words.map((_, i) => i)), [s.words]); // 下标打乱

  function tapWord(originalIndex: number) {
    if (result !== 'idle') return;
    if (selected.includes(originalIndex)) return;
    setSelected((arr) => [...arr, originalIndex]);
  }
  function tapSelected(pos: number) {
    if (result !== 'idle') return;
    setSelected((arr) => arr.filter((_, i) => i !== pos));
  }
  function check() {
    const made = selected.map((i) => s.words[i]).join('');
    const ok = made === s.answer;
    setResult(ok ? 'right' : 'wrong');
    if (ok) {
      speakZh(s.answer);
      praise();
      correctRef.current += 1;
      record(Math.min(3, Math.ceil(correctRef.current / 2)));
      setTimeout(() => {
        setResult('idle');
        setSelected([]);
        setIdx((i) => i + 1);
      }, 1500);
    } else {
      speakZh('再排一排，看看顺序对不对～');
      setTimeout(() => {
        setResult('idle');
        setSelected([]);
      }, 1600);
    }
  }

  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-pink/20">
      <p className="text-gray-600 mb-3">🔤 把这些词语按正确顺序点一点，连成一句通顺的话！</p>
      <div className="min-h-[64px] rounded-2xl bg-moko-pink/10 border-2 border-dashed border-moko-pink/40 p-3 flex flex-wrap gap-2 items-center justify-center">
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">点下面的词语，排到这里～</span>
        ) : (
          selected.map((origIdx, pos) => (
            <button
              key={pos}
              onClick={() => tapSelected(pos)}
              className="px-3 py-1 rounded-xl bg-moko-rose text-white font-black text-xl shadow active:scale-95 transition"
            >
              {s.words[origIdx]}
            </button>
          ))
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {scrambled.map((origIdx) => {
          const used = selected.includes(origIdx);
          return (
            <button
              key={origIdx}
              disabled={used || result !== 'idle'}
              onClick={() => tapWord(origIdx)}
              className={`py-3 rounded-xl font-black text-2xl shadow active:scale-95 transition ${
                used
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-white text-moko-rose border-2 border-moko-rose'
              }`}
            >
              {s.words[origIdx]}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center mt-4 gap-3">
        <button
          onClick={() => setSelected([])}
          disabled={result !== 'idle'}
          className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition"
        >
          🧼 重排
        </button>
        <button
          onClick={check}
          disabled={selected.length === 0 || result !== 'idle'}
          className="px-6 py-2 rounded-full bg-moko-pink text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
        >
          ✅ 检查
        </button>
      </div>
      {result !== 'idle' && (
        <p
          className={`text-center mt-3 font-bold ${result === 'right' ? 'text-green-600' : 'text-red-500'}`}
        >
          {result === 'right' ? `🎉 太棒了：${s.answer}` : '💡 顺序还不对，再试试～'}
        </p>
      )}
    </div>
  );
}

/* ========================================================================
 * 整理书包（上学准备）
 * ===================================================================== */