import Link from 'next/link';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { MokoHelper } from '@/components/MokoHelper';

export default function MathStudyPage() {
  const modules = STUDY_MODULES.math;
  const meta = SUBJECT_META.math;
  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject="数学" />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>
      <div className="grid md:grid-cols-2 gap-5">
        {modules.map((m) => (
          <Link
            key={m.key}
            href={`/study/math/${m.key}`}
            className={`rounded-3xl p-5 shadow-xl border-2 border-white/40 text-white hover:scale-105 transition block ${m.color}`}
          >
            <div className="text-4xl mb-2">{m.emoji}</div>
            <h2 className="text-2xl font-black mb-1">{m.label}</h2>
            <p className="text-sm opacity-90">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
