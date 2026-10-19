'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReviewBadge from '@/components/ReviewBadge';

const TOOLS = [
  { href: '/study/talk', emoji: '🗣️', title: '看图说话', sub: '看场景说 3 句话，录下自己的声音' },
  { href: '/study/picto', emoji: '🌟', title: '象形字变变变', sub: '汉字怎么从「画」变成「字」' },
  { href: '/study/trace', emoji: '✍️', title: '描红跟写', sub: '米字格描红范字，听读音记字形' },
  {
    href: '/study/poem-fill',
    emoji: '📜',
    title: '古诗填空背诵',
    sub: '从字卡补全古诗，填对听萌可念',
  },
  { href: '/study/eye', emoji: '💆', title: '护眼小操', sub: '四节眼保健操，看书久了做一遍' },
];

const cards = [
  {
    key: 'chinese',
    label: '语文城堡',
    sub: '爱心萌可陪你学拼音、识字、古诗、描红',
    img: '/moko/heartping.webp',
    color: 'bg-moko-pink',
    border: 'border-moko-pink/30',
    clay: 'clay-pink',
  },
  {
    key: 'math',
    label: '数学星球',
    sub: '正正萌可带你认数、比较、看角、练加减',
    img: '/moko/courageping.webp',
    color: 'bg-moko-blue',
    border: 'border-moko-blue/30',
    clay: 'clay-blue',
  },
  {
    key: 'english',
    label: '英语乐园',
    sub: '唱唱萌可教你字母、单词、听读练习',
    img: '/moko/singping.webp',
    color: 'bg-moko-yellow',
    border: 'border-moko-yellow/30',
    clay: 'clay-gold',
  },
];

function ReviewBadgeClient() {
  const [due, setDue] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/mistakes')
      .then((r) => r.json())
      .then((d) => setDue(d.total ?? 0))
      .catch(() => setDue(0));
  }, []);

  return (
    <Link
      href="/study/review"
      className="block rounded-2xl p-4 bg-gradient-to-r from-moko-purple to-moko-violet text-white clay-dark hover:scale-[1.02] transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-black">📝 我的复习本</div>
          <div className="text-sm opacity-90">
            {due === null
              ? '加载中…'
              : due > 0
                ? `今天有 ${due} 个要复习，加油！`
                : '暂时没有要复习的，真棒！'}
          </div>
        </div>
        <div className="text-3xl">➡️</div>
      </div>
    </Link>
  );
}

function MokoHelperClient({ subject, tips }: { subject: string; tips: string[] }) {
  return (
    <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-pink to-rose-300 text-white shadow-lg text-center">
      <div className="text-4xl mb-1">🏠</div>
      <h2 className="text-2xl font-black">{subject}萌可</h2>
      <p className="text-sm opacity-90 mt-1">{tips[0]}</p>
    </div>
  );
}

function StudyRecommendClient({
  rec,
}: {
  rec: { resumeHref: string; resumeLabel: string; nextHref: string; nextLabel: string } | null;
}) {
  if (!rec) return null;

  return (
    <div className="mt-2 mb-7 flex items-center gap-4 flex-wrap">
      <Link
        href={rec.resumeHref}
        className="px-5 py-2.5 rounded-full bg-moko-rose text-white font-black text-base shadow-md active:scale-95 transition"
      >
        ▶ 继续学习
      </Link>
      <Link
        href={rec.nextHref}
        className="px-5 py-2.5 rounded-full bg-moko-gold text-white font-black text-base shadow-md active:scale-95 transition"
      >
        {rec.nextLabel}
      </Link>
    </div>
  );
}

interface StudyClientProps {
  rec: {
    resumeHref: string;
    resumeLabel: string;
    nextHref: string;
    nextLabel: string;
  } | null;
}

export function StudyClient({ rec }: StudyClientProps) {
  return (
    <>
      {/* 页头（h1/副标题）由外层 RSC page.tsx 持有——此前这里还有一份
          重复的 h1 + max-w-4xl 容器，页面上「学习城堡」标题出现两次。
          Client 组件只负责交互内容；容器也归 RSC，避免双层 max-w。 */}
      <MokoHelperClient
        subject="语文"
        tips={[
          '欢迎来到学习城堡！今天想和爱心萌可先挑战哪一科呀？',
          '每打开一个模块认真玩，城堡里就会多一只萌可陪你哦～',
          '遇到难题按「换一句」，萌可随时给你打气，别怕！',
        ]}
      />

        <StudyRecommendClient rec={rec} />

        <div className="mb-6">
          <ReviewBadgeClient />
        </div>

        {/* 三大主学科 */}
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((s) => {
            const textColor = s.color.replace('bg-', 'text-');
            return (
              <a
                key={s.key}
                href={`/study/${s.key}`}
                className={`clay-card clay-theme ${s.clay} rounded-3xl p-5 ${s.color} text-white hover:scale-105 transition block`}
              >
                <Image
                  src={s.img}
                  alt={s.label}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-4 border-white shadow mx-auto object-cover"
                />
                <h2 className={`text-2xl font-black ${s.color.replace('bg-', 'text-')} mb-2`}>
                  {s.label}
                </h2>
                <p className="text-white/80">{s.sub}</p>
              </a>
            );
          })}
        </div>

        {/* 趣味表达与练习 */}
        <h2 className="text-2xl font-black text-moko-violet mt-10 mb-3">🎨 趣味表达与练习</h2>
        {/* 5 张工具卡（emoji+标题+副标题+箭头）。⚠️ 用户四轮反馈同一区块：
            平板上仍显示成一行穿出。本地四视口实测已是多行 grid——
            怀疑 NAS 跑的是修复前镜像；但为了绝对保险，本版做防御性
            三重锁：
            a) 容器永不横向 flex（grid 语义）
            b) 每卡 max-w-full —— 任何情况下卡不超出列宽
            c) 卡内 emoji flex-shrink-0（不被压缩消失）+ 文本 truncate
            断点策略：<1280 单列（平板横竖屏都安全），1280+ 两列。 */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex max-w-full items-center gap-4 rounded-2xl p-4 clay-card bg-white text-center hover:scale-[1.02] transition"
            >
              <span className="text-4xl flex-shrink-0">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-moko-violet">{t.title}</h3>
                <p className="text-gray-500 truncate">{t.sub}</p>
              </div>
              <span className="text-moko-violet font-black flex-shrink-0">打开 ›</span>
            </Link>
          ))}
        </div>

        {/* 课本 & 绘本 */}
        <Link
          href="/textbook"
          className="mt-6 flex items-center gap-4 rounded-3xl p-5 clay-card clay-theme clay-gold bg-gradient-to-r from-moko-gold/20 to-moko-yellow/20 hover:scale-[1.02] transition block"
        >
          <span className="text-4xl mb-1">📖</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-moko-violet">电子课本 & 英语绘本</h2>
            <p className="text-gray-500 mb-4">一年级上册语文·数学课本，还有 RAZ 英语绘本跟读</p>
          </div>
          <span className="text-moko-violet font-bold">打开 ›</span>
        </Link>

        <div className="mt-8 rounded-2xl p-5 bg-white clay-card clay-theme clay-violet">
          <h3 className="text-lg font-black text-moko-violet mb-2">💡 给程程的小提示</h3>
          <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
            <li>自主学习内容每天都可以点开来玩，不消耗积分。</li>
            <li>完成爸爸妈妈布置的「学习任务」打卡，才能解锁对应学科的萌可哦。</li>
            <li>英语点读和录音需要开启设备声音与麦克风权限。</li>
          </ul>
        </div>
    </>
  );
}
