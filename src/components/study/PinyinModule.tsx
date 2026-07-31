'use client';

import { useState } from 'react';
import {
  PINYIN_GROUPS,
  PINYIN_HAN,
  PINYIN_TONES,
  applyTone,
  type PinyinItem,
} from '@/lib/study-data';
import { speakPinyin } from '@/lib/speak';

const TONE_SIGNS = ['ˉ', '´', 'ˇ', '`'];

function PinyinCard({ item }: { item: PinyinItem }) {
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
        // 主体点击：读默认代表字（兼容旧行为）
        const han = PINYIN_HAN[item.pinyin];
        if (han) speakPinyin(item.pinyin, item.tone, han);
      }}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-pink to-moko-rose text-white shadow-lg active:scale-95 transition text-center"
    >
      <div className="text-4xl font-black mb-1">{display}</div>
      <div className="text-sm opacity-90">
        {show ? item.examples.join(' · ') : '点我读一读'}
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

export default function PinyinModule() {
  return (
    <div className="space-y-8">
      <p className="text-gray-500 text-sm">
        点一点拼音卡，跟着爱心萌可读出正确的音节～ 带声调的小按钮可以切换听四声哦！
      </p>
      {PINYIN_GROUPS.map((g) => (
        <section key={g.group}>
          <h2 className="text-xl font-black text-moko-violet mb-1">
            🔤 {g.group}
          </h2>
          <p className="text-sm text-gray-400 mb-3">{g.sub}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {g.items.map((p) => (
              <PinyinCard key={p.pinyin} item={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
