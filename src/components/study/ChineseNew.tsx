'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CHAR_UNIT_OPTIONS,
  PINYIN_BLEND,
  READING_PASSAGES,
  SCHOOL_ITEMS,
  STROKE_ORDER_CHARS,
  strokeOrderByChapter,
  type PinyinBlendItem,
} from '@/lib/study-data';
import { speakZh, speakPinyin, praise } from '@/lib/speak';
import { StudyQuiz, type QuizItem } from './StudyQuiz';
import { useModuleProgress } from '@/lib/module-progress';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========================================================================
 * 拼音拼读（声母 + 单韵母 拼一拼）
 * ===================================================================== */
export function PinyinBlendModule() {
  const [idx, setIdx] = useState(0);
  const b: PinyinBlendItem = PINYIN_BLEND[idx % PINYIN_BLEND.length];

  const quizItems = useMemo<QuizItem[]>(
    () =>
      PINYIN_BLEND.map((x) => {
        const others = shuffle(PINYIN_BLEND.filter((y) => y.syllable !== x.syllable))
          .slice(0, 3)
          .map((y) => y.syllable);
        return {
          prompt: (
            <span>
              <b>{x.sheng}</b> 和 <b>{x.yun}</b> 拼成什么音节？
            </span>
          ),
          options: shuffle([x.syllable, ...others]),
          answer: x.syllable,
          kind: '拼音拼读',
        };
      }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg text-center">
        <p className="text-sm opacity-90 mb-3">把声母和韵母拼在一起，读一读～</p>
        <div className="flex items-center justify-center gap-3 text-4xl font-black">
          <div className="w-20 h-20 rounded-2xl bg-white/25 flex items-center justify-center">{b.sheng}</div>
          <span className="opacity-80">+</span>
          <div className="w-20 h-20 rounded-2xl bg-white/25 flex items-center justify-center">{b.yun}</div>
          <span className="opacity-80">→</span>
          <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-moko-rose">{b.syllable}</div>
        </div>
        <div className="mt-3 text-2xl font-black">
          {b.emoji} 例字：{b.word}
        </div>
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <button
            onClick={() => speakPinyin(b.syllable, 0, b.word)}
            className="px-4 py-2 rounded-full bg-white text-moko-rose font-bold text-sm active:scale-95 transition"
          >
            🔊 听拼读
          </button>
          <button
            onClick={() => speakZh(b.word)}
            className="px-4 py-2 rounded-full bg-white/30 font-bold text-sm active:scale-95 transition"
          >
            🔊 听例字
          </button>
          <button
            onClick={() => setIdx((i) => i - 1 + PINYIN_BLEND.length)}
            className="px-4 py-2 rounded-full bg-white/20 font-bold text-sm active:scale-95 transition"
          >
            ‹ 上一个
          </button>
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="px-4 py-2 rounded-full bg-white/20 font-bold text-sm active:scale-95 transition"
          >
            下一个 ›
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black text-moko-violet mb-2">🎯 拼读小考场</h3>
        <StudyQuiz items={quizItems} subject="语文" color="bg-moko-pink" textColor="text-moko-rose" moduleKey="pinyin-blend" />
      </div>
    </div>
  );
}

/* ========================================================================
 * 笔顺（hanzi-writer 动画演示）
 * ===================================================================== */
function StrokeOrderCard({ item, learned, onLearned }: { item: { char: string; py: string; mean: string }; learned?: boolean; onLearned?: () => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const el = elRef.current;
    import('hanzi-writer').then((mod: any) => {
      const HW = mod.default ?? mod;
      if (!active || !el) return;
      el.innerHTML = '';
      writerRef.current = HW.create(el, item.char, {
        width: 220,
        height: 220,
        padding: 10,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#FF5DA0',
        radicalColor: '#ef4444',
        outlineColor: '#fbcfe8',
      });
    });
    return () => {
      active = false;
      if (el) el.innerHTML = '';
      writerRef.current = null;
    };
  }, [item.char]);

  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/20 text-center">
      <div ref={elRef} className="mx-auto w-[220px] h-[220px]" />
      <div className="text-2xl font-black text-moko-rose mt-1">
        {item.char} <span className="text-sm text-gray-400">{item.py}</span>
      </div>
      <div className="text-sm text-gray-500 mb-3">{item.mean}</div>
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          onClick={() => writerRef.current?.animateCharacter()}
          className="px-3 py-1 rounded-full bg-moko-pink text-white font-bold text-xs active:scale-95 transition"
        >
          ▶️ 写一写
        </button>
        <button
          onClick={() => writerRef.current?.loopCharacterAnimation()}
          className="px-3 py-1 rounded-full bg-moko-rose text-white font-bold text-xs active:scale-95 transition"
        >
          👀 笔顺
        </button>
        <button
          onClick={() => speakZh(item.char)}
          className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-xs active:scale-95 transition"
        >
          🔊 读字
        </button>
        <button
          onClick={() => onLearned?.()}
          className={`px-3 py-1 rounded-full font-bold text-xs active:scale-95 transition ${learned ? 'bg-green-500 text-white' : 'bg-moko-blue/80 text-white'}`}
        >
          {learned ? '✅ 已学会' : '✓ 我会写啦'}
        </button>
      </div>
    </div>
  );
}

