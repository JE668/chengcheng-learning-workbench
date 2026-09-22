import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgressAll } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META, type StudySubject, type StudyModuleMeta } from '@/lib/study-modules';
import { subjectThemes } from '@/lib/design-tokens';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { MokoHelper } from '@/components/MokoHelper';

/**
 * 学科学习首页（语文/数学/英语共用壳）。
 * 三科页面原来各自维护一份 ~100 行几乎相同的 RSC（头部、单元区、趣味拓展宫格、星星进度），
 * 这里收敛为一份；差异点（单元卡片内容、特色入口、参与趣味区的模块过滤）由各科通过 props 注入。
 */
export async function SubjectStudyPage({
  subject,
  unitsSection,
  featured,
  funTitle,
  funHint,
  funFilter,
}: {
  subject: StudySubject;
  /** 「跟着课本走 / 按单元学」区块（含区块标题与网格） */
  unitsSection?: ReactNode;
  /** 单元区与趣味区之间的特色横幅（如语文自己听写、英语 RAZ） */
  featured?: ReactNode;
  funTitle: string;
  funHint: string;
  /** 决定哪些模块进入趣味拓展宫格 */
  funFilter: (m: StudyModuleMeta) => boolean;
}) {
  const modules = STUDY_MODULES[subject];
  const meta = SUBJECT_META[subject];

  // RSC 直查库：获取当前孩子该学科的所有模块进度
  const user = await getCurrentUser();
  const childId = user ? await resolveChildId(user) : null;
  const allProgress = childId ? await getModuleProgressAll(childId) : [];
  const starsMap = new Map(allProgress.filter((p) => p.subject === subject).map((p) => [p.moduleKey, p.stars]));

  const theme = subjectThemes[subject] ?? subjectThemes.chinese;

  return (
    <div className={`max-w-4xl mx-auto pb-28 fade-up bg-gradient-to-b ${theme.gradient} dark:${theme.gradientDark}`}>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject={meta.label.startsWith('语文') ? '语文' : meta.label.startsWith('数学') ? '数学' : '英语'} />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>

      {unitsSection}

      {featured}

      {/* 趣味拓展（不在课本单元内的萌可主题模块） */}
      <section className="mb-8">
        <h2 className="section-title mb-3">{funTitle}</h2>
        <p className="text-xs text-gray-400 mb-3">{funHint}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {modules.filter(funFilter).map((m) => (
            <Link
              key={m.key}
              href={`/study/${subject}/${m.key}`}
              className="rounded-2xl overflow-hidden shadow-lg border-2 border-moko-purple/10 bg-white hover:scale-[1.03] transition block"
            >
              <ModuleCover subject={subject} moduleKey={m.key} emoji={m.emoji} color={m.color} />
              <div className="p-2.5">
                <h3 className="text-sm font-black text-gray-800">{m.label}</h3>
                <div className="mt-1">
                  <ModuleStars subject={subject} moduleKey={m.key} stars={starsMap.get(m.key)} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
