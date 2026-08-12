'use client';

import { GRADE1_CHAR_UNITS, TEXTS, type CharUnit, type TextItem } from '@/lib/study-data';
import { speakZh } from '@/lib/speak';

/* ---------- 识字课文（按课本单元，与听写同一份生字表） ---------- */
function LessonCard({ unit }: { unit: CharUnit }) {
  return (
    <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-pink/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{unit.emoji}</span>
        <h3 className="text-lg font-black text-moko-rose">{unit.unit}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">{unit.text}</p>

      <div className="mb-1 text-xs font-bold text-moko-rose/70">生字（点一点听读音）</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {unit.chars.map((c) => (
          <button
            key={c}
            onClick={() => speakZh(c)}
            className="rounded-xl w-11 h-11 bg-moko-pink/10 border-2 border-moko-pink/30 text-2xl font-black text-moko-rose active:scale-95 transition"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-1 text-xs font-bold text-moko-violet/80">词语（和听写是同一份）</div>
      <div className="flex flex-wrap gap-2">
        {unit.words.map((w) => (
          <button
            key={w}
            onClick={() => speakZh(w)}
            className="rounded-full px-3 py-1.5 bg-moko-violet/10 border border-moko-violet/30 text-sm text-moko-violet active:scale-95 transition"
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CharacterLessonModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {GRADE1_CHAR_UNITS.map((u) => (
        <LessonCard key={u.unit} unit={u} />
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
