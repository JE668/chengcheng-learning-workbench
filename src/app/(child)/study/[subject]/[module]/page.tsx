import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgress } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META, type StudySubject } from '@/lib/study-modules';
import { StudyModuleProvider } from '@/lib/study-context';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { ModuleErrorBoundary } from '@/components/study/ModuleErrorBoundary';
import { NextStepGuide } from '@/components/study/NextStepGuide';
import { StarBurstProvider } from '@/components/study/StarBurstProvider';

export default async function StudyModulePage({
  params,
}: {
  params: Promise<{ subject: string; module: string }>;
}) {
  // Next 15：params 是 Promise，必须先 await
  const { subject: rawSubject, module: moduleKey } = await params;
  const subject = rawSubject as StudySubject;
  const list = STUDY_MODULES[subject];
  const mod = list?.find((m) => m.key === moduleKey);
  if (!mod) notFound();

  const C = mod.Component;
  const subj = SUBJECT_META[subject];

  // RSC 直查库：获取当前孩子该模块的完整进度，传给客户端组件避免二次请求
  const user = await getCurrentUser();
  const childId = user ? await resolveChildId(user) : null;
  const progress = childId ? await getModuleProgress(childId, subject, moduleKey) : null;
  const stars = progress?.stars ?? 0;
  const initialProgress = progress
    ? { stars: progress.stars, rounds: progress.rounds, lastPlayed: progress.lastPlayed }
    : undefined;

  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
      {/* 🍭 糖果房间：学科主题色环境光（方案②-3）。不识字的孩子靠颜色认房间。
          fixed 全屏光晕从顶部洒下，pointer-events-none 不挡任何交互，
          透明度 ≤0.13 保证正文对比度不受影响。 */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 h-72 pointer-events-none -z-10 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${subj?.theme ?? 'rgba(167, 139, 250, 0.10)'}, transparent 70%)`,
        }}
      />
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">
          ‹ 学习首页
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/study/${subject}`} className="text-moko-violet font-bold hover:underline">
          {subj?.label ?? subject}
        </Link>
      </div>
      <ModuleCover
        subject={subject}
        moduleKey={moduleKey}
        emoji={mod.emoji}
        color={mod.color}
        variant="banner"
      />
      <div className="flex items-center justify-between mt-3">
        <h1 className={`text-2xl font-black ${subj?.color ?? 'text-moko-violet'}`}>{mod.label}</h1>
        <ModuleStars subject={subject} moduleKey={moduleKey} size="lg" stars={stars} />
      </div>
      <p className="text-gray-600 mb-6">{mod.desc}</p>
      <StudyModuleProvider
        subject={subject}
        moduleKey={moduleKey}
        initialProgress={initialProgress}
      >
        <StarBurstProvider>
          <ModuleErrorBoundary subject={subject} moduleKey={moduleKey}>
            <C />
          </ModuleErrorBoundary>
        </StarBurstProvider>
      </StudyModuleProvider>
      <NextStepGuide subject={subject} moduleKey={moduleKey} />
    </div>
  );
}
