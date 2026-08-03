'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { POEMS, POEM_PICTURE_Q, type PoemItem } from '@/lib/study-data';
import { StudyQuiz, type QuizItem } from './StudyQuiz';
import { useModuleProgress } from '@/lib/module-progress';
import { speakZh, praise } from '@/lib/speak';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 诗中有画 ---------- */
function buildPictureItems(): QuizItem[] {
  return POEM_PICTURE_Q.map((q) => ({
    prompt: (
      <span>
        「{q.hint}」<br />这一句诗讲的是哪一幅画？
      </span>
    ),
    speak: q.hint,
    options: shuffle(q.options),
    answer: q.answer,
    kind: '诗中有画',
  }));
}

/* ---------- 飞花令（简化：找出含某字的诗句） ---------- */
const FEIHUA_KEYWORDS = ['月', '花', '风', '鸟', '山', '水'];
function buildFeihuaItems(): QuizItem[] {
  const allLines = POEMS.flatMap((p) => p.lines);
  const items: QuizItem[] = [];
  for (const kw of FEIHUA_KEYWORDS) {
    const withKw = allLines.filter((l) => l.includes(kw));
    const without = shuffle(allLines.filter((l) => !l.includes(kw)));
    if (withKw.length === 0) continue;
    withKw.slice(0, 3).forEach((correct) => {
      const distractors = without.slice(0, 3);
      items.push({
        prompt: (
          <span>
            哪句诗里有「<b className="text-moko-rose">{kw}</b>」字？
          </span>
        ),
        speak: `哪句诗里有${kw}字`,
        options: shuffle([correct, ...distractors]),
        answer: correct,
        kind: '飞花令',
      });
    });
  }
  return items;
}

/* ---------- 诗句排序 ---------- */
function LineOrder() {
  const { record } = useModuleProgress('chinese', 'poem-fun');
  const correctRef = useRef(0);
  const [poem, setPoem] = useState<PoemItem>(() => POEMS[Math.floor(Math.random() * POEMS.length)]);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const scrambled = useMemo(() => shuffle(poem.lines.map((_, i) => i)), [poem]);

  function tapLine(origIdx: number) {
    if (result !== 'idle') return;
    if (selected.includes(origIdx)) return;
    setSelected((s) => [...s, origIdx]);
  }
  function tapSelected(pos: number) {
    if (result !== 'idle') return;
    setSelected((s) => s.filter((_, i) => i !== pos));
  }
  function check() {
    const made = selected.map((i) => poem.lines[i]).join('');
    const target = poem.lines.join('');
    const ok = made === target;
    setResult(ok ? 'right' : 'wrong');
    if (ok) {
      speakZh(target);
      praise();
      correctRef.current += 1;
      record(Math.min(3, Math.ceil(correctRef.current / 2)));
      setTimeout(() => {
        setResult('idle');
        setSelected([]);
        setPoem(POEMS[Math.floor(Math.random() * POEMS.length)]);
      }, 1600);
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
      <p className="text-gray-600 mb-1">🔢 把诗句按正确的顺序点出来，连成一首完整的诗！</p>
      <p className="text-xs text-moko-violet font-bold mb-3">《{poem.title}》· {poem.author}</p>
      <div className="min-h-[64px] rounded-2xl bg-moko-pink/10 border-2 border-dashed border-moko-pink/40 p-3 flex flex-col gap-1 justify-center">
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm text-center">点下面的诗句，排到这里～</span>
        ) : (
          selected.map((origIdx, pos) => (
            <button
              key={pos}
              onClick={() => tapSelected(pos)}
              className="text-left px-3 py-1.5 rounded-xl bg-moko-rose text-white font-medium shadow active:scale-95 transition"
            >
              {poem.lines[origIdx]}
            </button>
          ))
        )}
      </div>
      <div className="grid gap-2 mt-4">
        {scrambled.map((origIdx) => {
          const used = selected.includes(origIdx);
          return (
            <button
              key={origIdx}
              disabled={used || result !== 'idle'}
              onClick={() => tapLine(origIdx)}
              className={`py-2.5 rounded-xl font-medium shadow active:scale-95 transition ${
                used ? 'bg-gray-100 text-gray-300' : 'bg-white text-moko-violet border-2 border-moko-violet'
              }`}
            >
              {poem.lines[origIdx]}
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
          {result === 'right' ? '🎉 排对啦，真会读诗！' : '💡 顺序还不对，再试试～'}
        </p>
      )}
    </div>
  );
}

/* ---------- 父组件：三个标签页 ---------- */
type Tab = 'picture' | 'order' | 'feihua';
const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'picture', label: '诗中有画', emoji: '🖼️' },
  { key: 'order', label: '诗句排序', emoji: '🔢' },
  { key: 'feihua', label: '飞花令', emoji: '🌸' },
];

export function PoemFunModule() {
  const [tab, setTab] = useState<Tab>('picture');
  const pictureItems = useMemo(buildPictureItems, []);
  const feihuaItems = useMemo(buildFeihuaItems, []);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-purple to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🌙✨</div>
        <h2 className="text-2xl font-black">古诗趣味游乐场</h2>
        <p className="text-sm opacity-90 mt-1">希望萌可：古诗也能很好玩 —— 配画、排序、飞花令，样样都行！</p>
      </div>

      <div className="flex gap-2 justify-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full font-bold text-sm active:scale-95 transition ${
              tab === t.key ? 'bg-moko-violet text-white shadow' : 'bg-white text-moko-violet border-2 border-moko-violet/30'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === 'picture' && (
        <StudyQuiz items={pictureItems} subject="语文" color="bg-moko-purple" textColor="text-moko-purple" autoSpeak="zh" moduleKey="poem-fun" roundSize={6} />
      )}
      {tab === 'order' && <LineOrder />}
      {tab === 'feihua' && (
        <StudyQuiz items={feihuaItems} subject="语文" color="bg-moko-purple" textColor="text-moko-purple" autoSpeak="zh" moduleKey="poem-fun" roundSize={8} />
      )}
    </div>
  );
}
