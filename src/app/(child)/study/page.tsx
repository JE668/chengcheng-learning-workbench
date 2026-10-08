import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgressAll, getTextbookProgress } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';

import { GRADE1_CHAR_UNITS } from '@/lib/study-data/units';

import { StudyClient } from './StudyClient';

export const dynamic = 'force-dynamic';

interface Rec {
  resumeHref: string;
  resumeLabel: string;
  nextHref: string;
  nextLabel: string;
}

async function loadRecommend(): Promise<{
  resumeHref: string;
  resumeLabel: string;
  nextHref: string;
  nextLabel: string;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const childId = await resolveChildId(user);
  if (!childId) return null;

  // 继续学习：最近一次玩过的模块
  // ⚠️ 必须传上面解析出的 childId。之前写死 0，而 child_id=0 永远没有数据，
  // 导致「继续学习」按钮和「该复习单元」标签永远不会出现（功能静默失效）。
  const prog = await getModuleProgressAll(childId);
  const recent = prog
    .filter((p) => p.lastPlayed > 0)
    .sort((a, b) => b.lastPlayed - a.lastPlayed)[0];
  if (!recent) return null;

  const subj = recent.subject as keyof typeof STUDY_MODULES;
  const mod = STUDY_MODULES[subj]?.find((m) => m.key === recent.moduleKey);
  if (!mod) return null;
  const resumeLabel = `${SUBJECT_META[subj]?.label ?? ''} · ${mod.label}`;
  const resumeHref = `/study/${recent.subject}/${recent.moduleKey}`;

  // 该复习单元：语文课本读到的下一章对应哪个单元
  const tb = await getTextbookProgress(childId);
  const readIdx = tb['chinese'] ?? 0;
  const nextUnit = GRADE1_CHAR_UNITS.find((u) => u.chapter === readIdx);
  const nextLabel = nextUnit ? `第 ${nextUnit.chapter} 单元 · ${nextUnit.unit}` : '';
  const nextHref = nextUnit ? `/study/chinese?chapter=${nextUnit.chapter}` : '/study/chinese';

  return { resumeHref, resumeLabel, nextHref, nextLabel };
}

export default async function StudyPage() {
  const rec = await loadRecommend();
  return (
    <div className="max-w-4xl mx-auto fade-up">
      <h1 className="page-title mb-2">学习城堡 📚</h1>
      <p className="text-gray-600 mb-4">选择一个学科，开启今天的萌可学习冒险！</p>
      <StudyClient rec={rec} />
    </div>
  );
}
