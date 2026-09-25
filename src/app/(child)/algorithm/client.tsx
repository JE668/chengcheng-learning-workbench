'use client';

import Link from 'next/link';
import { ALGORITHM_TOPICS } from '@/lib/algorithm/topics';
import { MokoGroupBg } from '@/components/moko-bg';
import { motion } from 'framer-motion';

export function AlgorithmHomeClient() {
  return (
    <div className="relative max-w-4xl mx-auto min-h-screen pb-28 fade-up">
      <MokoGroupBg />

      {/* 头部 */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/home" className="text-moko-violet font-bold hover:underline">‹ 萌可小屋</Link>
      </div>

      {/* 萌可总教练 */}
      <div className="card-moko flex items-center gap-5 mb-6 bg-gradient-to-r from-moko-violet to-moko-purple text-white p-6">
        <motion.img
          src="/moko/lemei.jpg"
          alt="乐美萌可"
          className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div>
          <h1 className="text-3xl font-black">🧮 萌可算法学院</h1>
          <p className="text-lg opacity-90 mt-1">不只是算得快！更要想得清楚、做得巧妙～</p>
        </div>
      </div>

      {/* 提示卡片 */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow border-l-4 border-moko-gold border-2 border-moko-gold/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <div className="font-black text-gray-800 mb-1">为什么要学计算技巧？</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              掌握计算方法之后，遇到复杂的计算就不用怕了！每一个技巧都是一个「魔法」，
              学会之后能快速算出原来觉得很复杂的题。
            </p>
          </div>
        </div>
      </div>

      {/* 十大技巧卡片 */}
      <h2 className="section-title mb-4">✨ 学习这十大魔法技巧</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ALGORITHM_TOPICS.map((topic, idx) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Link
              href={`/algorithm/${topic.id}`}
              className={`block rounded-3xl overflow-hidden shadow-lg border-2 border-white/40 bg-gradient-to-r ${topic.moko.color} text-white hover:scale-[1.02] active:scale-[0.98] transition`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{topic.mantraEmoji}</span>
                    <div>
                      <h3 className="text-xl font-black">{topic.name}</h3>
                      <p className="text-sm opacity-90 mt-0.5">{topic.description.slice(0, 20)}...</p>
                    </div>
                  </div>
                  <img
                    src={topic.moko.img}
                    alt={topic.moko.name}
                    className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/25 px-2 py-1 rounded-full font-bold">
                    🎯 10 个关卡 · 100 道题
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
