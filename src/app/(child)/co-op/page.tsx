'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';
import { EmptyState } from '@/components/EmptyState';

interface Child {
  id: string;
  name: string;
  username: string;
  selected: boolean;
}

const COOP_TASKS = [
  { emoji: '🌙', title: '一起读一首古诗', desc: '和兄弟姐妹各读一首，看谁读得最顺', href: '/study/chinese/poems' },
  { emoji: '➕', title: '一起玩凑十法', desc: '比一比，谁先算完十格阵', href: '/games/make-ten' },
  { emoji: '🌳', title: '一起背乘法口诀', desc: '你考我、我考你，口诀记得牢', href: '/study/math/mult-table' },
  { emoji: '🔤', title: '一起拼拼音', desc: '轮流拼读，看谁拼得又快又准', href: '/games/pinyin-spell' },
];

export default function CoOpPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [cheer, setCheer] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/children')
      .then((r) => r.json())
      .then((d) => setChildren(d.children ?? []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  function cheerFor(name: string) {
    setCheer(name);
    speakZh(`加油，${name}！我们一起学习，一起长大！`, 0.9);
    setTimeout(() => setCheer(null), 1500);
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 fade-up">
      <Link href="/" className="text-moko-violet font-black no-underline">‹ 返回首页</Link>
      <h1 className="page-title mt-2 mb-1">萌可帮帮忙 🤝</h1>
      <p className="text-gray-600 mb-6">和家里的兄弟姐妹一起学习、互相加油，学习更有劲！</p>

      {/* 家庭成员 */}
      <h2 className="section-title mb-3">👨‍👩‍👧 我的家庭成员</h2>
      {loading ? (
        <div className="card-moko text-center text-gray-500 py-4 flex flex-col items-center justify-center gap-2"><span className="moko-loader"><span></span><span></span><span></span></span>加载中…</div>
      ) : children.length === 0 ? (
        <EmptyState emoji="👧" title="还没有其他小朋友" desc="让爸爸妈妈在「设置」里加一个兄弟姐妹，就能一起合作学习啦！" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {children.map((c) => (
            <div key={c.id} className={`rounded-2xl p-4 bg-white shadow border-2 text-center ${cheer === c.name ? 'border-moko-gold animate-bounce' : 'border-moko-purple/20'}`}>
              <div className="text-4xl mb-1">{c.selected ? '🌟' : '🧒'}</div>
              <div className="font-black text-moko-violet">{c.name}</div>
              {c.selected && <div className="text-xs text-moko-gold font-bold">就是我</div>}
              <button
                onClick={() => cheerFor(c.name)}
                className="mt-2 px-3 py-1.5 rounded-full bg-moko-gold text-white font-bold text-xs active:scale-95 transition"
              >
                👏 加油
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 合作小任务 */}
      <h2 className="section-title mb-3">🎯 一起完成的合作任务</h2>
      <div className="space-y-3 mb-8">
        {COOP_TASKS.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="flex items-center gap-4 rounded-2xl p-4 shadow-lg border-2 border-moko-purple/20 bg-white hover:scale-[1.02] transition block"
          >
            <span className="text-4xl">{t.emoji}</span>
            <div className="flex-1">
              <h3 className="font-black text-moko-violet">{t.title}</h3>
              <p className="text-sm text-gray-600">{t.desc}</p>
            </div>
            <span className="text-moko-violet font-black">一起去 ›</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-gold/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 怎么玩合作？</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>点家庭成员的「加油」，给兄弟姐妹打气，萌可也会一起喊加油！</li>
          <li>选一个「合作任务」，和兄弟姐妹各自完成，再比比谁更棒。</li>
          <li>互相帮助、不吵架，就是最棒的萌可小队～</li>
        </ul>
      </div>
    </div>
  );
}
