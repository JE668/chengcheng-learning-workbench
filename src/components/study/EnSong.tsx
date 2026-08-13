'use client';

import { useState } from 'react';
import { EN_SONGS, type EnSong } from '@/lib/study-data';
import { useModuleProgress } from '@/lib/module-progress';
import { speakEn, praise } from '@/lib/speak';

/**
 * 唱唱萌可的英文音乐会（英语模块）
 * 跟着唱唱萌可唱英文儿歌，逐行点读、看中文大意、认关键词。
 * 甜心萌可伴舞，唱完一首得星。
 */
export function EnSongModule() {
  const { record } = useModuleProgress('english', 'en-songs');
  const [idx, setIdx] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const song: EnSong = EN_SONGS[idx];

  function readLine(lineIdx: number) {
    speakEn(song.lyrics[lineIdx].replace(/'/g, ''), 0.7);
    setTapped((t) => {
      const n = new Set(t);
      n.add(lineIdx);
      return n;
    });
  }

  /** 唱完整首：逐行朗读英文 */
  function singAll() {
    let delay = 0;
    song.lyrics.forEach((line, i) => {
      setTimeout(() => {
        speakEn(line.replace(/'/g, ''), 0.7);
        setTapped((t) => {
          const n = new Set(t);
          n.add(i);
          return n;
        });
      }, delay);
      delay += 3000;
    });
    setTimeout(() => praise(), delay);
    record(Math.min(3, Math.ceil(idx / 2) + 1));
  }

  function readKeyword(en: string) {
    speakEn(en, 0.7);
  }

  function next() {
    setTapped(new Set());
    setIdx((i) => (i + 1) % EN_SONGS.length);
  }
  function prev() {
    setTapped(new Set());
    setIdx((i) => (i - 1 + EN_SONGS.length) % EN_SONGS.length);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-yellow to-moko-gold text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎵🍬</div>
        <h2 className="text-2xl font-black">唱唱萌可的英文音乐会</h2>
        <p className="text-sm opacity-90 mt-1">
          唱唱萌可：啦啦啦，唱给世界听！ 甜心萌可：甜蜜蜜，跟着唱就学会啦～
        </p>
      </div>

      {/* 歌词卡片 */}
      <div className="rounded-3xl p-5 bg-white shadow-lg border-2 border-moko-yellow/40">
        <div className="text-center mb-3">
          <div className="text-4xl">{song.emoji}</div>
          <h3 className="text-xl font-black text-moko-yellow">{song.title}</h3>
          <p className="text-xs text-gray-400">第 {idx + 1} 首 · 共 {EN_SONGS.length} 首</p>
          <button
            onClick={singAll}
            className="mt-2 px-4 py-1.5 rounded-full bg-moko-yellow text-white font-bold text-sm shadow active:scale-95 transition"
          >
            🎤 唱给我听
          </button>
        </div>

        <div className="rounded-2xl bg-moko-yellow/10 border-2 border-moko-yellow/30 p-4 space-y-2">
          {song.lyrics.map((line, i) => (
            <button
              key={i}
              onClick={() => readLine(i)}
              className={`w-full text-left px-3 py-2 rounded-xl transition font-medium ${
                tapped.has(i)
                  ? 'bg-moko-yellow text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-moko-yellow/20'
              }`}
            >
              {line}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm">
          <p className="font-bold text-moko-yellow mb-1">💬 中文大意：</p>
          <p className="text-gray-600">{song.cn}</p>
        </div>
      </div>

      {/* 关键词 */}
      <div className="rounded-3xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30">
        <p className="font-black text-moko-yellow mb-2">
          🔤 甜心萌可的词卡（点点听发音）
        </p>
        <div className="flex flex-wrap gap-2">
          {song.keywords.map((k) => (
            <button
              key={k.en}
              onClick={() => readKeyword(k.en)}
              className="px-3 py-1.5 rounded-full bg-moko-yellow/15 border-2 border-moko-yellow/40 font-bold text-sm active:scale-95 transition"
            >
              {k.en} <span className="text-gray-500 font-normal">{k.cn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 切换按钮 */}
      <div className="flex justify-center gap-3">
        <button
          onClick={prev}
          className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition"
        >
          ⬅️ 上一首
        </button>
        <button
          onClick={next}
          className="px-5 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
        >
          下一首 ➡️
        </button>
      </div>
      <div className="text-center text-xs text-gray-400">
        点一下歌词，唱唱萌可念给你听～（用系统发音，来一起跟唱吧！）
      </div>
      <div className="text-center text-xs text-gray-300">
        🎤 唱完整首儿歌 + 点一点关键词，就能集齐小星星！
      </div>
    </div>
  );
}