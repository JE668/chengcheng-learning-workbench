'use client';

import { useState } from 'react';
import { FadeIn } from './LazyMotion';

interface PrincipleCardProps {
  title: string;
  principle: string;
  keyPoints: string[];
  mokoName: string;
  mokoImg: string;
}

/**
 * 原理展示卡片 - 向孩子展示「为什么这样做」
 * 包含：原理解释 + 关键点 + 可展开查看
 */
export function PrincipleCard({ title, principle, keyPoints, mokoName, mokoImg }: PrincipleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeIn duration={0.3}>
      <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-moko-blue/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src={mokoImg}
              alt={mokoName}
              className="w-14 h-14 rounded-2xl border-4 border-moko-blue/30 shadow object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-moko-blue flex items-center gap-2">
                <span>💡</span>
                <span>为什么要这样算？</span>
              </h3>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-moko-purple font-bold hover:underline"
              >
                {expanded ? '收起 ▲' : '展开 ▼'}
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">{principle}</p>

            {/* 关键点 - 展开时显示 */}
            {expanded && (
              <FadeIn duration={0.2}>
                <div className="bg-moko-blue/5 rounded-2xl p-3">
                  <div className="text-xs font-black text-moko-blue mb-2">🎯 关键点</div>
                  <ul className="space-y-1">
                    {keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-moko-rose font-black flex-shrink-0">{i + 1}.</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
