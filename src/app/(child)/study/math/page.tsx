import Link from 'next/link';
import { STUDY_MODULES } from '@/lib/study-modules';
import { SubjectStudyPage } from '@/components/study/SubjectStudyPage';
import { MATH_UNITS } from '@/lib/study-data';

export default async function MathStudyPage() {
  const modules = STUDY_MODULES.math;
  const labelOf = new Map(modules.map((m) => [m.key, m]));

  return (
    <SubjectStudyPage
      subject="math"
      funTitle="✨ 萌可趣味挑战"
      funHint="课本之外的好玩挑战，和萌可们一起探索吧～"
      funFilter={(m) => !MATH_UNITS.some((u) => u.moduleKeys.includes(m.key))}
      unitsSection={
        <section className="mb-8">
          <h2 className="section-title mb-3">📘 跟着课本走</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {MATH_UNITS.map((u) => (
              <div key={u.chapter} className="rounded-2xl bg-white shadow border-2 border-moko-blue/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{u.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-400 font-bold">第 {u.chapter} 单元</div>
                    <div className="text-sm font-black text-gray-800 truncate">{u.unit}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">{u.goal}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {u.moduleKeys.map((k) => {
                    const m = labelOf.get(k);
                    if (!m) return null;
                    return (
                      <Link
                        key={k}
                        href={`/study/math/${k}`}
                        className="px-2.5 py-1 rounded-full bg-moko-blue/10 text-moko-blue text-xs font-bold hover:bg-moko-blue/20 transition"
                      >
                        {m.emoji} {m.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      }
    />
  );
}
