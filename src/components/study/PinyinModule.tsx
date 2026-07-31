'use client';

import { useState } from 'react';
import { PINYIN_GROUPS, type PinyinItem } from '@/lib/study-data';
import { speakPinyin } from '@/lib/speak';

/** 从例词里取第一个汉字，用来「代表」这个拼音音节的发音 */
function firstHanChar(s: string): string {
  const m = s.match(/[\u4e00-\u9fff]/);
  return m ? m[0] : '';
}

function PinyinCard({ item }: { item: PinyinItem }) {
  const [show, setShow] = useState(false);
  return (
    <button
      onClick={() => {
        setShow(true);
        // 拼音的拉丁字母会被语音引擎当成英文念；读一个同音汉字（如 bà→爸），
        // 中文神经嗓音就能发出正确的拼音音节与声调。
        const han = firstHanChar(item.examples[0] ?? '');
        speakPinyin(item.pinyin, item.tone, han);
      }}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-pink to-moko-rose text-white shadow-lg active:scale-95 transition text-center"
    >
      <div className="text-4xl font-black mb-1">{item.pinyin}</div>
      <div className="text-sm opacity-90">{show ? item.examples.join(' · ') : '点我读一读'}</div>
    </button>
  );
}

export default function PinyinModule() {
  return (
    <div className="space-y-8">
      <p className="text-gray-500 text-sm">点一点拼音卡，跟着爱心萌可读出正确的音节～</p>
      {PINYIN_GROUPS.map((g) => (
        <section key={g.group}>
          <h2 className="text-xl font-black text-moko-violet mb-1">🔤 {g.group}</h2>
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
