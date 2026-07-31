import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildId } from '@/lib/db';
import { STUDY_MODULES } from '@/lib/study-modules';
import { ChildSwitcher } from '@/components/ChildSwitcher';

export const dynamic = 'force-dynamic';

// 学科展示名（错题表存的是中文）→ 路由 key
const SUBJECT_KEY: Record<string, string> = { 语文: 'chinese', 数学: 'math', 英语: 'english' };
const SUBJECT_EMOJI: Record<string, string> = { 语文: '💗', 数学: '🔵', 英语: '💛' };
const ALL_SUBJECTS = ['语文', '数学', '英语'];

interface MistakeRow {
  id: number;
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string | null;
  source_module: string | null;
  chapter: string | null;
  resolved: number;
  created_at: string;
}

export default async function ParentMistakesPage({
  searchParams,
}: {
  searchParams: { subject?: string; module?: string };
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') redirect('/home');
  const db = getDb();
  const childId = (await getChildId(user)) ?? 0;
  const nameRow = childId ? (await db.execute({ sql: 'SELECT display_name FROM users WHERE id = ?', args: [childId] })).rows[0] : null;
  const childName = nameRow ? String(nameRow.display_name) : '孩子';

  const filterSubject = searchParams.subject || '';
  const filterModule = searchParams.module || '';

  const where: string[] = ['child_id = ?'];
  const args: (string | number)[] = [childId];
  if (filterSubject) {
    where.push('subject = ?');
    args.push(filterSubject);
  }
  if (filterModule) {
    where.push('source_module = ?');
    args.push(filterModule);
  }

  const res = await db.execute({
    sql: `SELECT * FROM mistakes WHERE ${where.join(' AND ')} ORDER BY resolved ASC, created_at DESC`,
    args,
  });

  const mistakes: MistakeRow[] = res.rows.map((r) => {
    const x = r as Record<string, unknown>;
    return {
      id: Number(x.id),
      subject: String(x.subject),
      kind: String(x.kind ?? ''),
      prompt: String(x.prompt),
      answer: String(x.answer),
      wrong: x.wrong == null ? null : String(x.wrong),
      source_module: x.source_module == null ? null : String(x.source_module),
      chapter: x.chapter == null ? null : String(x.chapter),
      resolved: Number(x.resolved ?? 0),
      created_at: String(x.created_at ?? ''),
    };
  });

  const total = mistakes.length;
  const unresolved = mistakes.filter((m) => m.resolved === 0).length;
  const mastered = total - unresolved;

  const moduleLabel = (subject: string, key?: string | null) => {
    if (!key) return '';
    const list = STUDY_MODULES[SUBJECT_KEY[subject]] || [];
    return list.find((m) => m.key === key)?.label ?? key;
  };
  const practiceHref = (m: MistakeRow) => {
    const key = SUBJECT_KEY[m.subject];
    if (!key) return '/study';
    return m.source_module ? `/study/${key}/${m.source_module}` : `/study/${key}`;
  };

  // 当前学科下的模块筛选 chips
  const moduleChips =
    filterSubject && SUBJECT_KEY[filterSubject]
      ? (STUDY_MODULES[SUBJECT_KEY[filterSubject]] || []).map((m) => ({ key: m.key, label: m.label }))
      : [];

  const chip = (href: string, label: string, active: boolean, emoji?: string) => (
    <Link
      key={href + label}
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${
        active ? 'bg-moko-violet text-white shadow' : 'bg-white text-moko-violet border border-moko-violet/30 hover:bg-moko-violet/10'
      }`}
    >
      {emoji ? emoji + ' ' : ''}
      {label}
    </Link>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <h1 className="text-3xl font-black text-moko-violet">📕 错题本</h1>
        <ChildSwitcher />
      </div>
      <p className="text-gray-600 mb-4">这里收集了{childName}在各科练习中做错的小题，点「去练习」就能直接回到出错的模块巩固。</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: '错题总数', value: total, color: 'bg-moko-purple' },
          { label: '待复习', value: unresolved, color: 'bg-moko-rose' },
          { label: '已掌握', value: mastered, color: 'bg-moko-blue' },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.color} text-white`}>
            <div className="text-3xl font-black">{s.value}</div>
            <div className="text-xs opacity-90 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 学科筛选 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {chip('/mistakes', '全部学科', !filterSubject)}
        {ALL_SUBJECTS.map((s) =>
          chip(`/mistakes?subject=${encodeURIComponent(s)}`, s, filterSubject === s, SUBJECT_EMOJI[s]),
        )}
      </div>

      {/* 模块筛选（选中学科后显示） */}
      {filterSubject && (
        <div className="flex flex-wrap gap-2 mb-5">
          {chip(`/mistakes?subject=${encodeURIComponent(filterSubject)}`, '全部模块', !filterModule)}
          {moduleChips.map((m) =>
            chip(`/mistakes?subject=${encodeURIComponent(filterSubject)}&module=${encodeURIComponent(m.key)}`, m.label, filterModule === m.key),
          )}
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-3xl p-10 bg-white shadow-lg border-2 border-moko-purple/20 text-center">
          <div className="text-6xl mb-3">🌟</div>
          <div className="text-xl font-black text-moko-violet">还没有错题记录</div>
          <p className="text-gray-500 mt-2">程程练习时做错的小题会自动出现在这里哦～</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => {
            const label = moduleLabel(m.subject, m.source_module);
            return (
              <div key={m.id} className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-purple/15">
                <div className="flex items-center gap-2 mb-1">
                  <span>{SUBJECT_EMOJI[m.subject] || '📘'}</span>
                  <span className="font-bold text-moko-violet">{m.subject}</span>
                  <span className="text-xs text-gray-400">· {m.kind}</span>
                  {m.resolved === 0 ? (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-moko-rose/15 text-moko-rose font-bold">待复习</span>
                  ) : (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold">已掌握</span>
                  )}
                </div>
                {label && (
                  <div className="text-xs text-moko-violet/80 mb-1">
                    来源：{label}
                    {m.chapter ? ` · ${m.chapter}` : ''}
                  </div>
                )}
                <div className="text-lg font-black text-gray-700">{m.prompt}</div>
                <div className="mt-2 text-sm">
                  <span className="text-green-600 font-bold">正确答案：{m.answer}</span>
                  {m.wrong && <span className="text-red-400 ml-2">（写成了：{m.wrong}）</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={practiceHref(m)}
                    className="flex-1 text-center py-2 rounded-full bg-moko-violet text-white font-bold text-sm active:scale-95 transition"
                  >
                    去练习 ›
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
