'use client';

import { useState } from 'react';

type Book = {
  key: 'chinese' | 'math';
  title: string;
  sub: string;
  emoji: string;
  color: string;
  border: string;
  img: string;
  file: string;
  sizeMB: number;
};

const BOOKS: Book[] = [
  {
    key: 'chinese',
    title: '语文 · 一年级上册',
    sub: '义务教育教科书（2022 年版课程标准修订）',
    emoji: '📕',
    color: 'bg-moko-pink',
    border: 'border-moko-pink/40',
    img: '/moko/heartping.jpg',
    file: '/textbooks/chinese-grade1-1.pdf',
    sizeMB: 23,
  },
  {
    key: 'math',
    title: '数学 · 一年级上册',
    sub: '义务教育教科书（2022 年版课程标准修订）',
    emoji: '📘',
    color: 'bg-moko-blue',
    border: 'border-moko-blue/40',
    img: '/moko/courageping.jpg',
    file: '/textbooks/math-grade1-1.pdf',
    sizeMB: 55,
  },
];

export default function TextbookViewer() {
  const [open, setOpen] = useState<Book | null>(null);

  if (open) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOpen(null)}
            className="px-4 py-2 rounded-2xl bg-white shadow border-2 border-moko-purple/20 text-moko-violet font-bold hover:bg-moko-purple/5"
          >
            ‹ 返回书单
          </button>
          <h2 className={`text-xl font-black ${open.color.replace('bg-', 'text-')}`}>
            {open.emoji} {open.title}
          </h2>
          <a
            href={open.file}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-4 py-2 rounded-2xl bg-moko-violet text-white font-bold shadow hover:opacity-90"
          >
            在新标签打开 ↗
          </a>
        </div>
        <div className="rounded-3xl overflow-hidden border-4 border-moko-purple/20 shadow-xl bg-white">
          <iframe
            src={open.file}
            title={open.title}
            className="w-full"
            style={{ height: '78vh' }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          首次打开需要加载约 {open.sizeMB} MB，请稍候；可点「在新标签打开」用系统 PDF 阅读器查看。
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {BOOKS.map((b) => (
        <button
          key={b.key}
          onClick={() => setOpen(b)}
          className={`text-left rounded-3xl p-6 shadow-xl border-2 ${b.border} ${b.color} text-white hover:scale-[1.03] transition block`}
        >
          <img
            src={b.img}
            alt={b.title}
            className="w-24 h-24 rounded-full border-4 border-white/50 shadow mx-auto mb-4 object-cover"
          />
          <h2 className="text-2xl font-black text-center mb-1">{b.emoji} {b.title}</h2>
          <p className="text-sm opacity-90 text-center leading-relaxed mb-4">{b.sub}</p>
          <div className="text-center">
            <span className="inline-block px-4 py-2 rounded-2xl bg-white/20 font-bold text-sm">
              打开课本 📖（约 {b.sizeMB} MB）
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
