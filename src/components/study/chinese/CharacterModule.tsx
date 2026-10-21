'use client';

// ⚠️ 直接从具体子模块导入，不要走 `@/lib/study-data` barrel（barrel 的 export *
// 会把全部 ~110KB 数据打进 chunk，见拆分前的 ChineseModules 原注释）。

import { useRef, useState, useEffect } from 'react';
import { CHARACTERS, CHARACTER_CATEGORIES, type CharacterItem } from '@/lib/study-data/characters';
import { speakZh, playTts } from '@/lib/speak';
import { CHARACTER_WORDS } from '@/lib/study-data/character-words';
import { useModuleProgress } from '@/lib/module-progress';
import dynamic from 'next/dynamic';
import { hasStrokes } from '@/components/study/StrokePlayer';
// 笔顺动画（hanzi-writer + 566KB 数据）动态加载，不进识字首屏
const StrokePlayer = dynamic(() => import('@/components/study/StrokePlayer'), { ssr: false });

/* ---------- 识字（按类别，一屏一类） ---------- */
function CharacterCard({
  item,
  done,
  onDone,
}: {
  item: CharacterItem;
  done: boolean;
  onDone: () => void;
}) {
  const [showStrokes, setShowStrokes] = useState(false);
  return (
    <div
      className={`rounded-2xl p-4 shadow-lg border-2 text-center transition ${done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-pink/20'}`}
    >
      <div className="text-xs text-moko-rose/70 font-bold tracking-wide">
        {item.pinyin}
        {item.altPinyin ? (
          <span className="text-moko-purple/80"> · 又读 {item.altPinyin}</span>
        ) : null}
      </div>
      <div className="text-5xl font-black text-moko-rose mb-2">{item.char}</div>
      <div className="text-sm text-gray-600">{item.meaning}</div>
      {/* 📚 组词（③号内容升级 2026-10-21）：字不离词——点词牌单独读该词 */}
      {CHARACTER_WORDS[item.char] && (
        <div className="flex gap-1.5 mt-1.5 flex-wrap justify-center">
          {CHARACTER_WORDS[item.char].map((w) => (
            <button
              key={w}
              onClick={() => void playTts(w, 'zh', { wsRate: 0.7, preferStatic: true })}
              className="text-xs px-2 py-0.5 rounded-full bg-moko-rose/10 text-moko-rose font-black active:scale-95 transition"
            >
              {w}
            </button>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-1">
        {item.strokeCount} 画 · {item.phrase}
      </div>
      <div className="flex gap-1.5 mt-2">
        <button
          onClick={() => {
            const words = CHARACTER_WORDS[item.char];
            if (words && words.length) {
              void playTts(`${item.char}，${words.join('，')}`, 'zh', { wsRate: 0.75, preferStatic: true });
            } else {
              speakZh(`${item.char}，${item.meaning}。${item.phrase}`);
            }
          }}
          className="flex-1 text-xs px-2 py-1 rounded-full bg-moko-pink text-white font-bold"
        >
          🔊 读一读
        </button>
        <button
          onClick={() => hasStrokes(item.char) && setShowStrokes(true)}
          disabled={!hasStrokes(item.char)}
          className="flex-1 text-xs px-2 py-1 rounded-full bg-moko-violet/10 text-moko-violet border-2 border-moko-violet/30 font-bold text-center inline-flex items-center justify-center disabled:opacity-40"
        >
          ✍️ 看笔顺
        </button>
        <button
          onClick={onDone}
          disabled={done}
          className={`flex-1 text-xs px-2 py-1 rounded-full font-bold transition ${done ? 'bg-green-200 text-green-700' : 'bg-moko-pink/10 text-moko-rose border-2 border-moko-pink/30'}`}
        >
          {done ? '✅ 认识啦' : '👆 我认识'}
        </button>
      </div>

      {/* 🖌 笔顺动画遮罩（⑥号升级 2026-10-21）：修复原「看笔顺」死链
          （strokes-order 路由从未存在过）——改为本地逐画动画，299 字全覆盖 */}
      {showStrokes && (
        <StrokePlayer char={item.char} onClose={() => setShowStrokes(false)} />
      )}
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
          <h2 className="text-xl font-black text-moko-rose">
            {CAT_EMOJI[activeCat] ?? CAT_FALLBACK} {activeCat}
          </h2>
          <span className="text-sm font-bold text-gray-400">
            已认识 {doneChars.size}/{items.length}
          </span>
        </div>

        {celebrate === activeCat && (
          <div className="rounded-2xl p-4 bg-green-100 border-2 border-green-400 text-center text-green-700 font-black text-lg fade-up">
            🎉「{activeCat}」全部认完啦！爱心萌可为你开心～
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((c) => (
            <CharacterCard
              key={c.char}
              item={c}
              done={doneChars.has(c.char) || catDone}
              onDone={() => markDone(c.char)}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">
          把每个字点成「我认识」，这一组就完成啦～
        </p>
      </div>
    );
  }

  // —— 分类宫格：选择要学的小类 ——
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/15 text-center">
        <p className="text-gray-600 text-sm">
          字宝宝按<span className="font-black text-moko-rose"> 小分类 </span>
          排队啦！先挑一组，认完这一组再去下一组，
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
                done
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-moko-pink/30 hover:border-moko-rose'
              }`}
            >
              <div className="text-4xl mb-1">{done ? '✅' : (CAT_EMOJI[cat] ?? CAT_FALLBACK)}</div>
              <div className={`font-black ${done ? 'text-green-600' : 'text-moko-rose'}`}>
                {cat}
              </div>
              <div className={`text-xs mt-1 ${done ? 'text-green-500' : 'text-gray-400'}`}>
                {done ? '完成啦' : `${items.length} 个字 · 点开认一认`}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-400 font-bold">
        已认完 {doneCats.size} /{' '}
        {CHARACTER_CATEGORIES.filter((c) => CHARACTERS.some((x) => x.category === c)).length} 组
      </p>
    </div>
  );
}

/* ---------- 古诗 ---------- */
