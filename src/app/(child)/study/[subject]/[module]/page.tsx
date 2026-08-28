import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgress } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { StudyModuleProvider } from '@/lib/study-context';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { NextStepGuide } from '@/components/study/NextStepGuide';

export default async function StudyModulePage({ params }: { params: { subject: string; module: string } }) {
  const list = STUDY_MODULES[params.subject];
  const mod = list?.find((m) => m.key === params.module);
  if (!mod) notFound();

  const C = mod.Component;
  const subj = SUBJECT_META[params.subject];

  // RSC 直查库：获取当前孩子该模块的完整进度，传给客户端组件避免二次请求
  const user = await getCurrentUser();
  const childId = user ? await resolveChildId(user) : null;
  const progress = childId ? await getModuleProgress(childId, params.subject, params.module) : null;
  const stars = progress?.stars ?? 0;
  const initialProgress = progress ? { stars: progress.stars, rounds: progress.rounds, lastPlayed: progress.lastPlayed } : undefined;

  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
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
        <ModuleStars subject={params.subject} moduleKey={params.module} size="lg" stars={stars} />
      </div>
      <p className="text-gray-600 mb-6">{mod.desc}</p>
      <StudyModuleProvider subject={params.subject} moduleKey={params.module} initialProgress={initialProgress}>
        <C />
      </StudyModuleProvider>
      <NextStepGuide subject={params.subject} moduleKey={params.module} />
    </div>
  );
}