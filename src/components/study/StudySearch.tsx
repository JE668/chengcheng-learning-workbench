'use client';

import { useState } from 'react';
import { STUDY_MODULES } from '@/lib/study-modules';

/**
 * 学习模块搜索栏：客户端过滤，不影响服务端渲染的模块进度数据。
 * 接收模块数据后在前端按关键词实时过滤。
 */
export default function StudySearch({
  moduleData,
  children,
}: {
  moduleData: Record<string, { key: string; label: string; emoji: string; desc: string; color: string }[]>;
  children: (filtered: Record<string, any[]>) => React.ReactNode;
}) {
  const [query, setQuery] = useState('');

  const filtered: Record<string, any[]> = {};
  for (const [subject, modules] of Object.entries(moduleData)) {
    filtered[subject] = query
      ? modules.filter(
          (m) =>
            m.label.includes(query) ||
            m.desc.includes(query) ||
            m.key.includes(query)
        )
      : modules;
  }

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 搜索学习模块，比如「拼音」「古诗」「字母」…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 text-lg focus:border-moko-pink outline-none transition bg-white/70"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-moko-rose text-xl"
            >
              ✕
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs text-gray-500 mt-1">
            找到 {Object.values(filtered).reduce((s, a) => s + a.length, 0)} 个模块
          </p>
        )}
      </div>
      {children(filtered)}
    </div>
  );
}