export function StrokeOrderModule() {
  const [chapter, setChapter] = useState(0); // 0 = 全册
  const [idx, setIdx] = useState(0);
  const [learned, setLearned] = useState<string[]>([]);
  const { record } = useModuleProgress('chinese', 'strokes-order');
  const chars = useMemo(() => strokeOrderByChapter(chapter), [chapter]);
  const item = chars[idx % chars.length];
  function learn(char: string) {
    if (learned.includes(char)) return;
    const next = [...learned, char];
    setLearned(next);
    record(Math.min(3, Math.ceil(next.length / 7)));
  }
  function pickChapter(c: number) {
    setChapter(c);
    setIdx(0);
  }
  return (
    <div className="space-y-4">
      {/* 按课本单元挑字：和识字课文、家长听写用的是同一份生字表 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => pickChapter(0)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
            chapter === 0 ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose/40'
          }`}
        >
          📚 全册 {STROKE_ORDER_CHARS.length} 字
        </button>
        {CHAR_UNIT_OPTIONS.filter((u) => u.count > 0).map((u) => (
          <button
            key={u.chapter}
            onClick={() => pickChapter(u.chapter)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
              chapter === u.chapter ? 'bg-moko-rose text-white' : 'bg-white text-moko-rose border-2 border-moko-rose/40'
            }`}
          >
            {u.emoji} 第{u.chapter}单元 {u.count}
          </button>
        ))}
      </div>
      <StrokeOrderCard item={item} learned={learned.includes(item.char)} onLearned={() => learn(item.char)} />
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIdx((i) => i - 1 + chars.length)}
          className="px-5 py-2 rounded-full bg-moko-pink/20 text-moko-rose font-bold text-sm active:scale-95 transition"
        >
          ‹ 上一个
        </button>
        <span className="text-xs text-gray-400 font-bold">
          {(idx % chars.length) + 1} / {chars.length}
        </span>
        <button
          onClick={() => setIdx((i) => i + 1)}
          className="px-5 py-2 rounded-full bg-moko-pink/20 text-moko-rose font-bold text-sm active:scale-95 transition"
        >
          下一个 ›
        </button>
      </div>
      <div className="rounded-2xl p-4 bg-white shadow border-2 border-moko-pink/10 text-center text-sm text-gray-500">
        记住每一笔的先后顺序，写字会更漂亮哦～
      </div>
    </div>
  );
}

/* ========================================================================
 * 课文阅读理解
 * ===================================================================== */
export function TextComprehensionModule() {
  const items = useMemo<QuizItem[]>(
    () =>
      READING_PASSAGES.map((p) => ({
        prompt: (
          <div className="space-y-2">
            <div className="text-base bg-moko-purple/5 rounded-xl p-3 text-gray-700 leading-relaxed">📖 {p.passage}</div>
            <div className="font-black text-moko-violet">
              {p.emoji} {p.question}
            </div>
          </div>
        ),
        speak: p.question,
        options: p.options,
        answer: p.answer,
        kind: '阅读理解',
        chapter: p.chapter,
      })),
    [],
  );
  return <StudyQuiz items={items} subject="语文" color="bg-moko-purple" textColor="text-moko-purple" autoSpeak="zh" moduleKey="reading" />;
}

/* ========================================================================
 * 连词成句（造句）
 * ===================================================================== */
const SENTENCE_BUILD: { words: string[]; answer: string }[] = [
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
  { words: ['早上', '好', '老师'], answer: '早上好老师' },
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
                used ? 'bg-gray-100 text-gray-300' : 'bg-white text-moko-rose border-2 border-moko-rose'
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
        <p className={`text-center mt-3 font-bold ${result === 'right' ? 'text-green-600' : 'text-red-500'}`}>
          {result === 'right' ? `🎉 太棒了：${s.answer}` : '💡 顺序还不对，再试试～'}
        </p>
      )}
    </div>
  );
}

