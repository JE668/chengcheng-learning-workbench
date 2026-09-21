import Link from 'next/link';
import { SubjectStudyPage } from '@/components/study/SubjectStudyPage';
import { EN_UNITS } from '@/lib/study-data';
import { RAZ_VOCAB, RAZ_ALL_WORDS } from '@/lib/raz-vocab';

export default async function EnglishStudyPage() {
  return (
    <SubjectStudyPage
      subject="english"
      funTitle="✨ 萌可趣味挑战"
      funHint="课本之外的好玩挑战，和萌可们一起探索吧～"
      funFilter={(m) => !['units', 'words', 'listen', 'speak'].includes(m.key)}
      unitsSection={
        <section className="mb-8">
          <h2 className="section-title mb-3">📘 按单元学</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {EN_UNITS.map((u) => (
              <div key={u.unit} className="rounded-2xl bg-white shadow border-2 border-moko-yellow/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{u.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-400 font-bold">{u.unit}{u.extra ? '（拓展）' : ''}</div>
                    <div className="text-sm font-black text-gray-800 truncate">{u.title}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {/* 单元关联的练习模块入口 */}
                  <Link href="/study/english/letters" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🔤 字母乐园</Link>
                  <Link href="/study/english/words" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">📚 单词世界</Link>
                  <Link href="/study/english/units" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🗂️ 单元通关</Link>
                  <Link href="/study/english/listen" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🎧 听音选词</Link>
                  <Link href="/study/english/speak" className="px-2.5 py-1 rounded-full bg-moko-yellow/10 text-moko-yellow text-xs font-bold hover:bg-moko-yellow/20 transition">🎙️ 口语跟读</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      }
      featured={
        <section className="mb-8">
          <h2 className="section-title mb-3">📖 RAZ 词汇练习</h2>
          <p className="text-xs text-gray-400 mb-3">
            {RAZ_ALL_WORDS.length} 个核心词汇 · {Object.keys(RAZ_VOCAB).length} 个主题分类 · 听音认词（绘本阅读见「课本」页）
          </p>
          <Link
            href="/study/english/raz-vocab"
            className="rounded-2xl overflow-hidden shadow-lg border-2 border-moko-purple/20 bg-white hover:scale-[1.02] transition block"
          >
            <div className="p-4 bg-gradient-to-br from-moko-purple to-moko-violet">
              <div className="text-3xl mb-1">🔤</div>
              <h3 className="font-black text-white">词汇练习</h3>
              <p className="text-xs text-white/80 mt-1">按主题分类，听音认词</p>
            </div>
            <div className="p-3 text-xs text-gray-500">
              {RAZ_ALL_WORDS.length} 个词 · {Object.keys(RAZ_VOCAB).length} 个主题
            </div>
          </Link>
        </section>
      }
    />
  );
}
