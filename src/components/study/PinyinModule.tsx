'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PINYIN_GROUPS,
  PINYIN_HAN,
  PINYIN_TONES,
  applyTone,
  type PinyinItem,
} from '@/lib/study-data';
import { speakPinyin } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

const TONE_SIGNS = ['ˉ', '´', 'ˇ', '`'];

function PinyinCard({ item, done, onDone }: { item: PinyinItem; done?: boolean; onDone?: () => void }) {
  const [show, setShow] = useState(false);
  const [tone, setTone] = useState<number | null>(null);
  const tones = PINYIN_TONES[item.pinyin];

  const playTone = (t: number) => {
    const han = tones?.[t - 1];
    if (!han) return;
    setTone(t);
    speakPinyin(item.pinyin, t, han);
  };

  const display = tone && tones ? applyTone(item.pinyin, tone) : item.pinyin;

  return (
    <button
      onClick={() => {
        setShow(true);
        // 主体点击：标记认识（若需要）+ 读默认代表字
        onDone?.();
        const han = PINYIN_HAN[item.pinyin];
        if (han) speakPinyin(item.pinyin, item.tone, han);
      }}
      className={`rounded-2xl p-4 shadow-lg active:scale-95 transition text-center ${
        done
          ? 'bg-green-50 border-2 border-green-300'
          : 'bg-gradient-to-br from-moko-pink to-moko-rose text-white'
      }`}
    >
      <div className={`text-4xl font-black mb-1 ${done ? 'text-green-600' : ''}`}>{done ? '✅ ' : ''}{display}</div>
      <div className={`text-sm ${done ? 'text-green-600' : 'opacity-90'}`}>
        {show ? item.examples.join(' · ') : done ? '认识啦！' : '点我读一读'}
      </div>

      {tones && (
        <div
          className="mt-2 grid grid-cols-4 gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {([1, 2, 3, 4] as const).map((t) => {
            const han = tones[t - 1];
            const disabled = !han;
            const active = tone === t;
            return (
              <button
                key={t}
                disabled={disabled}
                onClick={() => playTone(t)}
                title={
                  disabled
                    ? '该声调没有合适的零声母常用字'
                    : `${applyTone(item.pinyin, t)} · ${han}`
                }
                className={
                  'rounded-lg py-1 flex flex-col items-center leading-none ' +
                  (disabled
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : active
                      ? 'bg-white/40 text-white'
                      : done
                        ? 'bg-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-white/15 text-white hover:bg-white/25')
                }
              >
                <span className="text-base">{TONE_SIGNS[t - 1]}</span>
                <span className="text-[10px] mt-0.5 h-3 overflow-hidden">
                  {han || '·'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </button>
  );
}

/** 拼音乐园：分组宫格 → 逐组拼读，一组全部点过即完成（一小类就是一次闯关） */
export default function PinyinModule() {
  const { record } = useModuleProgress('chinese', 'pinyin');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [doneGroups, setDoneGroups] = useState<Set<string>>(new Set());
  const [doneItems, setDoneItems] = useState<Set<string>>(new Set());
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const prevDone = useRef(0);

  // 完成组数 → 星：2 组 1 星、4 组 2 星、全部 3 星（取历史最佳）
  useEffect(() => {
    if (doneGroups.size === prevDone.current) return;
    prevDone.current = doneGroups.size;
    if (doneGroups.size > 0) {
      const stars = doneGroups.size >= PINYIN_GROUPS.length ? 3 : doneGroups.size >= 4 ? 2 : 1;
      record(stars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneGroups.size]);

  // 切换组时重置已认识
  useEffect(() => {
    setDoneItems(new Set());
    setCelebrate(null);
  }, [activeGroup]);

  const activeData = PINYIN_GROUPS.find((g) => g.group === activeGroup) ?? null;

  // 当前组全部点过 → 完成打勾 + 稍候自动返回
  useEffect(() => {
    if (!activeData || doneGroups.has(activeData.group)) return;
    if (activeData.items.length > 0 && doneItems.size >= activeData.items.length) {
      setDoneGroups((s) => new Set(s).add(activeData.group));
      setCelebrate(activeData.group);
      const timer = setTimeout(() => setActiveGroup(null), 1800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneItems.size, activeGroup]);

  // —— 组详情页：一次只看一组拼音 ——
  if (activeData) {
    const groupDone = doneGroups.has(activeData.group);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGroup(null)}
            className="px-3 py-1.5 rounded-full bg-white text-moko-rose font-bold text-sm shadow border-2 border-moko-rose/20 active:scale-95 transition"
          >
            ‹ 返回拼音组
          </button>
          <h2 className="text-xl font-black text-moko-rose">🔤 {activeData.group}</h2>
          <span className="text-sm font-bold text-gray-400">已会 {doneItems.size}/{activeData.items.length}</span>
        </div>
        <p className="text-sm text-gray-400 -mt-2">{activeData.sub}</p>

        {celebrate === activeData.group && (
          <div className="rounded-2xl p-4 bg-green-100 border-2 border-green-400 text-center text-green-700 font-black text-lg fade-up">
            🎉「{activeData.group}」全都学会啦！爱心萌可为你开心～
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {activeData.items.map((p) => (
            <PinyinCard
              key={p.pinyin}
              item={p}
              done={doneItems.has(p.pinyin) || groupDone}
              onDone={() => setDoneItems((s) => new Set(s).add(p.pinyin))}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">把每个拼音点一遍（听读音），这一组就会啦～</p>
      </div>
    );
  }

  // —— 分组宫格：一次挑一组 ——
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-pink/15 text-center">
        <p className="text-gray-600 text-sm">
          拼音按<span className="font-black text-moko-rose"> 小组 </span>排队啦！一组一组学，学会 2 组拿 1 颗⭐，全学会 3 颗星！
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PINYIN_GROUPS.map((g) => {
          const done = doneGroups.has(g.group);
          return (
            <button
              key={g.group}
              onClick={() => setActiveGroup(g.group)}
              className={`rounded-3xl p-4 text-center shadow-lg border-2 active:scale-95 transition ${
                done ? 'bg-green-50 border-green-300' : 'bg-white border-moko-pink/30 hover:border-moko-rose'
              }`}
            >
              <div className="text-4xl mb-1">{done ? '✅' : '🔤'}</div>
              <div className={`font-black ${done ? 'text-green-600' : 'text-moko-rose'}`}>{g.group}</div>
              <div className={`text-xs mt-1 ${done ? 'text-green-500' : 'text-gray-400'}`}>
                {done ? '学会啦' : `${g.items.length} 个 · ${g.sub ?? ''}`}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-400 font-bold">已学会 {doneGroups.size} / {PINYIN_GROUPS.length} 组</p>
    </div>
  );
}