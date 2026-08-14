'use client';

import Link from 'next/link';
import { STUDY_MODULES } from '@/lib/study-modules';

/**
 * 模块间的「学完引导」——推荐下一步学习路径。
 * 孩子学完一个模块后，在页面底部提示「接下来可以试试 X」。
 */
const NEXT_STEP: Record<string, { subject: string; key: string; reason: string }> = {
  // 语文
  characters: { subject: 'chinese', key: 'strokes-order', reason: '学了字，再看看它们怎么写' },
  pinyin: { subject: 'chinese', key: 'pinyin-blend', reason: '学了拼音，拼一拼试试' },
  pinyin_blend: { subject: 'chinese', key: 'pinyin', reason: '拼拼读读，回拼音乐园巩固' },
  poems: { subject: 'chinese', key: 'poem-fun', reason: '读了几首诗，来玩古诗游乐场' },
  texts: { subject: 'chinese', key: 'textchars', reason: '读了课文，认认里面的生字' },
  lessons: { subject: 'chinese', key: 'strokes-order', reason: '学了生字，看看笔顺怎么写' },
  proverbs: { subject: 'chinese', key: 'word-form', reason: '学了谚语，试试组词造句' },
  nursery_rhymes: { subject: 'chinese', key: 'finger-read', reason: '念了儿歌，试试指读高亮' },
  // 数学
  count: { subject: 'math', key: 'compare', reason: '数了数，比比谁多谁少' },
  compare: { subject: 'math', key: 'split', reason: '会比大小了，试试分与合' },
  split: { subject: 'math', key: 'calc', reason: '分与合学会了，加减法闯关' },
  calc: { subject: 'math', key: 'word-problem', reason: '会算了，来做应用题' },
  clock: { subject: 'math', key: 'clock-half', reason: '认识整时了，再学半点' },
  shape: { subject: 'math', key: 'solid', reason: '学了平面图形，看看立体图形' },
  // 英语
  letters: { subject: 'english', key: 'words', reason: '字母学会了，来认单词' },
  words: { subject: 'english', key: 'sentences', reason: '学了些词，试试连成句子' },
  phonics: { subject: 'english', key: 'words', reason: '学了自然拼读，用单词练练' },
  en_songs: { subject: 'english', key: 'words', reason: '唱了儿歌，认认里面的单词' },
};

export function NextStepGuide({ subject, moduleKey }: { subject: string; moduleKey: string }) {
  const next = NEXT_STEP[moduleKey];
  if (!next) return null;

  const list = STUDY_MODULES[next.subject] ?? [];
  const meta = list.find((m) => m.key === next.key);
  if (!meta) return null;

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-r from-moko-purple/10 to-moko-pink/10 border-2 border-moko-purple/20 mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-moko-purple mb-0.5">✨ 接下来可以试试</div>
          <div className="font-black text-moko-violet">{meta.emoji} {meta.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{next.reason}</div>
        </div>
        <Link
          href={`/study/${next.subject}/${next.key}`}
          className="shrink-0 px-4 py-2 rounded-full bg-moko-purple text-white font-bold text-sm shadow active:scale-95 transition"
        >
          去看看 ›
        </Link>
      </div>
    </div>
  );
}