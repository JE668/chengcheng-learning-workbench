import Link from 'next/link';
import { STUDY_MODULES } from '@/lib/study-modules';
import { SubjectStudyPage } from '@/components/study/SubjectStudyPage';
import { CHINESE_UNITS } from '@/lib/study-data';

export default async function ChineseStudyPage() {
  const modules = STUDY_MODULES.chinese;
  const labelOf = new Map(modules.map((m) => [m.key, m]));

  return (
    <SubjectStudyPage
      subject="chinese"
      funTitle="✨ 萌可趣味学园"
      funHint="课本之外的好玩内容，和萌可们一起探索吧～"
      funFilter={(m) => !CHINESE_UNITS.some((u) => u.moduleKeys.includes(m.key))}
      unitsSection={
        <section className="mb-8">
          <h2 className="section-title mb-3">📘 跟着课本走</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {CHINESE_UNITS.map((u) => (
              <div key={u.chapter} className="rounded-2xl bg-white shadow border-2 border-moko-rose/10 p-4">
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
                        href={`/study/chinese/${k}`}
                        className="px-2.5 py-1 rounded-full bg-moko-rose/10 text-moko-rose text-xs font-bold hover:bg-moko-rose/20 transition"
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
      featured={
        <Link
          href="/study/dictation"
          className="block mb-6 rounded-3xl overflow-hidden shadow-xl border-2 border-moko-rose/30 bg-gradient-to-r from-moko-rose to-moko-pink hover:scale-[1.02] transition"
        >
          <div className="p-5 flex items-center gap-4">
            <span className="text-4xl">🎧</span>
            <div>
              <div className="text-xl font-black text-white">自己听写</div>
              <div className="text-sm text-white/80">选单元 · 听语音写一写 · 写错自动进复习本</div>
            </div>
          </div>
        </Link>
      }
    />
  );
}
