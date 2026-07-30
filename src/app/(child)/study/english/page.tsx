'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LETTERS, RAZ_AA_WORDS, COLORS_WORDS, BODY_WORDS, type WordItem } from '@/lib/study-data';

function speakEn(text: string, rate = 0.75) {
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  u.pitch = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ---------- 字母卡 ---------- */
function LetterCard({ item }: { item: (typeof LETTERS)[number] }) {
  return (
    <button
      onClick={() => speakEn(`${item.letter}. ${item.word}`)}
      className="rounded-2xl p-4 bg-gradient-to-br from-moko-yellow to-amber-300 text-white shadow-lg text-center active:scale-95 transition"
    >
      <div className="text-4xl font-black">{item.letter}</div>
      <div className="text-2xl mb-1">{item.emoji}</div>
      <div className="text-sm font-bold">{item.word}</div>
    </button>
  );
}

/* ---------- 点读 + 录音复读单词卡 ---------- */
function WordCard({ item }: { item: WordItem }) {
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setRecordUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setRecordUrl(null);
      setTimeout(() => {
        if (mr.state !== 'inactive') mr.stop();
        setRecording(false);
      }, 3000);
    } catch {
      alert('需要麦克风权限才能录音哦，请允许后重试～');
    }
  }

  return (
    <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-yellow/30 text-center">
      <div className="text-5xl mb-2">{item.emoji}</div>
      <div
        onClick={() => speakEn(item.word)}
        className="text-3xl font-black text-moko-violet cursor-pointer hover:scale-105 transition"
      >
        {item.word}
      </div>
      <div className="text-sm text-gray-500 mb-3">{item.cn}</div>
      {item.sentence && (
        <div className="text-xs text-gray-400 mb-3 italic">{item.sentence}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => speakEn(item.word)}
          className="flex-1 py-2 rounded-full bg-moko-yellow text-white font-bold text-sm active:scale-95 transition"
        >
          🔊 点读
        </button>
        <button
          onClick={startRecord}
          disabled={recording}
          className={`flex-1 py-2 rounded-full font-bold text-sm active:scale-95 transition ${
            recording ? 'bg-red-400 text-white' : 'bg-moko-pink text-white'
          }`}
        >
          {recording ? '⏹ 录音中' : '🎙️ 跟读'}
        </button>
      </div>
      {recordUrl && (
        <div className="mt-3">
          <audio src={recordUrl} controls className="w-full h-8" />
          <p className="text-xs text-gray-400 mt-1">听听自己的发音吧～</p>
        </div>
      )}
    </div>
  );
}

export default function EnglishStudyPage() {
  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-yellow mb-2">🔤 英语小天地</h1>
      <p className="text-gray-600 mb-6">和唱唱萌可一起认字母、读单词、RAZ AA 点读录音～</p>

      {/* 字母 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🔠 字母认读</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LETTERS.map((l) => (
            <LetterCard key={l.letter} item={l} />
          ))}
        </div>
      </section>

      {/* RAZ AA 单词 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">📚 RAZ AA 核心词（点读 + 录音）</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {RAZ_AA_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>

      {/* 颜色 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🎨 颜色 Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLORS_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>

      {/* 身体 */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-moko-violet mb-3">🧍 身体 Body</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BODY_WORDS.map((w) => (
            <WordCard key={w.word} item={w} />
          ))}
        </div>
      </section>
    </div>
  );
}
