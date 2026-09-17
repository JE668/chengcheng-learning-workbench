'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RAZ_BOOKS } from '@/lib/raz-books';
import { RAZ_VOCAB, RAZ_ALL_WORDS } from '@/lib/raz-vocab';
import { speakEn } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function RazReaderModule() {
  const { record } = useModuleProgress('english', 'raz-reader');
  const [bookIdx, setBookIdx] = useState(0);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [showVocab, setShowVocab] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevProgress = useRef(0);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('raz-read-progress');
    if (saved) {
      setProgress(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (progress.size === prevProgress.current) return;
    prevProgress.current = progress.size;
    localStorage.setItem('raz-read-progress', JSON.stringify([...progress]));
    if (progress.size >= 3) record(1);
    if (progress.size >= 6) record(2);
    if (progress.size >= 10) record(3);
  }, [progress]);

  const book = RAZ_BOOKS[bookIdx];
  const videoSrc = `/raz/videos/${book.id}.mp4`;
  const pdfSrc = `/raz/books/${book.id}.pdf`;

  function markRead() {
    setProgress((p) => {
      const next = new Set(p);
      next.add(book.id);
      return next;
    });
    nextBook();
  }

  function nextBook() {
    setBookIdx((i) => (i + 1) % RAZ_BOOKS.length);
    setReading(false);
    setShowVocab(false);
  }

  function prevBook() {
    setBookIdx((i) => (i - 1 + RAZ_BOOKS.length) % RAZ_BOOKS.length);
    setReading(false);
    setShowVocab(false);
  }

  function startReading() {
    setReading(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }

  // Find vocabulary for this book
  const bookVocab = RAZ_ALL_WORDS.filter((w) => w.book === book.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-green to-moko-mint text-white shadow-lg text-center">
        <div className="text-4xl mb-1">📖✨</div>
        <h2 className="text-2xl font-black">RAZ 绘本阅读</h2>
        <p className="text-sm opacity-90 mt-1">爱心萌可：今天读哪一本？点开始阅读！</p>
      </div>

      {/* Progress */}
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-green/20 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          已读 <span className="font-bold text-moko-green text-lg">{progress.size}</span> / {RAZ_BOOKS.length} 本
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < Math.ceil(progress.size / RAZ_BOOKS.length * 10) ? 'bg-moko-green' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>

      {/* Book Card */}
      <div className="rounded-3xl p-6 bg-white shadow-lg border-2 border-moko-yellow/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-5xl">📚</div>
            <div>
              <div className="text-xs text-gray-400 font-bold">RAZ AA · {book.id}</div>
              <h3 className="text-2xl font-black text-gray-800">{book.title}</h3>
              <div className="text-xs text-gray-400">
                {book.lexile ? `Lexile ${book.lexile}` : 'Lexile N/A'} · {book.grade || 'K'}年级
              </div>
            </div>
          </div>
          <button
            onClick={prevBook}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            ‹
          </button>
        </div>

        {/* Video Player */}
        <div className="rounded-2xl overflow-hidden bg-gray-900 mb-4">
          {reading ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full aspect-video"
              controls
              onEnded={markRead}
            />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center">
                <div className="text-6xl mb-3">▶️</div>
                <button
                  onClick={startReading}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-moko-green to-moko-mint text-white font-black hover:scale-105 transition"
                >
                  开始阅读
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Link */}
        {book.hasPdf && (
          <a
            href={pdfSrc}
            target="_blank"
            rel="noopener"
            className="block text-center px-6 py-2 rounded-full bg-moko-blue/10 text-moko-blue font-bold text-sm hover:bg-moko-blue/20 transition mb-4"
          >
            📄 打开 PDF 绘本
          </a>
        )}

        {/* Vocabulary */}
        {bookVocab.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowVocab(!showVocab)}
              className="w-full px-4 py-2 rounded-full bg-moko-purple/10 text-moko-purple font-bold text-sm hover:bg-moko-purple/20 transition"
            >
              {showVocab ? '隐藏' : '显示'}词汇 ({bookVocab.length} 词)
            </button>
            {showVocab && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {bookVocab.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => speakEn(w.word)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-moko-purple/5 hover:bg-moko-purple/15 border border-moko-purple/20 transition text-left"
                  >
                    <span className="text-2xl">{w.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-800">{w.word}</div>
                      <div className="text-xs text-gray-400">{w.cn}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mark as read */}
        <button
          onClick={markRead}
          className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-moko-green to-moko-mint text-white font-black hover:scale-105 transition"
        >
          ✅ 读完了，标记完成
        </button>
      </div>

      {/* Book Grid */}
      <div className="rounded-3xl p-4 bg-white shadow-lg border-2 border-moko-cyan/20">
        <h3 className="font-bold text-gray-600 mb-3 text-sm">选择绘本</h3>
        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
          {RAZ_BOOKS.slice(0, 40).map((b, i) => (
            <button
              key={b.id}
              onClick={() => { setBookIdx(i); setReading(false); }}
              className={`p-1 rounded-lg text-xs font-bold transition ${
                i === bookIdx
                  ? 'bg-moko-green text-white'
                  : progress.has(b.id)
                    ? 'bg-moko-green/10 text-moko-green border border-moko-green/30'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {b.id.split('-')[1]?.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}