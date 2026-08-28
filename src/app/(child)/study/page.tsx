import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgressAll, getTextbookProgress } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { GRADE1_CHAR_UNITS } from '@/lib/study-data';
import { StudyClient } from './StudyClient';

export const dynamic = 'force-dynamic';

const cards = [
  {
    key: 'chinese',
    label: '语文城堡',
    sub: '爱心萌可陪你学拼音、识字、古诗、描红',
    img: '/moko/heartping.jpg',
    color: 'bg-moko-pink',
    border: 'border-moko-pink/30',
  },
  {
    key: 'math',
    label: '数学星球',
    sub: '正正萌可带你认数、比较、看角、练加减',
    img: '/moko/courageping.jpg',
    color: 'bg-moko-blue',
    border: 'border-moko-blue/30',
  },
  {
    key: 'english',
    label: '英语乐园',
    sub: '唱唱萌可教你字母、单词、听读练习',
    img: '/moko/singping.jpg',
    color: 'bg-moko-yellow',
    border: 'border-moko-yellow/30',
  },
];

const TOOLS = [
  { href: '/study/talk', emoji: '🗣️', title: '看图说话', sub: '看场景说 3 句话，录下自己的声音' },
  { href: '/study/picto', emoji: '🌟', title: '象形字变变变', sub: '汉字怎么从「画」变成「字」' },
  { href: '/study/trace', emoji: '✍️', title: '描红跟写', sub: '米字格描红范字，听读音记字形' },
  { href: '/study/poem-fill', emoji: '📜', title: '古诗填空背诵', sub: '从字卡补全古诗，填对听萌可念' },
  { href: '/study/eye', emoji: '💆', title: '护眼小操', sub: '四节眼保健操，看书久了做一遍' },
];

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
  const prog = await getModuleProgressAll(0);
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
  const tb = await getTextbookProgress(0);
  const readIdx = tb['chinese'] ?? 0;
  const nextUnit = GRADE1_CHAR_UNITS.find((u) => u.chapter === 0 + 1);
  const nextLabel = nextUnit ? `第 ${nextUnit.chapter} 单元 · ${nextUnit.unit}` : '';
  const nextHref = '/study/chinese';

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