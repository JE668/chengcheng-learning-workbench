'use client';

import { useEffect, useRef, useState } from 'react';
import { FINGER_READ } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

const PUNCT = /[，。！？、；：""''《》…—]/;

export function FingerReadModule() {
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { record } = useModuleProgress('chinese', 'finger-read');
  const readCount = useRef(0);

  const text = FINGER_READ[idx % FINGER_READ.length];
  const chars = Array.from(text);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function tapChar(i: number) {
    if (playing) return;
    const c = chars[i];
    if (PUNCT.test(c)) return;
    setActive(i);
    speakZh(c, 0.7);
  }

  function playSentence() {
    if (playing) return;
    clearTimers();
    setPlaying(true);
    setActive(0);
    speakZh(text, 0.7);
    const step = 480;
    chars.forEach((c, i) => {
      const t = setTimeout(() => {
        if (!PUNCT.test(c)) setActive(i);
        if (i === chars.length - 1) {
          const end = setTimeout(() => {
            setActive(-1);
            setPlaying(false);
            readCount.current += 1;
            record(Math.min(3, Math.ceil(readCount.current / 3)));
          }, step);
          timers.current.push(end);
        }
      }, i * step);
      timers.current.push(t);
    });
  }

  function next() {
    clearTimers();
    setPlaying(false);
    setActive(-1);
    setIdx((i) => i + 1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-purple to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">👆📖</div>
        <h2 className="text-2xl font-black">指读小课堂</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：点一个字，听它怎么读；或点「听读」，跟着小手指一起滑过去！</p>
      </div>

      <div className="rounded-3xl p-6 bg-white shadow-xl border-2 border-moko-pink/20 text-center">
        <div className="flex flex-wrap justify-center gap-1 leading-loose text-3xl font-black">
          {chars.map((c, i) => {
            const isPunct = PUNCT.test(c);
            const on = i === active;
            return (
              <span
                key={i}
                onClick={() => tapChar(i)}
                className={`px-1 rounded-lg transition cursor-pointer select-none ${
                  on
                    ? 'bg-moko-rose text-white'
                    : isPunct
                      ? 'text-gray-400'
                      : 'text-gray-700 hover:bg-moko-pink/20'
                }`}
              >
                {c}
              </span>
            );
          })}
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={playSentence}
            disabled={playing}
            className="px-5 py-2 rounded-full bg-moko-rose text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
          >
            🔊 {playing ? '听读中…' : '听读（点我跟读）'}
          </button>
          <button
            onClick={next}
            className="px-5 py-2 rounded-full bg-moko-purple/10 text-moko-purple font-bold text-sm active:scale-95 transition"
          >
            下一句 ›
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">点字会单独读，标点符号不发声；「听读」会一句一句带你读。</p>
      </div>
    </div>
  );
}
