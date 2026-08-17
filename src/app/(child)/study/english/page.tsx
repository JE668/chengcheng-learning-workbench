import Link from 'next/link';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { MokoHelper } from '@/components/MokoHelper';
import { EN_UNITS } from '@/lib/study-data';

export default function EnglishStudyPage() {
  const modules = STUDY_MODULES.english;
  const meta = SUBJECT_META.english;
  const labelOf = new Map(modules.map((m) => [m.key, m]));
  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject="英语" />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>

      {/* 按单元走：每个单元对应哪些练习 */}
      <section className="mb-8">
        <h2 className="section-title mb-3">📘 按单元学</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {EN_UNITS.map((u) => (
            <div key={u.unit} className="rounded-2xl bg-white shadow border-2 border-moko-yellow/10 p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{u.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400 font-bold">{u.unit}{u.extra ? '（拓展）' : ''}</div>
                  <div className="text-sm font-black text-gray-800 truncate">{u.title}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {/* 单元关联的练习模块入口 */}
                <Link href="/study/english/letters" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🔤 字母乐园</Link>
                <Link href="/study/english/words" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">📚 单词世界</Link>
                <Link href="/study/english/units" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🗂️ 单元通关</Link>
                <Link href="/study/english/listen" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🎧 听音选词</Link>
                <Link href="/study/english/speak" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🎙️ 口语跟读</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 趣味拓展 */}
      <section className="mb-8">
        <h2 className="section-title mb-3">✨ 萌可趣味挑战</h2>
        <p className="text-xs text-gray-400 mb-3">课本之外的好玩挑战，和萌可们一起探索吧～</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {modules.filter((m) => !['units', 'words', 'listen', 'speak'].includes(m.key)).map((m) => (
            <Link
              key={m.key}
              href={`/study/english/${m.key}`}
              className="rounded-2xl overflow-hidden shadow-lg border-2 border-moko-purple/10 bg-white hover:scale-[1.03] transition block"
            >
              <ModuleCover subject="english" moduleKey={m.key} emoji={m.emoji} color={m.color} />
              <div className="p-2.5">
                <h3 className="text-sm font-black text-gray-800">{m.label}</h3>
                <div className="mt-1">
                  <ModuleStars subject="english" moduleKey={m.key} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