/* ========================================================================
 * 整理书包（上学准备）
 * ===================================================================== */
export function SchoolPrepModule() {
  const [choice, setChoice] = useState<Record<string, 'bag' | 'home' | undefined>>({});
  const [checked, setChecked] = useState(false);
  const { record } = useModuleProgress('chinese', 'school-prep');

  function assign(name: string, v: 'bag' | 'home') {
    if (checked) return;
    setChoice((c) => ({ ...c, [name]: v }));
  }
  function allAssigned() {
    return SCHOOL_ITEMS.every((it) => choice[it.name]);
  }
  function check() {
    setChecked(true);
    const correctCount = SCHOOL_ITEMS.filter((it) => choice[it.name] === (it.bring ? 'bag' : 'home')).length;
    record(Math.round((correctCount / SCHOOL_ITEMS.length) * 3));
    const ok = correctCount === SCHOOL_ITEMS.length;
    if (ok) praise();
    else speakZh('再看看，哪些是上学要带的呀？');
  }
  function reset() {
    setChoice({});
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">🎒 明天要上学啦！点一点，把要带的东西放进书包，不用的留在家里。</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SCHOOL_ITEMS.map((it) => {
          const c = choice[it.name];
          const correct = checked && c === (it.bring ? 'bag' : 'home');
          const wrong = checked && c !== (it.bring ? 'bag' : 'home');
          return (
            <div
              key={it.name}
              className={`rounded-2xl p-3 bg-white shadow border-2 text-center ${
                correct ? 'border-green-500' : wrong ? 'border-red-500' : 'border-moko-blue/20'
              }`}
            >
              <div className="text-4xl">{it.emoji}</div>
              <div className="font-black text-moko-blue mb-2">{it.name}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => assign(it.name, 'bag')}
                  disabled={checked}
                  className={`flex-1 py-1 rounded-full text-xs font-bold active:scale-95 transition ${
                    c === 'bag' ? 'bg-moko-blue text-white' : 'bg-moko-blue/10 text-moko-blue'
                  }`}
                >
                  🎒 书包
                </button>
                <button
                  onClick={() => assign(it.name, 'home')}
                  disabled={checked}
                  className={`flex-1 py-1 rounded-full text-xs font-bold active:scale-95 transition ${
                    c === 'home' ? 'bg-moko-pink text-white' : 'bg-moko-pink/10 text-moko-pink'
                  }`}
                >
                  🏠 家里
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-3">
        {!checked ? (
          <button
            onClick={check}
            disabled={!allAssigned()}
            className="px-6 py-2 rounded-full bg-moko-blue text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
          >
            ✅ 检查一下
          </button>
        ) : (
          <button
            onClick={reset}
            className="px-6 py-2 rounded-full bg-moko-blue/10 text-moko-blue font-bold text-sm active:scale-95 transition"
          >
            🔄 再整理一次
          </button>
        )}
      </div>
      {checked && (
        <p
          className={`text-center font-bold ${
            SCHOOL_ITEMS.every((it) => choice[it.name] === (it.bring ? 'bag' : 'home')) ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {SCHOOL_ITEMS.every((it) => choice[it.name] === (it.bring ? 'bag' : 'home'))
            ? '🎉 整理得真好，准备上学啦！'
            : '💡 有些放错啦，红框的是要调整的～'}
        </p>
      )}
    </div>
  );
}
