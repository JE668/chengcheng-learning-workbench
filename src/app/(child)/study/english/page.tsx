import Link from 'next/link';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { MokoHelper } from '@/components/MokoHelper';

export default function EnglishStudyPage() {
  const modules = STUDY_MODULES.english;
  const meta = SUBJECT_META.english;
  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject="英语" />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>
      <div className="grid md:grid-cols-2 gap-5">
        {modules.map((m) => (
          <Link
            key={m.key}
            href={`/study/english/${m.key}`}
            className="rounded-3xl overflow-hidden shadow-xl border-2 border-moko-purple/10 bg-white hover:scale-[1.03] transition block"
          >
            <ModuleCover subject="english" moduleKey={m.key} emoji={m.emoji} color={m.color} />
            <div className="p-4">
              <h2 className="text-xl font-black text-gray-800">{m.label}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{m.desc}</p>
              <div className="mt-2">
                <ModuleStars subject="english" moduleKey={m.key} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
