'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FadeIn } from './LazyMotion';

interface PrincipleCardProps {
  title: string;
  principle: string;
  keyPoints: string[];
  /** 识别信号：什么时候该想到用这个方法 */
  signals?: string[];
  /** 常见错误：孩子最容易踩的坑 */
  pitfalls?: string[];
  mokoName: string;
  mokoImg: string;
}

/**
 * 原理展示卡片 - 向孩子展示「为什么这样做」
 *
 * 分三层，按「可迁移性」从高到低排列：
 *   1. 识别信号（永远显示）—— 「什么情况下该想起这一招」比「怎么算」更容易迁移
 *   2. 关键点（展开）
 *   3. 常见错误（展开）—— 反例对低龄孩子特别有效
 */
export function PrincipleCard({
  title,
  principle,
  keyPoints,
  signals = [],
  pitfalls = [],
  mokoName,
  mokoImg,
}: PrincipleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeIn duration={0.3}>
      <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-moko-blue/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Image
              src={mokoImg || '/moko/lemei.jpg'}
              alt={mokoName}
              width={56}
              height={56}
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

            {signals.length > 0 && (
              <div className="bg-moko-purple/5 rounded-2xl p-3">
                <div className="text-xs font-black text-moko-violet mb-2">
                  🔍 看到这些，就用这招
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {signals.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white text-gray-700 rounded-full px-2.5 py-1 border border-moko-purple/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {expanded && (
              <FadeIn duration={0.2}>
                <div className="space-y-2 mt-2">
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
                  {pitfalls.length > 0 && (
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200">
                      <div className="text-xs font-black text-amber-700 mb-2">⚠️ 容易踩的坑</div>
                      <ul className="space-y-1">
                        {pitfalls.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-amber-500 flex-shrink-0">·</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
