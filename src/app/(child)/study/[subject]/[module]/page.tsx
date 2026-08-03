import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { StudyModuleProvider } from '@/lib/study-context';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';

export default function StudyModulePage({ params }: { params: { subject: string; module: string } }) {
  const list = STUDY_MODULES[params.subject];
  const mod = list?.find((m) => m.key === params.module);
  if (!mod) notFound();

  const C = mod.Component;
  const subj = SUBJECT_META[params.subject];

  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/study/${params.subject}`} className="text-moko-violet font-bold hover:underline">
          {subj?.label ?? params.subject}
        </Link>
      </div>
      <ModuleCover subject={params.subject} moduleKey={params.module} emoji={mod.emoji} color={mod.color} variant="banner" />
      <div className="flex items-center justify-between mt-3">
        <h1 className={`text-2xl font-black ${subj?.color ?? 'text-moko-violet'}`}>{mod.label}</h1>
        <ModuleStars subject={params.subject} moduleKey={params.module} size="lg" />
      </div>
      <p className="text-gray-600 mb-6">{mod.desc}</p>
      <StudyModuleProvider subject={params.subject} moduleKey={params.module}>
        <C />
      </StudyModuleProvider>
    </div>
  );
}
