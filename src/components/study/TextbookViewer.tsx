'use client';

import { useState, useEffect, useCallback } from 'react';
import { TEXTBOOKS, type Textbook, type Chapter } from '@/lib/textbooks';
import PdfViewer from '@/components/PdfViewer';
import { mediaUrl } from '@/lib/media';

const PROGRESS_KEY = 'moko-textbook-progress';

type Progress = Record<string, number>; // bookKey -> 上次读到的章节 idx

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function TextbookViewer() {
  const [book, setBook] = useState<Textbook | null>(null);
  const [openFile, setOpenFile] = useState<string | null>(null); // 懒加载：仅点击后才设置
  const [openTitle, setOpenTitle] = useState<string>('');
  const [openPages, setOpenPages] = useState<number>(0);
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const remember = useCallback((bookKey: string, chapterIdx: number) => {
    setProgress((p) => {
      const next = { ...p, [bookKey]: chapterIdx };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openChapter = useCallback(
    (b: Textbook, c: Chapter) => {
      setOpenFile(c.file);
      setOpenTitle(`${c.title}（第 ${c.startPage}–${c.startPage + c.pages - 1} 页）`);
      setOpenPages(c.pages);
      remember(b.key, c.idx);
    },
    [remember],
  );

  // 选择一本书：默认打开上次读到的章节（有则），否则打开第一章
  const selectBook = useCallback(
    (b: Textbook) => {
      setBook(b);
      setOpenFile(null);
      setOpenTitle('');
      setOpenPages(0);
      const last = progress[b.key];
      if (last) {
        const c = b.chapters.find((x) => x.idx === last);
        if (c) {
          openChapter(b, c);
          return;
        }
      }
      openChapter(b, b.chapters[0]);
    },
    [progress, openChapter],
  );

  // 书单视图
  if (!book) {
    return (
      <div className="grid md:grid-cols-2 gap-5">
        {TEXTBOOKS.map((b) => {
          const last = progress[b.key];
          const lastC = last ? b.chapters.find((c) => c.idx === last) : undefined;
          return (
            <button
              key={b.key}
              onClick={() => selectBook(b)}
              className={`text-left rounded-3xl p-6 shadow-xl border-2 ${b.border} ${b.color} text-white hover:scale-[1.03] transition block`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.img}
                alt={b.title}
                className="w-24 h-24 rounded-full border-4 border-white/50 shadow mx-auto mb-4 object-cover"
              />
              <h2 className="text-2xl font-black text-center mb-1">{b.emoji} {b.title}</h2>
              <p className="text-sm opacity-90 text-center leading-relaxed mb-3">{b.sub}</p>
              <div className="text-center">
                <span className="inline-block px-4 py-2 rounded-2xl bg-white/20 font-bold text-sm">
                  共 {b.chapters.length} 章 · 点击按章阅读 📖
                </span>
              </div>
              {lastC && (
                <p className="text-center text-xs mt-2 bg-white/25 rounded-full px-2 py-1 inline-block mx-auto">
                  ↩︎ 继续：{lastC.title}
                </p>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 阅读视图
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setBook(null)}
          className="px-4 py-2 rounded-2xl bg-white shadow border-2 border-moko-purple/20 text-moko-violet font-bold hover:bg-moko-purple/5"
        >
          ‹ 返回书单
        </button>
        <h2 className={`text-xl font-black ${book.color.replace('bg-', 'text-')}`}>
          {book.emoji} {book.title}
        </h2>
        <a
          href={mediaUrl(openFile || book.chapters[0].file)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-4 py-2 rounded-2xl bg-moko-violet text-white font-bold shadow hover:opacity-90"
        >
          在新标签打开 ↗
        </a>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        {/* 目录 */}
        <aside className="rounded-2xl bg-white shadow border-2 border-moko-purple/15 p-3 max-h-[80vh] overflow-auto">
          <div className="text-xs font-black text-gray-400 mb-2 px-1">目录（点击加载该章）</div>
          {book.chapters.map((c) => {
            const active = openFile === c.file;
            const isLast = progress[book.key] === c.idx;
            return (
              <button
                key={c.idx}
                onClick={() => openChapter(book, c)}
                className={`w-full text-left text-sm rounded-xl px-3 py-2 mb-1 flex items-center gap-2 ${
                  active ? 'bg-moko-violet text-white' : 'hover:bg-moko-purple/10 text-gray-700'
                }`}
              >
                <span className="font-black opacity-70">{c.idx}.</span>
                <span className="flex-1 truncate">{c.title}</span>
                {isLast && !active && <span className="text-[10px] bg-moko-yellow/80 text-gray-800 rounded px-1">上次</span>}
                <span className="text-[10px] opacity-60">{c.pages}p</span>
              </button>
            );
          })}
        </aside>

        {/* 阅读区（懒加载：画布渲染，只能看不能下载） */}
        <div className="rounded-3xl overflow-hidden border-4 border-moko-purple/20 shadow-xl bg-white" style={{ height: '78vh' }}>
          {openFile ? (
            <div className="w-full h-full overflow-auto p-2">
              <PdfViewer url={mediaUrl(openFile)} className="w-full" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              从左侧目录选择一章开始阅读
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {openTitle} · 共 {openPages} 页；按章加载更省流量，进度会自动记住（下次打开直接续上）
      </p>
    </div>
  );
}
