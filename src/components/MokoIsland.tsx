'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface MokoIslandItem {
  href: string;
  label: string;
  moko: { name: string; img: string; emoji: string; color: string };
  line: string;
}

/**
 * 萌可灵动岛 —— 首页顶部横滑推荐条
 * 萌可探出头说一句个性化的话，数据来源 progress-store
 */
export function MokoIsland({ items }: { items: MokoIslandItem[] }) {
  if (!items.length) return null;

  return (
    <section aria-label="推荐" className="mb-6">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
        {items.map((item, i) => (
          <Link
            key={item.href + i}
            href={item.href}
            className="relative flex-shrink-0 w-72 sm:w-80 snap-start rounded-3xl shadow-lg border-2 border-white/60 overflow-hidden transition hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${item.moko.color.includes('pink') ? '#ffafc9' : item.moko.color.includes('purple') ? '#c9b8fd' : item.moko.color.includes('blue') ? '#8fd6fc' : item.moko.color.includes('yellow') ? '#fde68a' : item.moko.color.includes('green') ? '#86efac' : item.moko.color.includes('orange') ? '#fdba74' : '#fbcfe8'} 0%, ${item.moko.color.includes('pink') ? '#ff6fa5' : item.moko.color.includes('purple') ? '#a78bfa' : item.moko.color.includes('blue') ? '#38bdf8' : item.moko.color.includes('yellow') ? '#fcd34d' : item.moko.color.includes('green') ? '#4ade80' : item.moko.color.includes('orange') ? '#fb923c' : '#f472b6'} 100%)`,
            }}
          >
            <div className="flex items-center gap-3 p-3">
              {/* 萌可头像 */}
              <motion.div
                className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden border-4 border-white shadow-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, delay: i * 0.1 }}
                whileHover={{ rotate: [0, -5, 5, 0] }}
              >
                <Image src={item.moko.img} alt={item.moko.name} fill className="object-cover" sizes="64px" />
              </motion.div>
              {/* 对话框 */}
              <div className="relative flex-1 min-w-0">
                <div className="bg-white/90 backdrop-blur rounded-2xl rounded-bl-none px-3 py-2 shadow-sm relative">
                  <div className="absolute -left-2 top-3 w-3 h-3 bg-white/90 rotate-45" />
                  <p className="text-sm font-bold text-gray-700 leading-snug">{item.line}</p>
                </div>
                <p className="text-[10px] text-white/80 font-bold mt-1 ml-1">{item.moko.name} 推荐 →</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
