import Link from 'next/link';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { MokoHelper } from '@/components/MokoHelper';

export default function ChineseStudyPage() {
  const modules = STUDY_MODULES.chinese;
  const meta = SUBJECT_META.chinese;
  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject="语文" />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>

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

      <div className="grid md:grid-cols-2 gap-5">
        {modules.map((m) => (
          <Link
            key={m.key}
            href={`/study/chinese/${m.key}`}
            className="rounded-3xl overflow-hidden shadow-xl border-2 border-moko-purple/10 bg-white hover:scale-[1.03] transition block"
          >
            <ModuleCover subject="chinese" moduleKey={m.key} emoji={m.emoji} color={m.color} />
            <div className="p-4">
              <h2 className="text-xl font-black text-gray-800">{m.label}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{m.desc}</p>
              <div className="mt-2">
                <ModuleStars subject="chinese" moduleKey={m.key} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
