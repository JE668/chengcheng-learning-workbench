'use client';

import { useState } from 'react';
import { CHAR_TRANSFORMS } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';

export function CharTransformModule() {
  const [idx, setIdx] = useState(0);
  const t = CHAR_TRANSFORMS[idx];
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-rose to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔍✨</div>
        <h2 className="text-2xl font-black">汉字变变变</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可：咦？一个字加一加就变成另一个字啦！真神奇！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-rose/30 text-center">
        <div className="text-5xl mb-2">{t.emoji}</div>
        <div className="text-lg font-bold text-moko-rose mb-3">{t.title}</div>
        <div className="flex items-center justify-center gap-3 mb-4">
          {t.chars.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => speakZh(ch)}
                className="text-5xl font-black text-moko-violet bg-moko-rose/5 rounded-2xl w-20 h-20 flex items-center justify-center hover:bg-moko-rose/15 transition active:scale-95"
              >
                {ch}
              </button>
              {i < t.chars.length - 1 && <span className="text-2xl text-gray-300">→</span>}
            </div>
          ))}
        </div>
        {!showHint ? (
          <button
            onClick={() => setShowHint(true)}
            className="px-4 py-2 rounded-full bg-moko-rose text-white font-bold text-sm shadow active:scale-95 transition"
          >
            🔍 看看发现了什么？
          </button>
        ) : (
          <div className="rounded-2xl p-3 bg-moko-yellow/10 border-2 border-moko-yellow/30 text-sm text-gray-700 fade-up">
            <span className="font-bold text-moko-rose">好奇萌可说：</span>{t.hint}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => { setIdx((i) => (i - 1 + CHAR_TRANSFORMS.length) % CHAR_TRANSFORMS.length); setShowHint(false); }}
          className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition"
        >
          ⬅️ 上一组
        </button>
        <button
          onClick={() => { setIdx((i) => (i + 1) % CHAR_TRANSFORMS.length); setShowHint(false); }}
          className="px-5 py-2 rounded-full bg-moko-rose text-white font-bold text-sm active:scale-95 transition"
        >
          下一组 ➡️
        </button>
      </div>
      <p className="text-center text-xs text-gray-400">第 {idx + 1} / {CHAR_TRANSFORMS.length} 组 · 点每个字认识它，点「看看发现了什么」听好奇萌可的发现！</p>
    </div>
  );
}