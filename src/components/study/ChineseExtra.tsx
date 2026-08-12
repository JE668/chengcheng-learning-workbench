'use client';

import { useState } from 'react';
import { CHARACTER_LESSONS, TEXTS, type CharacterLesson, type TextItem } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';

/* ---------- 识字课文（按课本单元） ---------- */
function LessonCard({ lesson }: { lesson: CharacterLesson }) {
  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-pink/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{lesson.emoji}</span>
        <h3 className="text-lg font-black text-moko-rose">{lesson.lesson}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">{lesson.text}</p>
      <div className="flex flex-wrap gap-2">
        {lesson.items.map((it) => (
          <button
            key={it.char}
            onClick={() => speakZh(`${it.char}，${it.phrase}`)}
            className="rounded-xl px-3 py-2 bg-moko-pink/10 border-2 border-moko-pink/30 text-center active:scale-95 transition"
          >
            <div className="text-2xl font-black text-moko-rose">{it.char}</div>
            <div className="text-[10px] text-gray-500">{it.phrase}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CharacterLessonModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {CHARACTER_LESSONS.map((l) => (
        <LessonCard key={l.lesson} lesson={l} />
      ))}
    </div>
  );
}

/* ---------- 课文朗读（点读跟读） ---------- */
function TextCard({ item }: { item: TextItem }) {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-purple/15 to-moko-pink/15 shadow-lg border-2 border-moko-purple/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">
          {item.emoji} {item.title}
        </h3>
        <button onClick={() => speakZh(item.lines.join(''))} className="btn btn-violet text-sm">
          🔊 读全文
        </button>
      </div>
      <div className="space-y-1">
        {item.lines.map((line, i) => (
          <button
            key={i}
            onClick={() => speakZh(line)}
            className="block w-full text-left text-base leading-relaxed text-gray-700 hover:bg-moko-purple/10 rounded-lg px-2 py-1 transition"
          >
            {line}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {TEXTS.map((t) => (
        <TextCard key={t.title} item={t} />
      ))}
    </div>
  );
}
