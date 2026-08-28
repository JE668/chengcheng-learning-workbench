import Link from 'next/link';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getModuleProgressAll } from '@/lib/progress-store';
import { STUDY_MODULES, SUBJECT_META } from '@/lib/study-modules';
import { ModuleCover } from '@/components/study/ModuleCover';
import { ModuleStars } from '@/components/study/ModuleStars';
import { MokoHelper } from '@/components/MokoHelper';
import { CHINESE_UNITS } from '@/lib/study-data';

export default async function ChineseStudyPage() {
  const modules = STUDY_MODULES.chinese;
  const meta = SUBJECT_META.chinese;
  const labelOf = new Map(modules.map((m) => [m.key, m]));

  // RSC 直查库：获取当前孩子语文科目的所有模块进度
  const user = await getCurrentUser();
  const childId = user ? await resolveChildId(user) : null;
  const allProgress = childId ? await getModuleProgressAll(childId) : [];
  const starsMap = new Map(allProgress.filter(p => p.subject === 'chinese').map(p => [p.moduleKey, p.stars]));

  return (
    <div className="max-w-4xl mx-auto pb-28 fade-up">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <MokoHelper subject="语文" />
      <h1 className={`text-3xl font-black ${meta.color} mb-2`}>{meta.emoji} {meta.label}</h1>
      <p className="text-gray-600 mb-6">{meta.sub}</p>

      {/* 跟着课本走：每个单元对应哪些练习，和课本单元顺序一一对上 */}
      <section className="mb-8">
        <h2 className="section-title mb-3">📘 跟着课本走</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {CHINESE_UNITS.map((u) => (
            <div key={u.chapter} className="rounded-2xl bg-white shadow border-2 border-moko-rose/10 p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{u.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400 font-bold">第 {u.chapter} 单元</div>
                  <div className="text-sm font-black text-gray-800 truncate">{u.unit}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-snug">{u.goal}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {u.moduleKeys.map((k) => {
                  const m = labelOf.get(k);
                  if (!m) return null;
                  return (
                    <Link
                      key={k}
                      href={`/study/chinese/${k}`}
                      className="px-2.5 py-1 rounded-full bg-moko-rose/10 text-moko-rose text-xs font-bold hover:bg-moko-rose/20 transition"
                    >
                      {m.emoji} {m.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

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

      {/* 趣味拓展（不在课本单元内的萌可主题模块） */}
      <section className="mb-8">
        <h2 className="section-title mb-3">✨ 萌可趣味学园</h2>
        <p className="text-xs text-gray-400 mb-3">课本之外的好玩内容，和萌可们一起探索吧～</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {modules.filter((m) => !CHINESE_UNITS.some((u) => u.moduleKeys.includes(m.key))).map((m) => (
            <Link
              key={m.key}
              href={`/study/chinese/${m.key}`}
              className="rounded-2xl overflow-hidden shadow-lg border-2 border-moko-purple/10 bg-white hover:scale-[1.03] transition block"
            >
              <ModuleCover subject="chinese" moduleKey={m.key} emoji={m.emoji} color={m.color} />
              <div className="p-2.5">
                <h3 className="text-sm font-black text-gray-800">{m.label}</h3>
                <div className="mt-1">
                  <ModuleStars subject="chinese" moduleKey={m.key} stars={starsMap.get(m.key)} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}